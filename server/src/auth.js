'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('./db');
const {
  isGeneralAdmin,
  canSeeUser,
  forbid,
} = require('./acl');
const { createNotification, notifyAdmins } = require('./notifications');
const { logActivity, startSession } = require('./activity');
const { sendMail, isMockMail, allowMockCodeInResponse } = require('./mail');

const ACCESS_TTL = '8h';
const REFRESH_TTL_REMEMBER_SEC = 30 * 24 * 60 * 60; // rememberMe
const REFRESH_TTL_SESSION_SEC = 1 * 24 * 60 * 60; // no rememberMe
const REFRESH_TTL_SEC = REFRESH_TTL_REMEMBER_SEC; // legacy alias

function jwtSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET env is required');
  return s;
}

function rateMax() {
  return Number(process.env.LOGIN_RATE_MAX) || 5;
}
function rateWindowMin() {
  return Number(process.env.LOGIN_RATE_WINDOW_MIN) || 15;
}

function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    region: row.region,
    display_name: row.display_name,
    locale: row.locale,
    manager_id: row.manager_id,
  };
}

function clientMeta(req) {
  const ip =
    (req.headers['x-forwarded-for'] &&
      String(req.headers['x-forwarded-for']).split(',')[0].trim()) ||
    req.ip ||
    (req.socket && req.socket.remoteAddress) ||
    null;
  const userAgent = req.headers['user-agent'] || null;
  return { ip, userAgent };
}

function logLoginAttempt({ username, userId, success, ip, userAgent, reason }) {
  getDb()
    .prepare(
      `INSERT INTO login_attempts (username, user_id, success, ip, user_agent, reason)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(username || '', userId || null, success ? 1 : 0, ip || null, userAgent || null, reason || null);
}

function logHackAttempt({ userId, username, action, detail, ip }) {
  getDb()
    .prepare(
      `INSERT INTO hack_attempts (user_id, username, action, detail, ip) VALUES (?, ?, ?, ?, ?)`
    )
    .run(userId || null, username || null, action, detail || null, ip || null);
}

function countRecentFails({ ip, username }) {
  const db = getDb();
  const since = `datetime('now', '-${rateWindowMin()} minutes')`;
  let byPair = 0;
  let byUser = 0;
  if (ip && username) {
    byPair = db
      .prepare(
        `SELECT COUNT(*) AS c FROM login_attempts
         WHERE success = 0 AND ip = ? AND username = ? AND created_at >= ${since}`
      )
      .get(ip, username).c;
  }
  if (username) {
    byUser = db
      .prepare(
        `SELECT COUNT(*) AS c FROM login_attempts
         WHERE success = 0 AND username = ? AND created_at >= ${since}`
      )
      .get(username).c;
  }
  return Math.max(byPair, byUser);
}

function rateLimitExceeded(ip, username) {
  return countRecentFails({ ip, username }) >= rateMax();
}

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      username: user.username,
      role: user.role,
      region: user.region,
      typ: 'access',
    },
    jwtSecret(),
    { expiresIn: ACCESS_TTL }
  );
}

function hashToken(raw) {
  return crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
}

function issueRefreshToken(userId, rememberMe) {
  const ttlSec = rememberMe ? REFRESH_TTL_REMEMBER_SEC : REFRESH_TTL_SESSION_SEC;
  const raw = crypto.randomBytes(48).toString('base64url');
  const expiresAt = new Date(Date.now() + ttlSec * 1000).toISOString();
  getDb()
    .prepare(`INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)`)
    .run(userId, hashToken(raw), expiresAt);
  return raw;
}

function issueSession(user, opts) {
  const rememberMe = !!(opts && opts.rememberMe);
  const access = signAccessToken(user);
  const refresh = issueRefreshToken(user.id, rememberMe);
  return {
    token: access,
    access_token: access,
    refresh_token: refresh,
    user: publicUser(user),
  };
}

/**
 * Detect new login IP → notify admins via notifications table.
 * Returns { isNew, geo }.
 */
function trackLoginIp(userId, ip, geo) {
  if (!ip) return { isNew: false, geo: null };
  const db = getDb();
  const existing = db
    .prepare('SELECT * FROM login_ips WHERE user_id = ? AND ip = ?')
    .get(userId, ip);
  if (existing) {
    db.prepare(
      `UPDATE login_ips SET last_seen_at = datetime('now'), login_count = login_count + 1,
       geo = COALESCE(?, geo) WHERE id = ?`
    ).run(geo || null, existing.id);
    return { isNew: false, geo: existing.geo || geo };
  }
  const prior = db.prepare('SELECT COUNT(*) AS c FROM login_ips WHERE user_id = ?').get(userId).c;
  db.prepare(
    `INSERT INTO login_ips (user_id, ip, geo) VALUES (?, ?, ?)`
  ).run(userId, ip, geo || null);
  const isNew = prior > 0; // first-ever IP is not "change"
  return { isNew, geo: geo || null };
}

function login(username, password, meta = {}) {
  const db = getDb();
  const { ip, userAgent } = meta;
  if (rateLimitExceeded(ip, username)) {
    logLoginAttempt({
      username,
      success: false,
      ip,
      userAgent,
      reason: 'rate_limited',
    });
    logHackAttempt({
      username,
      action: 'login_rate_limited',
      detail: 'too many failed attempts',
      ip,
    });
    const err = new Error('rate_limited');
    err.status = 429;
    err.retry_after_sec = rateWindowMin() * 60;
    throw err;
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ? AND active = 1').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    logLoginAttempt({
      username,
      userId: user ? user.id : null,
      success: false,
      ip,
      userAgent,
      reason: 'bad_credentials',
    });
    if (user) {
      logHackAttempt({
        userId: user.id,
        username,
        action: 'login_failed',
        detail: 'bad_credentials',
        ip,
      });
    }
    const err = new Error('invalid_credentials');
    err.status = 401;
    throw err;
  }

  logLoginAttempt({
    username,
    userId: user.id,
    success: true,
    ip,
    userAgent,
    reason: 'ok',
  });

  const ipTrack = trackLoginIp(user.id, ip, meta.geo || null);
  if (ipTrack.isNew) {
    notifyAdmins({
      type: 'login_ip_change',
      title: 'Новый IP входа',
      body: `${user.display_name} (${user.username}) вошёл с нового IP ${ip}${ipTrack.geo ? ' · ' + ipTrack.geo : ''}`,
      meta: { user_id: user.id, ip, geo: ipTrack.geo },
    });
  }

  const session = issueSession(user, { rememberMe: !!meta.rememberMe });
  startSession(user.id, { ip, userAgent, sessionToken: session.access_token.slice(0, 16) });
  logActivity(user.id, {
    action: 'login',
    ip,
    detail: JSON.stringify({ new_ip: ipTrack.isNew, rememberMe: !!meta.rememberMe }),
  });
  return { ...session, new_ip: ipTrack.isNew };
}

function authMiddleware(req, res, next) {
  const hdr = req.headers.authorization || '';
  const m = hdr.match(/^Bearer\s+(.+)$/i);
  if (!m) return res.status(401).json({ error: 'unauthorized' });
  try {
    const payload = jwt.verify(m[1], jwtSecret());
    if (payload.typ !== 'access') return res.status(401).json({ error: 'invalid_token_type' });
    const user = getDb().prepare('SELECT * FROM users WHERE id = ? AND active = 1').get(payload.sub);
    if (!user) return res.status(401).json({ error: 'user_not_found' });
    // Token role must match DB (prevent stale/forged role claims)
    if (payload.role !== user.role) {
      logHackAttempt({
        userId: user.id,
        username: user.username,
        action: 'token_role_mismatch',
        detail: `token=${payload.role} db=${user.role}`,
        ip: clientMeta(req).ip,
      });
      return res.status(401).json({ error: 'token_revoked' });
    }
    req.user = publicUser(user);
    req.userRow = user;
    req.authMeta = clientMeta(req);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'invalid_token' });
  }
}

/** Require one of roles; logs hack_attempts on fail. */
function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    if (roles.includes(req.user.role) || isGeneralAdmin(req.user)) return next();
    logHackAttempt({
      userId: req.user.id,
      username: req.user.username,
      action: 'acl_denied',
      detail: `need=${roles.join('|')} have=${req.user.role} path=${req.method} ${req.path}`,
      ip: (req.authMeta && req.authMeta.ip) || null,
    });
    return forbid(res, 'forbidden_role');
  };
}


const OTP_TTL_MS = (Number(process.env.OTP_TTL_MIN) || 10) * 60 * 1000;
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS) || 5;
const OTP_RESEND_SEC = Number(process.env.OTP_RESEND_SEC) || 60;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function generateOtpCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

function findUserByEmail(email) {
  const e = normalizeEmail(email);
  if (!e) return null;
  return getDb().prepare('SELECT * FROM users WHERE lower(email) = ? AND active = 1').get(e);
}

async function requestOtp(emailRaw, meta = {}) {
  const email = normalizeEmail(emailRaw);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const err = new Error('invalid_email');
    err.status = 400;
    throw err;
  }

  const db = getDb();
  const existing = db.prepare('SELECT * FROM otp_codes WHERE email = ?').get(email);
  if (existing) {
    const last = Date.parse(existing.last_sent_at);
    const wait = OTP_RESEND_SEC * 1000 - (Date.now() - last);
    if (Number.isFinite(last) && wait > 0) {
      const err = new Error('resend_cooldown');
      err.status = 429;
      err.retry_after_sec = Math.ceil(wait / 1000);
      throw err;
    }
  }

  const user = findUserByEmail(email);
  // Always behave as if ok when user missing (no account enumeration),
  // but do not store/send a code for unknown emails.
  if (!user) {
    logLoginAttempt({
      username: email,
      success: false,
      ip: meta.ip,
      userAgent: meta.userAgent,
      reason: 'otp_unknown_email',
    });
    const out = {
      ok: true,
      expires_in_sec: Math.floor(OTP_TTL_MS / 1000),
      resend_after_sec: OTP_RESEND_SEC,
      mock: isMockMail(),
    };
    if (allowMockCodeInResponse()) {
      out.hint = 'unknown_or_inactive_email';
    }
    return out;
  }

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();
  const nowIso = new Date().toISOString();
  db.prepare(
    `INSERT INTO otp_codes (email, code_hash, attempts, max_attempts, expires_at, last_sent_at)
     VALUES (?, ?, 0, ?, ?, ?)
     ON CONFLICT(email) DO UPDATE SET
       code_hash = excluded.code_hash,
       attempts = 0,
       max_attempts = excluded.max_attempts,
       expires_at = excluded.expires_at,
       last_sent_at = excluded.last_sent_at`
  ).run(email, hashToken(code), OTP_MAX_ATTEMPTS, expiresAt, nowIso);

  const subject = 'Gilil On — код входа';
  const text = `Ваш код входа в Gilil On: ${code}\n\nКод действует ${Math.floor(OTP_TTL_MS / 60000)} мин. Никому его не сообщайте.`;
  const html = `<p>Ваш код входа в <strong>Gilil On</strong>:</p><p style="font-size:28px;letter-spacing:6px;font-weight:700">${code}</p><p style="color:#666">Код действует ${Math.floor(OTP_TTL_MS / 60000)} мин. Никому его не сообщайте.</p>`;

  try {
    await sendMail({ to: email, subject, text, html }, { kind: 'otp' });
  } catch (e) {
    console.error('[otp] sendMail failed', e.message);
    // Roll back issued code so cooldown / verify do not apply after failed send.
    try { db.prepare('DELETE FROM otp_codes WHERE email = ?').run(email); } catch (_) {}
    if (e.code === 'smtp_sender_not_allowed' || e.status === 403) {
      const err = new Error('smtp_sender_not_allowed');
      err.status = 403;
      err.code = 'smtp_sender_not_allowed';
      err.detail = e.message;
      throw err;
    }
    const err = new Error('mail_send_failed');
    err.status = 502;
    throw err;
  }

  console.log(`[otp] code issued for ${email} (user=${user.username}) mock=${isMockMail()}`);
  if (isMockMail()) {
    console.log(`[otp:MOCK] почта не настроена — код только в логе: ${email} → ${code}`);
  }

  const out = {
    ok: true,
    expires_in_sec: Math.floor(OTP_TTL_MS / 1000),
    resend_after_sec: OTP_RESEND_SEC,
    mock: isMockMail(),
  };
  if (allowMockCodeInResponse()) {
    out.code = code;
  }
  return out;
}

function verifyOtp(emailRaw, codeRaw, meta = {}) {
  const email = normalizeEmail(emailRaw);
  const code = String(codeRaw || '').trim();
  if (!email || !/^\d{6}$/.test(code)) {
    const err = new Error('invalid_email_or_code');
    err.status = 400;
    throw err;
  }

  const db = getDb();
  const row = db.prepare('SELECT * FROM otp_codes WHERE email = ?').get(email);
  if (!row) {
    logLoginAttempt({
      username: email,
      success: false,
      ip: meta.ip,
      userAgent: meta.userAgent,
      reason: 'otp_not_found',
    });
    const err = new Error('invalid_code');
    err.status = 401;
    throw err;
  }

  if (Date.parse(row.expires_at) < Date.now()) {
    db.prepare('DELETE FROM otp_codes WHERE email = ?').run(email);
    logLoginAttempt({
      username: email,
      success: false,
      ip: meta.ip,
      userAgent: meta.userAgent,
      reason: 'otp_expired',
    });
    const err = new Error('code_expired');
    err.status = 401;
    throw err;
  }

  if (row.attempts >= (row.max_attempts || OTP_MAX_ATTEMPTS)) {
    logLoginAttempt({
      username: email,
      success: false,
      ip: meta.ip,
      userAgent: meta.userAgent,
      reason: 'otp_max_attempts',
    });
    logHackAttempt({
      username: email,
      action: 'otp_max_attempts',
      detail: 'too many verify attempts',
      ip: meta.ip,
    });
    const err = new Error('too_many_attempts');
    err.status = 429;
    throw err;
  }

  const ok = hashToken(code) === row.code_hash;
  if (!ok) {
    db.prepare('UPDATE otp_codes SET attempts = attempts + 1 WHERE email = ?').run(email);
    const left = (row.max_attempts || OTP_MAX_ATTEMPTS) - (row.attempts + 1);
    logLoginAttempt({
      username: email,
      success: false,
      ip: meta.ip,
      userAgent: meta.userAgent,
      reason: 'otp_bad_code',
    });
    const err = new Error('invalid_code');
    err.status = 401;
    err.attempts_left = Math.max(0, left);
    throw err;
  }

  // one-time
  db.prepare('DELETE FROM otp_codes WHERE email = ?').run(email);

  const user = findUserByEmail(email);
  if (!user) {
    const err = new Error('user_not_found');
    err.status = 401;
    throw err;
  }

  logLoginAttempt({
    username: user.username,
    userId: user.id,
    success: true,
    ip: meta.ip,
    userAgent: meta.userAgent,
    reason: 'otp_ok',
  });

  const ipTrack = trackLoginIp(user.id, meta.ip, meta.geo || null);
  if (ipTrack.isNew) {
    notifyAdmins({
      type: 'login_ip_change',
      title: 'Новый IP входа',
      body: `${user.display_name} (${user.username}) вошёл с нового IP ${meta.ip}${ipTrack.geo ? ' · ' + ipTrack.geo : ''} (OTP)`,
      meta: { user_id: user.id, ip: meta.ip, geo: ipTrack.geo, via: 'otp' },
    });
  }

  const session = issueSession(user, { rememberMe: !!meta.rememberMe });
  startSession(user.id, {
    ip: meta.ip,
    userAgent: meta.userAgent,
    sessionToken: session.access_token.slice(0, 16),
  });
  logActivity(user.id, {
    action: 'login_otp',
    ip: meta.ip,
    detail: JSON.stringify({ new_ip: ipTrack.isNew, email, rememberMe: !!meta.rememberMe }),
  });
  return { ...session, new_ip: ipTrack.isNew };
}

function mountAuthRoutes(app) {
  app.post('/api/auth/login', (req, res) => {
    try {
      const username = String((req.body && req.body.username) || '').trim();
      const password = String((req.body && req.body.password) || '');
      if (!username || !password) {
        return res.status(400).json({ error: 'username_password_required' });
      }
      const meta = {
        ...clientMeta(req),
        geo: req.body.geo || null,
        rememberMe: !!(req.body && req.body.rememberMe),
      };
      const out = login(username, password, meta);
      res.json(out);
    } catch (e) {
      const status = e.status || 500;
      const body = { error: e.message || 'login_failed' };
      if (e.retry_after_sec) body.retry_after_sec = e.retry_after_sec;
      res.status(status).json(body);
    }
  });

  app.post('/api/auth/otp/request', async (req, res) => {
    try {
      const email = (req.body && req.body.email) || '';
      const meta = clientMeta(req);
      const out = await requestOtp(email, meta);
      res.json(out);
    } catch (e) {
      const status = e.status || 500;
      const body = { error: e.message || 'otp_request_failed' };
      if (e.code === 'smtp_sender_not_allowed') {
        body.error = 'smtp_sender_not_allowed';
        body.message = e.detail || e.message || 'Адрес не в белом списке SMTP';
      }
      if (e.retry_after_sec) body.retry_after_sec = e.retry_after_sec;
      res.status(status).json(body);
    }
  });

  app.post('/api/auth/otp/verify', (req, res) => {
    try {
      const email = (req.body && req.body.email) || '';
      const code = (req.body && req.body.code) || '';
      const meta = {
        ...clientMeta(req),
        geo: (req.body && req.body.geo) || null,
        rememberMe: !!(req.body && req.body.rememberMe),
      };
      const out = verifyOtp(email, code, meta);
      res.json(out);
    } catch (e) {
      const status = e.status || 500;
      const body = { error: e.message || 'otp_verify_failed' };
      if (e.retry_after_sec) body.retry_after_sec = e.retry_after_sec;
      if (e.attempts_left != null) body.attempts_left = e.attempts_left;
      res.status(status).json(body);
    }
  });

  app.get('/api/auth/me', authMiddleware, (req, res) => {
    res.json({ user: req.user });
  });

  app.post('/api/auth/logout', authMiddleware, (req, res) => {
    logActivity(req.user.id, { action: 'logout', ip: req.authMeta.ip });
    res.json({ ok: true });
  });

  app.get('/api/users', authMiddleware, (req, res) => {
    const db = getDb();
    let rows;
    if (isGeneralAdmin(req.user)) {
      rows = db.prepare('SELECT * FROM users WHERE active = 1 ORDER BY id').all();
    } else if (req.user.role === 'director' || req.user.role === 'manager') {
      rows = db
        .prepare('SELECT * FROM users WHERE active = 1 AND (id = ? OR manager_id = ?) ORDER BY id')
        .all(req.user.id, req.user.id);
    } else {
      rows = db.prepare('SELECT * FROM users WHERE id = ?').all(req.user.id);
    }
    res.json({ users: rows.map(publicUser) });
  });

  app.get('/api/security/login-attempts', authMiddleware, requireRoles('general_admin'), (req, res) => {
    const rows = getDb()
      .prepare('SELECT * FROM login_attempts ORDER BY id DESC LIMIT 200')
      .all();
    res.json({ items: rows });
  });

  app.get('/api/security/hack-attempts', authMiddleware, requireRoles('general_admin'), (req, res) => {
    const rows = getDb()
      .prepare('SELECT * FROM hack_attempts ORDER BY id DESC LIMIT 200')
      .all();
    res.json({ items: rows });
  });

  app.get('/api/security/login-ips/:userId', authMiddleware, (req, res) => {
    const uid = Number(req.params.userId);
    if (!canSeeUser(getDb(), req.user, uid) && !isGeneralAdmin(req.user)) {
      return forbid(res);
    }
    const rows = getDb()
      .prepare('SELECT * FROM login_ips WHERE user_id = ? ORDER BY last_seen_at DESC')
      .all(uid);
    res.json({ items: rows });
  });
}

module.exports = {
  mountAuthRoutes,
  authMiddleware,
  requireRoles,
  publicUser,
  login,
  requestOtp,
  verifyOtp,
  clientMeta,
  logHackAttempt,
  jwtSecret,
};
