'use strict';

const { getDb } = require('./db');

/** @type {null | ((userId: number, payload: object) => void)} */
let pushFn = null;

function setNotificationPusher(fn) {
  pushFn = typeof fn === 'function' ? fn : null;
}

function createNotification({ userId, type, title, body, meta }) {
  const info = getDb()
    .prepare(
      `INSERT INTO notifications (user_id, type, title, body, meta_json)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(
      userId,
      type || 'info',
      title || '',
      body || null,
      meta ? JSON.stringify(meta) : null
    );
  const item = {
    id: Number(info.lastInsertRowid),
    user_id: userId,
    type,
    title,
    body: body || null,
    meta: meta || null,
    read: 0,
    created_at: new Date().toISOString(),
  };
  if (pushFn) {
    try {
      pushFn(userId, { type: 'notification', item });
    } catch (_) {}
  }
  return item;
}

function notifyAdmins({ type, title, body, meta }) {
  const admins = getDb()
    .prepare(
      `SELECT id FROM users WHERE active = 1 AND role IN ('general_admin','director')`
    )
    .all();
  return admins.map((a) =>
    createNotification({ userId: a.id, type, title, body, meta })
  );
}

function mountNotificationRoutes(app, { authMiddleware }) {
  app.get('/api/notifications', authMiddleware, (req, res) => {
    const rows = getDb()
      .prepare(
        `SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 100`
      )
      .all(req.user.id)
      .map((r) => ({
        ...r,
        meta: r.meta_json ? JSON.parse(r.meta_json) : null,
        meta_json: undefined,
      }));
    res.json({ items: rows });
  });

  app.post('/api/notifications/:id/read', authMiddleware, (req, res) => {
    getDb()
      .prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?')
      .run(Number(req.params.id), req.user.id);
    res.json({ ok: true });
  });

  app.post('/api/notifications/read-all', authMiddleware, (req, res) => {
    const info = getDb()
      .prepare('UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0')
      .run(req.user.id);
    res.json({ ok: true, updated: info.changes });
  });
}

module.exports = {
  createNotification,
  notifyAdmins,
  setNotificationPusher,
  mountNotificationRoutes,
};
