'use strict';

const { getDb } = require('./db');
const { isGeneralAdmin, isBoss, canSeeUser, forbid } = require('./acl');
const { decrypt } = require('./crypto');
const { isMember } = require('./chat');
const { createNotification } = require('./notifications');
const { logActivity } = require('./activity');
const { persistPlanStatus, ensureProjectColumns } = require('./projects');

function userBrief(id) {
  if (id == null) return null;
  const u = getDb()
    .prepare('SELECT id, username, role, display_name, region FROM users WHERE id = ?')
    .get(id);
  return u
    ? { id: u.id, username: u.username, role: u.role, display_name: u.display_name, region: u.region }
    : null;
}

function ensureTaskProjectColumns(db) {
  try {
    if (typeof ensureProjectColumns === 'function') ensureProjectColumns(db);
    else {
      const tcols = db.prepare('PRAGMA table_info(tasks)').all().map((c) => c.name);
      if (!tcols.includes('project_id')) db.exec('ALTER TABLE tasks ADD COLUMN project_id INTEGER');
      if (!tcols.includes('due_at')) db.exec('ALTER TABLE tasks ADD COLUMN due_at TEXT');
    }
  } catch (_) {}
}

function refreshProjectPlan(projectId) {
  if (projectId == null) return;
  try {
    if (typeof persistPlanStatus === 'function') persistPlanStatus(getDb(), Number(projectId));
  } catch (_) {}
}

function rowToTask(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    type: row.type,
    creator_id: row.creator_id,
    assignee_id: row.assignee_id,
    project_id: row.project_id != null ? row.project_id : null,
    due_at: row.due_at || null,
    creator: userBrief(row.creator_id),
    assignee: userBrief(row.assignee_id),
    source_chat_id: row.source_chat_id,
    source_message_id: row.source_message_id,
    source_message: row.source_message,
    created_at: row.created_at,
    taken_at: row.created_at, // shell-v2 alias
    updated_at: row.updated_at,
    closed_at: row.closed_at,
    done: row.status === 'done',
    source_dialog_id: row.source_chat_id, // shell-v2 alias
  };
}

function canSeeTask(user, row) {
  if (!user || !row) return false;
  if (isGeneralAdmin(user)) return true;
  if (isBoss(user)) {
    return (
      row.creator_id === user.id ||
      row.assignee_id === user.id ||
      canSeeUser(getDb(), user, row.creator_id) ||
      canSeeUser(getDb(), user, row.assignee_id)
    );
  }
  return row.creator_id === user.id || row.assignee_id === user.id;
}

/**
 * P0: create task from chat message.
 * body: { messageId, assignee_id?, title?, description?, notify? }
 */
function createTaskFromMessage(actor, body) {
  const messageId = Number(body && body.messageId);
  if (!Number.isFinite(messageId)) {
    const err = new Error('messageId_required');
    err.status = 400;
    throw err;
  }
  const msg = getDb().prepare('SELECT * FROM messages WHERE id = ?').get(messageId);
  if (!msg) {
    const err = new Error('message_not_found');
    err.status = 404;
    throw err;
  }
  if (!isMember(msg.chat_id, actor.id)) {
    const err = new Error('not_a_member');
    err.status = 403;
    throw err;
  }
  let plaintext;
  try {
    plaintext = decrypt({ ciphertext: msg.ciphertext, iv: msg.iv, tag: msg.tag });
  } catch (_) {
    plaintext = '';
  }
  const title =
    String((body && body.title) || '').trim().slice(0, 240) ||
    plaintext.slice(0, 120) ||
    `Задача из сообщения #${messageId}`;
  const description =
    String((body && body.description) || '').trim() || plaintext;
  let assigneeId =
    body && body.assignee_id != null ? Number(body.assignee_id) : actor.id;
  if (!Number.isFinite(assigneeId)) assigneeId = actor.id;
  const assignee = getDb().prepare('SELECT id FROM users WHERE id = ?').get(assigneeId);
  if (!assignee) {
    const err = new Error('assignee_not_found');
    err.status = 400;
    throw err;
  }

  ensureTaskProjectColumns(getDb());
  let projectId = body && body.project_id != null ? Number(body.project_id) : null;
  if (!Number.isFinite(projectId)) {
    try {
      const chat = getDb().prepare('SELECT id, title, kind FROM chats WHERE id=?').get(msg.chat_id);
      if (chat && chat.kind === 'project') {
        const pr = getDb()
          .prepare('SELECT id FROM projects WHERE name=? OR code=? OR client_key=? LIMIT 1')
          .get(chat.title, chat.title, chat.title);
        if (pr) projectId = pr.id;
      }
    } catch (_) {}
  } else {
    projectId = Number(projectId);
  }
  const info = getDb()
    .prepare(
      `INSERT INTO tasks
        (title, description, status, type, creator_id, assignee_id, source_chat_id, source_message_id, source_message, project_id, due_at)
       VALUES (?, ?, 'open', 'from_chat', ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      title,
      description,
      actor.id,
      assigneeId,
      msg.chat_id,
      messageId,
      plaintext.slice(0, 2000),
      projectId,
      (body && body.due_at) || null
    );
  const task = rowToTask(getDb().prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid));
  refreshProjectPlan(projectId);
  logActivity(actor.id, {
    action: 'task_from_chat',
    entityType: 'task',
    entityId: task.id,
    detail: JSON.stringify({ messageId, chat_id: msg.chat_id }),
  });
  if (body && body.notify !== false && assigneeId !== actor.id) {
    createNotification({
      userId: assigneeId,
      type: 'task',
      title: 'Новая задача из чата',
      body: title,
      meta: { task_id: task.id, message_id: messageId },
    });
  }
  return task;
}

function createTask(actor, body) {
  if (body && body.messageId != null) return createTaskFromMessage(actor, body);
  const title = String((body && body.title) || '').trim().slice(0, 240);
  if (!title) {
    const err = new Error('title_required');
    err.status = 400;
    throw err;
  }
  let assigneeId =
    body && body.assignee_id != null ? Number(body.assignee_id) : actor.id;
  if (!Number.isFinite(assigneeId)) assigneeId = actor.id;
  ensureTaskProjectColumns(getDb());
  const projectId =
    body && body.project_id != null && Number.isFinite(Number(body.project_id))
      ? Number(body.project_id)
      : null;
  const info = getDb()
    .prepare(
      `INSERT INTO tasks (title, description, status, type, creator_id, assignee_id, source_chat_id, source_message, project_id, due_at)
       VALUES (?, ?, 'open', ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      title,
      (body && body.description) || null,
      (body && (body.source_chat_id || body.source_dialog_id)) ? 'from_chat' : 'regular',
      actor.id,
      assigneeId,
      body && (body.source_chat_id != null || body.source_dialog_id != null)
        ? Number(body.source_chat_id != null ? body.source_chat_id : body.source_dialog_id)
        : null,
      (body && body.source_message) || null,
      projectId,
      (body && body.due_at) || null
    );
  const task = rowToTask(getDb().prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid));
  refreshProjectPlan(projectId);
  if (body && body.notify !== false && assigneeId !== actor.id) {
    createNotification({
      userId: assigneeId,
      type: 'task',
      title: 'Новая задача',
      body: title,
      meta: { task_id: task.id },
    });
  }
  logActivity(actor.id, { action: 'task_create', entityType: 'task', entityId: task.id });
  return task;
}

function mountTaskRoutes(app, { authMiddleware }) {
  app.get('/api/tasks', authMiddleware, (req, res) => {
    const db = getDb();
    ensureTaskProjectColumns(db);
    const mine = req.query.mine === '1' || req.query.mine === 'true';
    let rows;
    if (isGeneralAdmin(req.user) && !mine) {
      rows = db.prepare('SELECT * FROM tasks ORDER BY id DESC LIMIT 200').all();
    } else if (isBoss(req.user) && !mine) {
      rows = db
        .prepare(
          `SELECT t.* FROM tasks t
           WHERE t.creator_id = ? OR t.assignee_id = ?
              OR t.creator_id IN (SELECT id FROM users WHERE manager_id = ?)
              OR t.assignee_id IN (SELECT id FROM users WHERE manager_id = ?)
           ORDER BY t.id DESC LIMIT 200`
        )
        .all(req.user.id, req.user.id, req.user.id, req.user.id);
    } else {
      rows = db
        .prepare(
          `SELECT * FROM tasks WHERE creator_id = ? OR assignee_id = ? ORDER BY id DESC LIMIT 200`
        )
        .all(req.user.id, req.user.id);
    }
    if (req.query.status) {
      rows = rows.filter((r) => r.status === req.query.status);
    }
    if (req.query.project_id) {
      const pid = Number(req.query.project_id);
      rows = rows.filter((r) => Number(r.project_id) === pid);
    }
    const tasks = rows.map(rowToTask);
    res.json({ tasks, items: tasks });
  });

  app.get('/api/tasks/assignees', authMiddleware, (req, res) => {
    const db = getDb();
    let rows;
    if (isGeneralAdmin(req.user)) {
      rows = db.prepare('SELECT id, username, role, display_name, region FROM users WHERE active = 1 ORDER BY id').all();
    } else if (isBoss(req.user)) {
      rows = db
        .prepare(
          `SELECT id, username, role, display_name, region FROM users
           WHERE active = 1 AND (id = ? OR manager_id = ?) ORDER BY id`
        )
        .all(req.user.id, req.user.id);
    } else {
      rows = db
        .prepare('SELECT id, username, role, display_name, region FROM users WHERE id = ?')
        .all(req.user.id);
    }
    res.json({ users: rows });
  });

  app.get('/api/tasks/:id', authMiddleware, (req, res) => {
    const row = getDb().prepare('SELECT * FROM tasks WHERE id = ?').get(Number(req.params.id));
    if (!row || !canSeeTask(req.user, row)) return forbid(res, 'task_forbidden', 404);
    res.json({ task: rowToTask(row) });
  });

  app.post('/api/tasks', authMiddleware, (req, res) => {
    try {
      const task = createTask(req.user, req.body || {});
      res.status(201).json({ task });
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message });
    }
  });

  /** Explicit P0 endpoint alias */
  app.post('/api/tasks/from-chat', authMiddleware, (req, res) => {
    try {
      const task = createTaskFromMessage(req.user, req.body || {});
      res.status(201).json({ task });
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message });
    }
  });

  app.patch('/api/tasks/:id', authMiddleware, (req, res) => {
    const id = Number(req.params.id);
    const row = getDb().prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!row || !canSeeTask(req.user, row)) return forbid(res, 'task_forbidden', 404);
    const body = req.body || {};
    let status = row.status;
    if (body.done === true) status = 'done';
    if (body.done === false) status = 'open';
    if (body.status && ['open', 'done', 'cancelled'].includes(body.status)) status = body.status;
    ensureTaskProjectColumns(getDb());
    const nextProjectId =
      body.project_id != null && Number.isFinite(Number(body.project_id))
        ? Number(body.project_id)
        : row.project_id;
    getDb()
      .prepare(
        `UPDATE tasks SET
          title = COALESCE(?, title),
          description = COALESCE(?, description),
          assignee_id = COALESCE(?, assignee_id),
          status = ?,
          project_id = COALESCE(?, project_id),
          due_at = COALESCE(?, due_at),
          closed_at = CASE WHEN ? = 'done' THEN datetime('now') ELSE closed_at END,
          updated_at = datetime('now')
         WHERE id = ?`
      )
      .run(
        body.title != null ? String(body.title).slice(0, 240) : null,
        body.description != null ? String(body.description) : null,
        body.assignee_id != null ? Number(body.assignee_id) : null,
        status,
        nextProjectId,
        body.due_at != null ? String(body.due_at) : null,
        status,
        id
      );
    const task = rowToTask(getDb().prepare('SELECT * FROM tasks WHERE id = ?').get(id));
    refreshProjectPlan(row.project_id);
    refreshProjectPlan(nextProjectId);
    logActivity(req.user.id, { action: 'task_update', entityType: 'task', entityId: id });
    res.json({ task });
  });
}

module.exports = { mountTaskRoutes, createTaskFromMessage, createTask, rowToTask, ensureTaskProjectColumns };
