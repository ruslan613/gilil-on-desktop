'use strict';

const { getDb } = require('./db');
const {
  canSeeUsefulness,
  canOverrideUsefulness,
  visibleUserIds,
  isGeneralAdmin,
  forbid,
} = require('./acl');
const { logActivity } = require('./activity');


function sumSessionSeconds(userId) {
  const row = getDb()
    .prepare(
      `SELECT COALESCE(SUM(
         CAST((julianday(COALESCE(ended_at, last_seen_at)) - julianday(started_at)) * 86400 AS INTEGER)
       ), 0) AS seconds
       FROM activity_sessions WHERE user_id = ?`
    )
    .get(userId);
  return Math.max(0, Number(row && row.seconds) || 0);
}

function formatDuration(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return { seconds: s, hours: h, minutes: m, label: h + 'ч ' + m + 'м' };
}

function getHireDate(userId) {
  const u = getDb().prepare('SELECT hire_date, created_at FROM users WHERE id = ?').get(userId);
  if (!u) return null;
  if (u.hire_date) return String(u.hire_date).slice(0, 10);
  if (u.created_at) return String(u.created_at).slice(0, 10);
  return null;
}

/**
 * Auto score 0–100 from:
 *  - activity volume (sessions / actions)
 *  - funnel steps completed
 *  - reply statuses done
 *  - tasks done
 */
function computeAutoScore(userId) {
  const db = getDb();
  const actions = db
    .prepare(
      `SELECT COUNT(*) AS c FROM activity_log
       WHERE user_id = ? AND created_at >= datetime('now', '-14 days')`
    )
    .get(userId).c;
  const sessions = db
    .prepare(
      `SELECT COUNT(*) AS c FROM activity_sessions
       WHERE user_id = ? AND started_at >= datetime('now', '-14 days')`
    )
    .get(userId).c;
  const funnelDone = db
    .prepare(
      `SELECT COUNT(*) AS c FROM order_funnel_steps
       WHERE assignee_id = ? AND status = 'done'`
    )
    .get(userId).c;
  const repliesDone = db
    .prepare(
      `SELECT COUNT(*) AS c FROM reply_status
       WHERE employee_user_id = ? AND status = 'done'`
    )
    .get(userId).c;
  const tasksDone = db
    .prepare(
      `SELECT COUNT(*) AS c FROM tasks
       WHERE assignee_id = ? AND status = 'done'
         AND updated_at >= datetime('now', '-14 days')`
    )
    .get(userId).c;

  // Weighted heuristic
  let score = 0;
  score += Math.min(actions, 40); // up to 40
  score += Math.min(sessions * 3, 15);
  score += Math.min(funnelDone * 8, 20);
  score += Math.min(repliesDone * 5, 10);
  score += Math.min(tasksDone * 5, 15);
  score = Math.max(0, Math.min(100, Math.round(score)));

  const idle =
    actions < 3 &&
    sessions < 2 &&
    funnelDone === 0 &&
    tasksDone === 0;

  return {
    auto_score: score,
    idle_alert: idle ? 1 : 0,
    breakdown: { actions, sessions, funnelDone, repliesDone, tasksDone },
  };
}

function upsertScore(userId) {
  const computed = computeAutoScore(userId);
  const db = getDb();
  const existing = db.prepare('SELECT * FROM usefulness_scores WHERE user_id = ?').get(userId);
  if (existing) {
    db.prepare(
      `UPDATE usefulness_scores SET auto_score = ?, idle_alert = ?, computed_at = datetime('now')
       WHERE user_id = ?`
    ).run(computed.auto_score, computed.idle_alert, userId);
  } else {
    db.prepare(
      `INSERT INTO usefulness_scores (user_id, auto_score, idle_alert) VALUES (?, ?, ?)`
    ).run(userId, computed.auto_score, computed.idle_alert);
  }
  const row = db.prepare('SELECT * FROM usefulness_scores WHERE user_id = ?').get(userId);
  return { ...row, breakdown: computed.breakdown, effective_score: row.override_score != null ? row.override_score : row.auto_score };
}

function publicScore(row, includeBreakdown) {
  if (!row) return null;
  const user = getDb()
    .prepare('SELECT id, username, display_name, role, region FROM users WHERE id = ?')
    .get(row.user_id);
  const out = {
    user_id: row.user_id,
    user,
    auto_score: row.auto_score,
    override_score: row.override_score,
    override_comment: row.override_comment,
    override_by: row.override_by,
    override_at: row.override_at,
    idle_alert: !!row.idle_alert,
    effective_score: row.override_score != null ? row.override_score : row.auto_score,
    computed_at: row.computed_at,
  };
  if (includeBreakdown && row.breakdown) out.breakdown = row.breakdown;
  return out;
}

function mountUsefulnessRoutes(app, { authMiddleware }) {
  // Self score — any authenticated user (manager/employee too); no canSeeUsefulness
  app.get('/api/usefulness/me', authMiddleware, (req, res) => {
    const uid = req.user.id;
    const scored = upsertScore(uid);
    const duration = formatDuration(sumSessionSeconds(uid));
    const out = {
      user_id: uid,
      effective_score: scored.override_score != null ? scored.override_score : scored.auto_score,
      auto_score: scored.auto_score,
      override_score: scored.override_score,
      override_comment: scored.override_comment,
      override_by: scored.override_by,
      override_at: scored.override_at,
      computed_at: scored.computed_at,
      breakdown: scored.breakdown || null,
      hire_date: getHireDate(uid),
      time_in_app_seconds: duration.seconds,
      time_in_app: duration.label,
      time_in_app_hours: duration.hours,
      time_in_app_minutes: duration.minutes,
    };
    res.json({ score: out });
  });

  // Rating list — director/manager/general_admin via canSeeUsefulness; employees → 403
  app.get('/api/usefulness', authMiddleware, (req, res) => {
    if (!canSeeUsefulness(req.user)) return forbid(res, 'usefulness_forbidden');
    const db = getDb();
    // Subordinates (employees + managers under this boss); self excluded. Bosses may see other managers.
    const ids = visibleUserIds(db, req.user).filter((id) => {
      if (id === req.user.id && !isGeneralAdmin(req.user)) return false;
      const u = db.prepare('SELECT role FROM users WHERE id = ?').get(id);
      return u && (u.role === 'employee' || u.role === 'manager');
    });
    const items = ids.map((id) => publicScore(upsertScore(id), true));
    items.sort((a, b) => b.effective_score - a.effective_score);
    const alerts = items.filter((i) => i.idle_alert);
    res.json({ items, alerts, ranking: items.map((i, idx) => ({ rank: idx + 1, ...i })) });
  });

  app.get('/api/usefulness/:userId', authMiddleware, (req, res) => {
    if (!canSeeUsefulness(req.user)) return forbid(res, 'usefulness_forbidden');
    const uid = Number(req.params.userId);
    const ids = visibleUserIds(getDb(), req.user);
    if (!ids.includes(uid) && !isGeneralAdmin(req.user)) return forbid(res);
    res.json({ score: publicScore(upsertScore(uid), true) });
  });

  app.post('/api/usefulness/:userId/override', authMiddleware, (req, res) => {
    if (!canOverrideUsefulness(req.user)) return forbid(res, 'override_forbidden');
    const uid = Number(req.params.userId);
    const score = Number(req.body && req.body.score);
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      return res.status(400).json({ error: 'score_0_100_required' });
    }
    const comment = String((req.body && req.body.comment) || '').slice(0, 1000);
    upsertScore(uid);
    getDb()
      .prepare(
        `UPDATE usefulness_scores SET
          override_score = ?, override_comment = ?, override_by = ?, override_at = datetime('now')
         WHERE user_id = ?`
      )
      .run(score, comment || null, req.user.id, uid);
    logActivity(req.user.id, {
      action: 'usefulness_override',
      entityType: 'user',
      entityId: uid,
      detail: JSON.stringify({ score, comment }),
    });
    res.json({ score: publicScore(upsertScore(uid), true) });
  });

  app.post('/api/usefulness/recompute', authMiddleware, (req, res) => {
    if (!canSeeUsefulness(req.user)) return forbid(res, 'usefulness_forbidden');
    const ids = visibleUserIds(getDb(), req.user);
    const items = ids.map((id) => publicScore(upsertScore(id), false));
    res.json({ ok: true, count: items.length });
  });
}

module.exports = { mountUsefulnessRoutes, computeAutoScore, upsertScore, sumSessionSeconds, formatDuration };
