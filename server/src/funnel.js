'use strict';

const { getDb } = require('./db');
const { isGeneralAdmin, isBoss, canSeeUser, forbid } = require('./acl');
const { logActivity } = require('./activity');

const STEPS = ['read', 'suppliers', 'spec', 'price_compare', 'sent_client'];
const STEP_LABELS = {
  read: 'Прочитано',
  suppliers: 'Поставщики',
  spec: 'Спецификация',
  price_compare: 'Сравнение цен',
  sent_client: 'Клиенту',
};
const STEP_STATUSES = ['pending', 'in_progress', 'done', 'blocked'];

function loadFunnel(id) {
  const db = getDb();
  const f = db.prepare('SELECT * FROM order_funnel WHERE id = ?').get(id);
  if (!f) return null;
  const steps = db
    .prepare('SELECT * FROM order_funnel_steps WHERE funnel_id = ?')
    .all(id)
    .map((s) => {
      const assignee = s.assignee_id
        ? db
            .prepare('SELECT id, username, display_name, role FROM users WHERE id = ?')
            .get(s.assignee_id)
        : null;
      return {
        ...s,
        step_label: STEP_LABELS[s.step] || s.step,
        assignee: assignee
          ? {
              id: assignee.id,
              username: assignee.username,
              display_name: assignee.display_name,
              role: assignee.role,
            }
          : null,
      };
    });
  // Keep canonical order
  steps.sort((a, b) => STEPS.indexOf(a.step) - STEPS.indexOf(b.step));
  const current = steps.find((s) => s.status === 'in_progress') || steps.find((s) => s.status === 'pending');
  return { ...f, steps, current_step: current ? current.step : null };
}

function canSeeFunnel(user, funnel) {
  if (!user || !funnel) return false;
  if (isGeneralAdmin(user)) return true;
  if (isBoss(user)) {
    if (funnel.created_by === user.id) return true;
    if (canSeeUser(getDb(), user, funnel.created_by)) return true;
    const stepAssignees = getDb()
      .prepare('SELECT assignee_id FROM order_funnel_steps WHERE funnel_id = ?')
      .all(funnel.id);
    return stepAssignees.some(
      (s) => s.assignee_id && (s.assignee_id === user.id || canSeeUser(getDb(), user, s.assignee_id))
    );
  }
  if (funnel.created_by === user.id) return true;
  const mine = getDb()
    .prepare(
      `SELECT 1 FROM order_funnel_steps WHERE funnel_id = ? AND assignee_id = ? LIMIT 1`
    )
    .get(funnel.id, user.id);
  return !!mine;
}

function mountFunnelRoutes(app, { authMiddleware }) {
  app.get('/api/funnels', authMiddleware, (req, res) => {
    const db = getDb();
    let rows = db.prepare('SELECT * FROM order_funnel ORDER BY id DESC LIMIT 100').all();
    const items = rows.map((r) => loadFunnel(r.id)).filter((f) => canSeeFunnel(req.user, f));
    res.json({ items, steps: STEPS, step_labels: STEP_LABELS });
  });

  app.get('/api/funnels/:id', authMiddleware, (req, res) => {
    const f = loadFunnel(Number(req.params.id));
    if (!f || !canSeeFunnel(req.user, f)) return forbid(res, 'funnel_forbidden', 404);
    res.json({ funnel: f });
  });

  app.post('/api/funnels', authMiddleware, (req, res) => {
    const orderRef = String((req.body && req.body.order_ref) || '').trim();
    const title = String((req.body && req.body.title) || '').trim() || orderRef;
    if (!orderRef) return res.status(400).json({ error: 'order_ref_required' });
    const db = getDb();
    const info = db
      .prepare(
        `INSERT INTO order_funnel (order_ref, title, region, created_by) VALUES (?, ?, ?, ?)`
      )
      .run(orderRef, title, (req.body && req.body.region) || req.user.region, req.user.id);
    const funnelId = Number(info.lastInsertRowid);
    const ins = db.prepare(
      `INSERT INTO order_funnel_steps (funnel_id, step, status, assignee_id) VALUES (?, ?, ?, ?)`
    );
    STEPS.forEach((step, i) => {
      ins.run(funnelId, step, i === 0 ? 'in_progress' : 'pending', i === 0 ? req.user.id : null);
    });
    logActivity(req.user.id, {
      action: 'funnel_create',
      entityType: 'order_funnel',
      entityId: funnelId,
      funnelStep: 'read',
    });
    res.status(201).json({ funnel: loadFunnel(funnelId) });
  });

  app.patch('/api/funnels/:id/steps/:step', authMiddleware, (req, res) => {
    const funnelId = Number(req.params.id);
    const step = req.params.step;
    if (!STEPS.includes(step)) return res.status(400).json({ error: 'invalid_step', allowed: STEPS });
    const f = loadFunnel(funnelId);
    if (!f || !canSeeFunnel(req.user, f)) return forbid(res, 'funnel_forbidden', 404);

    const body = req.body || {};
    const status = body.status;
    if (status && !STEP_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'invalid_status', allowed: STEP_STATUSES });
    }
    const assigneeId =
      body.assignee_id != null ? Number(body.assignee_id) : undefined;
    const note = body.note != null ? String(body.note) : undefined;

    // Employees may only update steps assigned to them (or unassigned → claim)
    const existing = getDb()
      .prepare('SELECT * FROM order_funnel_steps WHERE funnel_id = ? AND step = ?')
      .get(funnelId, step);
    if (!isGeneralAdmin(req.user) && !isBoss(req.user)) {
      if (existing.assignee_id && existing.assignee_id !== req.user.id) {
        return forbid(res, 'step_not_yours');
      }
    }

    getDb()
      .prepare(
        `UPDATE order_funnel_steps SET
          status = COALESCE(?, status),
          assignee_id = COALESCE(?, assignee_id),
          note = COALESCE(?, note),
          started_at = CASE
            WHEN ? = 'in_progress' AND started_at IS NULL THEN datetime('now')
            ELSE started_at END,
          finished_at = CASE
            WHEN ? = 'done' THEN datetime('now')
            ELSE finished_at END
         WHERE funnel_id = ? AND step = ?`
      )
      .run(
        status || null,
        assigneeId !== undefined ? assigneeId : null,
        note !== undefined ? note : null,
        status || null,
        status || null,
        funnelId,
        step
      );

    // Auto-advance: when step done, next pending → in_progress
    if (status === 'done') {
      const idx = STEPS.indexOf(step);
      if (idx >= 0 && idx < STEPS.length - 1) {
        const next = STEPS[idx + 1];
        getDb()
          .prepare(
            `UPDATE order_funnel_steps SET status = 'in_progress',
             started_at = COALESCE(started_at, datetime('now'))
             WHERE funnel_id = ? AND step = ? AND status = 'pending'`
          )
          .run(funnelId, next);
      }
    }
    getDb()
      .prepare(`UPDATE order_funnel SET updated_at = datetime('now') WHERE id = ?`)
      .run(funnelId);

    logActivity(req.user.id, {
      action: 'funnel_step',
      entityType: 'order_funnel',
      entityId: funnelId,
      funnelStep: step,
      detail: JSON.stringify({ status, assignee_id: assigneeId }),
    });
    res.json({ funnel: loadFunnel(funnelId) });
  });
}

module.exports = { mountFunnelRoutes, STEPS, STEP_LABELS };
