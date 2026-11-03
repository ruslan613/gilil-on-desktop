'use strict';

const { getDb } = require('./db');
const { isGeneralAdmin, isBoss, forbid } = require('./acl');
const { isMember, sendToUser } = require('./chat');
const { logActivity } = require('./activity');

const STATUSES = ['read', 'replied', 'in_progress', 'done'];
const STATUS_LABELS = {
  read: 'Прочёл',
  replied: 'Ответил',
  in_progress: 'В работе',
  done: 'Готово',
};

function rowToPublic(row) {
  if (!row) return null;
  const emp = getDb()
    .prepare('SELECT id, username, display_name, role FROM users WHERE id = ?')
    .get(row.employee_user_id);
  return {
    id: row.id,
    chat_id: row.chat_id,
    dialog_id: row.chat_id, // shell-v2 alias
    employee_user_id: row.employee_user_id,
    employee: emp
      ? { id: emp.id, username: emp.username, display_name: emp.display_name, role: emp.role }
      : null,
    status: row.status,
    status_label: STATUS_LABELS[row.status] || row.status,
    updated_at: row.updated_at,
  };
}

function pushStatus(item) {
  const payload = { type: 'reply_status', item };
  sendToUser(item.employee_user_id, payload);
  // notify bosses of that employee + general_admins
  const bosses = getDb()
    .prepare(
      `SELECT id FROM users WHERE role = 'general_admin'
       OR id = (SELECT manager_id FROM users WHERE id = ?)
       OR (role IN ('director','manager') AND region = (SELECT region FROM users WHERE id = ?))`
    )
    .all(item.employee_user_id, item.employee_user_id);
  for (const b of bosses) sendToUser(b.id, payload);
}

function mountReplyStatusRoutes(app, { authMiddleware }) {
  app.get('/api/reply-status', authMiddleware, (req, res) => {
    const db = getDb();
    let rows;
    if (isGeneralAdmin(req.user) || isBoss(req.user)) {
      rows = db
        .prepare('SELECT * FROM reply_status ORDER BY updated_at DESC LIMIT 500')
        .all();
      if (isBoss(req.user) && !isGeneralAdmin(req.user)) {
        rows = rows.filter((r) => {
          const u = db.prepare('SELECT manager_id FROM users WHERE id = ?').get(r.employee_user_id);
          return u && (u.manager_id === req.user.id || r.employee_user_id === req.user.id);
        });
      }
    } else {
      rows = db
        .prepare('SELECT * FROM reply_status WHERE employee_user_id = ? ORDER BY updated_at DESC')
        .all(req.user.id);
    }
    res.json({ items: rows.map(rowToPublic) });
  });

  app.put('/api/reply-status', authMiddleware, (req, res) => {
    const chatId = Number((req.body && (req.body.chat_id ?? req.body.dialog_id)));
    const status = String((req.body && req.body.status) || '');
    if (!Number.isFinite(chatId)) return res.status(400).json({ error: 'chat_id_required' });
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ error: 'invalid_status', allowed: STATUSES });
    }
    if (!isMember(chatId, req.user.id)) return forbid(res, 'not_a_member');
    getDb()
      .prepare(
        `INSERT INTO reply_status (chat_id, employee_user_id, status, updated_at)
         VALUES (?, ?, ?, datetime('now'))
         ON CONFLICT(chat_id, employee_user_id) DO UPDATE SET
           status = excluded.status, updated_at = datetime('now')`
      )
      .run(chatId, req.user.id, status);
    const row = getDb()
      .prepare('SELECT * FROM reply_status WHERE chat_id = ? AND employee_user_id = ?')
      .get(chatId, req.user.id);
    const item = rowToPublic(row);
    pushStatus(item);
    logActivity(req.user.id, {
      action: 'reply_status',
      entityType: 'chat',
      entityId: chatId,
      detail: status,
    });
    res.json({ item });
  });

  app.delete('/api/reply-status/:chatId', authMiddleware, (req, res) => {
    getDb()
      .prepare('DELETE FROM reply_status WHERE chat_id = ? AND employee_user_id = ?')
      .run(Number(req.params.chatId), req.user.id);
    res.json({ ok: true });
  });
}

module.exports = { mountReplyStatusRoutes, STATUSES, STATUS_LABELS };
