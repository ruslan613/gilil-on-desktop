'use strict';

const { getDb } = require('./db');
const { isGeneralAdmin, isDirectorLike, isBoss, visibleUserIds, forbid } = require('./acl');
const { publicUser } = require('./auth');

/**
 * Директор: sees staff workload/plan; escalates to Генерал when staff miss plan.
 */
function mountDirectorRoutes(app, { authMiddleware, notifyUser }) {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS plan_escalations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_user_id INTEGER NOT NULL,
      director_user_id INTEGER NOT NULL,
      general_user_id INTEGER,
      reason TEXT,
      plan_title TEXT,
      detail TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (employee_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (director_user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  function canDirector(user) {
    return isDirectorLike(user) || isGeneralAdmin(user);
  }

  /** Workload + plan checklist for subordinates (or all for Генерал). */
  app.get('/api/director/workload', authMiddleware, (req, res) => {
    if (!canDirector(req.user)) return forbid(res, 'forbidden');
    const ids = visibleUserIds(db, req.user).filter((id) => id !== req.user.id);
    const staffIds = ids.length ? ids : [];
    const staff = staffIds.length
      ? db
          .prepare(
            `SELECT id, username, display_name, role, region, manager_id FROM users
             WHERE id IN (${staffIds.map(() => '?').join(',')}) AND active = 1`
          )
          .all(...staffIds)
      : [];

    const items = staff.map((u) => {
      const openTasks = db
        .prepare(
          `SELECT COUNT(*) AS c FROM tasks WHERE assignee_id = ? AND status != 'done'`
        )
        .get(u.id).c;
      const overdue = db
        .prepare(
          `SELECT COUNT(*) AS c FROM tasks
           WHERE assignee_id = ? AND status != 'done'
             AND datetime(created_at) < datetime('now', '-1 day')`
        )
        .get(u.id).c;
      const planDone = db
        .prepare(
          `SELECT COUNT(*) AS c FROM tasks
           WHERE assignee_id = ? AND status = 'done'
             AND date(closed_at) = date('now')`
        )
        .get(u.id).c;
      const planOpen = db
        .prepare(
          `SELECT id, title, status, created_at FROM tasks
           WHERE assignee_id = ? AND status != 'done'
           ORDER BY id DESC LIMIT 8`
        )
        .all(u.id);
      const missed = overdue > 0 || (planOpen.length > 0 && planDone === 0 && openTasks >= 2);
      return {
        user: publicUser(u),
        open_tasks: openTasks,
        overdue,
        plan_done_today: planDone,
        plan_items: planOpen,
        missed_plan: !!missed,
      };
    });

    res.json({
      role_label: isGeneralAdmin(req.user) ? 'Генерал' : 'Директор',
      items,
      missed_count: items.filter((x) => x.missed_plan).length,
    });
  });

  /** Escalate missed plan to Генерал — notification + report row. */
  app.post('/api/director/escalate', authMiddleware, (req, res) => {
    if (!canDirector(req.user)) return forbid(res, 'forbidden');
    const body = req.body || {};
    const employeeId = Number(body.employee_user_id);
    if (!Number.isFinite(employeeId)) return res.status(400).json({ error: 'employee_required' });
    const emp = db.prepare('SELECT * FROM users WHERE id=? AND active=1').get(employeeId);
    if (!emp) return res.status(404).json({ error: 'employee_not_found' });
    if (!isGeneralAdmin(req.user)) {
      const visible = visibleUserIds(db, req.user);
      if (!visible.includes(employeeId)) return forbid(res, 'forbidden');
    }
    const generals = db
      .prepare(`SELECT id FROM users WHERE role = 'general_admin' AND active = 1`)
      .all();
    if (!generals.length) return res.status(400).json({ error: 'no_general' });
    const reason = String(body.reason || 'missed_plan');
    const planTitle = String(body.plan_title || 'План дня не выполнен');
    const detail = String(
      body.detail ||
        `Сотрудник ${emp.display_name || emp.username} не выполнил план. Эскалация от Директора.`
    );
    const created = [];
    for (const g of generals) {
      const info = db
        .prepare(
          `INSERT INTO plan_escalations (employee_user_id, director_user_id, general_user_id, reason, plan_title, detail)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run(employeeId, req.user.id, g.id, reason, planTitle, detail);
      const escId = Number(info.lastInsertRowid);
      created.push(escId);
      try {
        if (typeof notifyUser === 'function') {
          notifyUser(g.id, {
            type: 'escalation',
            title: 'Эскалация · пропуск плана',
            body: detail,
            entity_type: 'plan_escalation',
            entity_id: String(escId),
            actor_name: req.user.display_name || req.user.username,
          });
        } else {
          // Fallback: insert notification row if table exists
          try {
            db.prepare(
              `INSERT INTO notifications (user_id, type, title, body, entity_type, entity_id, actor_name)
               VALUES (?, 'escalation', ?, ?, 'plan_escalation', ?, ?)`
            ).run(g.id, 'Эскалация · пропуск плана', detail, String(escId), req.user.display_name || req.user.username);
          } catch (_) {}
        }
      } catch (_) {}
    }
    res.status(201).json({
      ok: true,
      escalations: created,
      message: 'Отчёт отправлен Генералу',
    });
  });

  app.get('/api/director/escalations', authMiddleware, (req, res) => {
    if (!canDirector(req.user)) return forbid(res, 'forbidden');
    let rows;
    if (isGeneralAdmin(req.user)) {
      rows = db
        .prepare(
          `SELECT e.*, eu.display_name AS employee_name, du.display_name AS director_name
           FROM plan_escalations e
           JOIN users eu ON eu.id = e.employee_user_id
           JOIN users du ON du.id = e.director_user_id
           ORDER BY e.id DESC LIMIT 100`
        )
        .all();
    } else {
      rows = db
        .prepare(
          `SELECT e.*, eu.display_name AS employee_name, du.display_name AS director_name
           FROM plan_escalations e
           JOIN users eu ON eu.id = e.employee_user_id
           JOIN users du ON du.id = e.director_user_id
           WHERE e.director_user_id = ?
           ORDER BY e.id DESC LIMIT 100`
        )
        .all(req.user.id);
    }
    res.json({ items: rows });
  });
}

module.exports = { mountDirectorRoutes };
