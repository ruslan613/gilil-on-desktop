'use strict';

const { getDb } = require('./db');
const {
  canSeeActivity,
  canSeeUser,
  isGeneralAdmin,
  visibleUserIds,
  forbid,
} = require('./acl');

function logActivity(userId, { action, sessionId, entityType, entityId, funnelStep, detail, ip }) {
  getDb()
    .prepare(
      `INSERT INTO activity_log
        (user_id, session_id, action, entity_type, entity_id, funnel_step, detail, ip)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      userId,
      sessionId || null,
      action,
      entityType || null,
      entityId != null ? String(entityId) : null,
      funnelStep || null,
      detail || null,
      ip || null
    );
}

function startSession(userId, { ip, userAgent, sessionToken } = {}) {
  const info = getDb()
    .prepare(
      `INSERT INTO activity_sessions (user_id, session_token, ip, user_agent)
       VALUES (?, ?, ?, ?)`
    )
    .run(userId, sessionToken || null, ip || null, userAgent || null);
  return Number(info.lastInsertRowid);
}

function touchSession(sessionId) {
  if (!sessionId) return;
  getDb()
    .prepare(`UPDATE activity_sessions SET last_seen_at = datetime('now') WHERE id = ?`)
    .run(sessionId);
}

function endSession(sessionId) {
  if (!sessionId) return;
  getDb()
    .prepare(
      `UPDATE activity_sessions SET ended_at = datetime('now'), last_seen_at = datetime('now') WHERE id = ?`
    )
    .run(sessionId);
}

function mountActivityRoutes(app, { authMiddleware }) {
  // Journal read: general_admin only (JWT role). Heartbeat remains for all authed users.
  app.get('/api/activity', authMiddleware, (req, res) => {
    if (!canSeeActivity(req.user)) return forbid(res, 'activity_forbidden');
    const db = getDb();
    const userId = req.query.user_id != null ? Number(req.query.user_id) : null;
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
    const ids = visibleUserIds(db, req.user);
    if (userId != null) {
      if (!ids.includes(userId)) return forbid(res);
      const rows = db
        .prepare(
          `SELECT a.*, u.display_name, u.username, u.role
           FROM activity_log a JOIN users u ON u.id = a.user_id
           WHERE a.user_id = ? ORDER BY a.id DESC LIMIT ?`
        )
        .all(userId, limit);
      return res.json({ items: rows });
    }
    const placeholders = ids.map(() => '?').join(',');
    const rows = db
      .prepare(
        `SELECT a.*, u.display_name, u.username, u.role
         FROM activity_log a JOIN users u ON u.id = a.user_id
         WHERE a.user_id IN (${placeholders})
         ORDER BY a.id DESC LIMIT ?`
      )
      .all(...ids, limit);
    res.json({ items: rows });
  });

  app.get('/api/activity/sessions', authMiddleware, (req, res) => {
    if (!canSeeActivity(req.user)) return forbid(res, 'activity_forbidden');
    const db = getDb();
    const ids = visibleUserIds(db, req.user);
    const placeholders = ids.map(() => '?').join(',');
    const rows = db
      .prepare(
        `SELECT s.*, u.display_name, u.username
         FROM activity_sessions s JOIN users u ON u.id = s.user_id
         WHERE s.user_id IN (${placeholders})
         ORDER BY s.last_seen_at DESC LIMIT 200`
      )
      .all(...ids);
    res.json({ items: rows });
  });

  app.post('/api/activity/heartbeat', authMiddleware, (req, res) => {
    const action = String((req.body && req.body.action) || 'heartbeat');
    const entityType = req.body && req.body.entity_type;
    const entityId = req.body && req.body.entity_id;
    const funnelStep = req.body && req.body.funnel_step;
    logActivity(req.user.id, {
      action,
      entityType,
      entityId,
      funnelStep,
      ip: req.authMeta && req.authMeta.ip,
      detail: req.body && req.body.detail,
    });
    res.json({ ok: true });
  });

  // Current work stage summary for bosses
  app.get('/api/activity/summary', authMiddleware, (req, res) => {
    if (!canSeeActivity(req.user)) return forbid(res, 'activity_forbidden');
    const db = getDb();
    const ids = visibleUserIds(db, req.user).filter((id) => id !== req.user.id || isGeneralAdmin(req.user));
    if (!ids.length) return res.json({ items: [] });
    const placeholders = ids.map(() => '?').join(',');
    const items = ids.map((uid) => {
      const user = db
        .prepare('SELECT id, username, display_name, role, region FROM users WHERE id = ?')
        .get(uid);
      const last = db
        .prepare(
          `SELECT action, entity_type, entity_id, funnel_step, created_at
           FROM activity_log WHERE user_id = ? ORDER BY id DESC LIMIT 1`
        )
        .get(uid);
      const session = db
        .prepare(
          `SELECT * FROM activity_sessions WHERE user_id = ? AND ended_at IS NULL
           ORDER BY id DESC LIMIT 1`
        )
        .get(uid);
      return {
        user,
        last_action: last || null,
        active_session: session || null,
      };
    });
    res.json({ items });
  });
}

module.exports = {
  logActivity,
  startSession,
  touchSession,
  endSession,
  mountActivityRoutes,
};
