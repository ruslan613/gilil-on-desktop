'use strict';

/**
 * Outbound mail for OTP.
 *
 * Priority:
 *   1. Gmail API over OAuth2 (GMAIL_CLIENT_ID + GMAIL_CLIENT_SECRET + GMAIL_REFRESH_TOKEN)
 *      — dependency-free, uses Node built-in fetch (Node 18+).
 *   2. SMTP via nodemailer (GMAIL_USER + GMAIL_APP_PASSWORD/GMAIL_PASS, or SMTP_*).
 *   3. MOCK — log «почта не настроена», server stays up.
 *
 * On Gmail API error: log the error, fall back to SMTP if configured,
 * otherwise log the message (incl. code) so login is not broken.
 */

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';

function hasGmailOAuthCreds() {
  return !!(
    process.env.GMAIL_CLIENT_ID &&
    process.env.GMAIL_CLIENT_SECRET &&
    process.env.GMAIL_REFRESH_TOKEN
  );
}

function hasGmailCreds() {
  return !!(
    process.env.GMAIL_USER &&
    (process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS)
  );
}

function hasSmtpCreds() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function forcedMock() {
  return process.env.AUTH_OTP_MOCK === '1' || process.env.AUTH_OTP_MOCK === 'true';
}

function isMockMail() {
  if (forcedMock()) return true;
  return !(hasGmailOAuthCreds() || hasGmailCreds() || hasSmtpCreds());
}

/** Active mode: 'gmail-api' | 'smtp-gmail' | 'smtp' | 'mock' */
function mailMode() {
  if (forcedMock()) return 'mock';
  if (hasGmailOAuthCreds()) return 'gmail-api';
  if (hasGmailCreds()) return 'smtp-gmail';
  if (hasSmtpCreds()) return 'smtp';
  return 'mock';
}

function allowMockCodeInResponse() {
  const env = (process.env.NODE_ENV || 'development').toLowerCase();
  return (
    isMockMail() &&
    (env === 'development' || env === 'dev' || env === 'mock' || process.env.AUTH_OTP_MOCK === '1')
  );
}

// ───────────────────────── MIME helpers ─────────────────────────

function base64url(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input), 'utf8');
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** RFC 2047 encoded-word for non-ASCII header values. */
function encodeHeader(value) {
  const s = String(value == null ? '' : value);
  // eslint-disable-next-line no-control-regex
  if (/^[\x20-\x7e]*$/.test(s)) return s;
  return `=?UTF-8?B?${Buffer.from(s, 'utf8').toString('base64')}?=`;
}

/** Strip CR/LF to prevent header injection. */
function cleanHeader(value) {
  return String(value == null ? '' : value).replace(/[\r\n]+/g, ' ').trim();
}

/** Encode "Name <addr>" display name if non-ASCII; plain addresses pass through. */
function encodeAddress(value) {
  const s = cleanHeader(value);
  const m = s.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (m && m[1]) return `${encodeHeader(m[1])} <${m[2]}>`;
  return s;
}

function wrap76(b64) {
  return b64.replace(/.{1,76}/g, '$&\r\n').replace(/\r\n$/, '');
}

/**
 * Build an RFC 2822 message. text/plain only, or multipart/alternative when html given.
 * All bodies are UTF-8 + base64 transfer encoding.
 */
function buildMimeMessage({ from, to, subject, text, html }) {
  const headers = [];
  if (from) headers.push(`From: ${encodeAddress(from)}`);
  headers.push(`To: ${encodeAddress(to)}`);
  headers.push(`Subject: ${encodeHeader(cleanHeader(subject))}`);
  headers.push('MIME-Version: 1.0');

  const textB64 = wrap76(Buffer.from(String(text || ''), 'utf8').toString('base64'));

  if (!html) {
    headers.push('Content-Type: text/plain; charset=UTF-8');
    headers.push('Content-Transfer-Encoding: base64');
    return `${headers.join('\r\n')}\r\n\r\n${textB64}\r\n`;
  }

  const boundary = `=_gilil_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
  const htmlB64 = wrap76(Buffer.from(String(html), 'utf8').toString('base64'));
  headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
  return [
    headers.join('\r\n'),
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    textB64,
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    htmlB64,
    `--${boundary}--`,
    '',
  ].join('\r\n');
}

// ───────────────────────── Gmail API (OAuth2) ─────────────────────────

let tokenCache = { accessToken: null, expiresAt: 0 };

function resetTokenCache() {
  tokenCache = { accessToken: null, expiresAt: 0 };
}

async function getAccessToken() {
  const now = Date.now();
  if (tokenCache.accessToken && now < tokenCache.expiresAt) return tokenCache.accessToken;

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: process.env.GMAIL_CLIENT_ID,
    client_secret: process.env.GMAIL_CLIENT_SECRET,
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    resetTokenCache();
    const hint = data.error === 'invalid_grant'
      ? ' (refresh token отозван/истёк — для приложения в режиме Testing он живёт 7 дней; получите новый: node scripts/gmail-oauth-token.js)'
      : '';
    throw new Error(`gmail oauth token error ${res.status}: ${data.error || ''} ${data.error_description || ''}${hint}`.trim());
  }
  const ttlSec = Number(data.expires_in) || 3600;
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: now + Math.max(0, ttlSec - 60) * 1000,
  };
  return tokenCache.accessToken;
}

async function sendViaGmailApi({ to, subject, text, html }) {
  const from = process.env.SMTP_FROM || process.env.GMAIL_USER || '';
  const raw = base64url(buildMimeMessage({ from, to, subject, text, html }));

  let accessToken = await getAccessToken();
  const doSend = (tok) => fetch(SEND_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw }),
  });

  let res = await doSend(accessToken);
  if (res.status === 401) {
    // cached token rejected — refresh once
    resetTokenCache();
    accessToken = await getAccessToken();
    res = await doSend(accessToken);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data.error && (data.error.message || data.error.status)) || res.statusText;
    throw new Error(`gmail api send error ${res.status}: ${msg}`);
  }
  console.log('[mail:gmail-api] sent', { to, id: data.id });
  return { mock: false, mode: 'gmail-api', messageId: data.id };
}

// ───────────────────────── SMTP / log ─────────────────────────

async function sendViaSmtp({ to, subject, text, html }) {
  // eslint-disable-next-line global-require
  const nodemailer = require('nodemailer');
  let transport;
  let from;

  if (hasGmailCreds()) {
    transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS,
      },
    });
    from = process.env.SMTP_FROM || process.env.GMAIL_USER;
  } else {
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    from = process.env.SMTP_FROM || process.env.SMTP_USER;
  }

  const info = await transport.sendMail({ from, to, subject, text, html });
  console.log('[mail] sent', { to, messageId: info.messageId });
  return { mock: false, mode: hasGmailCreds() ? 'smtp-gmail' : 'smtp', messageId: info.messageId };
}

function logMail({ to, subject, text }, reason) {
  console.log('[mail:MOCK] ──────────────────────────────────');
  console.log('[mail:MOCK]', reason);
  console.log('[mail:MOCK] to:', to);
  console.log('[mail:MOCK] subject:', subject);
  console.log('[mail:MOCK] text:', text);
  console.log('[mail:MOCK] ──────────────────────────────────');
  return { mock: true, reason };
}


// ───────────────────────── SMTP allowlist ─────────────────────────
// Who may use the shared SMTP / Gmail mailbox for outbound mail.
// Policy (SMTP_ALLOWLIST_ENFORCE=1 → fail-closed if empty):
//   • OTP / system sends: check destination `to` is on the allowlist
//     (only listed addresses may receive codes via this mailbox).
//   • Actor-initiated sends (future): pass opts.actorEmail — that email
//     must be on the allowlist (who may initiate outbound).
// Reject with err.code = 'smtp_sender_not_allowed' (routes → HTTP 403).

function allowlistEnforceOn() {
  const v = String(process.env.SMTP_ALLOWLIST_ENFORCE || '').toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

function extractEmailAddress(value) {
  const s = String(value == null ? '' : value).trim();
  const m = s.match(/<([^>]+)>/);
  const raw = (m ? m[1] : s).trim().toLowerCase();
  return raw;
}

function makeSmtpAllowlistError(message) {
  const err = new Error(message || 'Адрес не в белом списке SMTP');
  err.code = 'smtp_sender_not_allowed';
  err.status = 403;
  return err;
}

function countActiveAllowlist() {
  // lazy require to avoid circular init
  // eslint-disable-next-line global-require
  const { getDb } = require('./db');
  return getDb()
    .prepare('SELECT COUNT(*) AS c FROM smtp_senders_allowlist WHERE active = 1')
    .get().c;
}

function isEmailOnSmtpAllowlist(email) {
  const e = extractEmailAddress(email);
  if (!e) return false;
  // eslint-disable-next-line global-require
  const { getDb } = require('./db');
  const row = getDb()
    .prepare(
      `SELECT id FROM smtp_senders_allowlist
       WHERE active = 1 AND email = ? COLLATE NOCASE`
    )
    .get(e);
  return !!row;
}

/**
 * @param {{ to?: string }} msg
 * @param {{ actorEmail?: string, kind?: 'otp'|'actor'|'system' }} [opts]
 */
function assertSmtpAllowlist(msg, opts) {
  if (!allowlistEnforceOn()) return;
  const o = opts || {};
  const active = countActiveAllowlist();
  if (active === 0) {
    throw makeSmtpAllowlistError(
      'SMTP allowlist пуст при SMTP_ALLOWLIST_ENFORCE=1 (fail-closed)'
    );
  }
  // Actor-initiated: check who initiates outbound via shared SMTP.
  if (o.actorEmail) {
    if (!isEmailOnSmtpAllowlist(o.actorEmail)) {
      throw makeSmtpAllowlistError(
        `Инициатор не в белом списке SMTP: ${extractEmailAddress(o.actorEmail)}`
      );
    }
    return;
  }
  // OTP / system: destination must be listed (Ruslan: only listed addresses use the mailbox).
  const to = extractEmailAddress(msg && msg.to);
  if (!to || !isEmailOnSmtpAllowlist(to)) {
    throw makeSmtpAllowlistError(
      `Получатель не в белом списке SMTP: ${to || '(пусто)'}`
    );
  }
}

async function sendMail(msg, opts) {
  // Enforce allowlist before any real (or mock) outbound via shared mailbox.
  assertSmtpAllowlist(msg, opts || {});

  if (isMockMail()) {
    const reason = forcedMock()
      ? 'AUTH_OTP_MOCK=1'
      : 'почта не настроена (нет GMAIL_CLIENT_ID/SECRET/REFRESH_TOKEN, GMAIL_APP_PASSWORD, SMTP_PASS)';
    return logMail(msg, reason);
  }

  if (hasGmailOAuthCreds()) {
    try {
      return await sendViaGmailApi(msg);
    } catch (e) {
      console.error('[mail:gmail-api] ОШИБКА отправки через Gmail API:', e.message);
      if (hasGmailCreds() || hasSmtpCreds()) {
        console.error('[mail:gmail-api] fallback → SMTP');
        return sendViaSmtp(msg);
      }
      return logMail(msg, `Gmail API недоступен (${e.message}) — fallback: код только в логе`);
    }
  }

  return sendViaSmtp(msg);
}

module.exports = {
  isMockMail,
  allowMockCodeInResponse,
  sendMail,
  mailMode,
  hasGmailOAuthCreds,
  hasGmailCreds,
  hasSmtpCreds,
  allowlistEnforceOn,
  isEmailOnSmtpAllowlist,
  assertSmtpAllowlist,
  makeSmtpAllowlistError,
  extractEmailAddress,
  // exported for tests
  base64url,
  encodeHeader,
  buildMimeMessage,
  getAccessToken,
  resetTokenCache,
};
