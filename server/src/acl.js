'use strict';

/**
 * Server-side ACL for Stage 2 roles:
 *   general_admin — everything
 *   director / manager — subordinates + prices of own region (RU|CN)
 *   employee — only own data
 */

const ROLES = ['general_admin', 'director', 'manager', 'employee'];
const REGIONS = ['RU', 'CN', 'ALL'];

function isGeneralAdmin(user) {
  return user && user.role === 'general_admin';
}

function isDirectorLike(user) {
  return user && (user.role === 'director' || user.role === 'manager' || user.role === 'general_admin');
}

function isBoss(user) {
  return user && (user.role === 'director' || user.role === 'manager');
}

/** IDs the actor may inspect (self + subordinates for boss; all for general_admin). */
function visibleUserIds(db, actor) {
  if (!actor) return [];
  if (isGeneralAdmin(actor)) {
    return db.prepare('SELECT id FROM users').all().map((r) => r.id);
  }
  if (isBoss(actor)) {
    const rows = db
      .prepare('SELECT id FROM users WHERE id = ? OR manager_id = ?')
      .all(actor.id, actor.id);
    return rows.map((r) => r.id);
  }
  return [actor.id];
}

function canSeeUser(db, actor, targetUserId) {
  if (!actor) return false;
  if (isGeneralAdmin(actor)) return true;
  if (actor.id === targetUserId) return true;
  if (isBoss(actor)) {
    const t = db.prepare('SELECT id, manager_id FROM users WHERE id = ?').get(targetUserId);
    return !!(t && t.manager_id === actor.id);
  }
  return false;
}

/** Prices: general_admin sees RU+CN; director/manager own region; employee none. */
function canSeePrices(actor, region) {
  if (!actor) return false;
  if (isGeneralAdmin(actor)) return true;
  if (isBoss(actor)) {
    if (!region) return true;
    return String(region).toUpperCase() === String(actor.region || '').toUpperCase();
  }
  return false;
}

/** Activity journal: general_admin only (owner). */
function canSeeActivity(actor) {
  return isGeneralAdmin(actor);
}

/** List/rating panel (GET /api/usefulness). Employees: false → 403. /me is separate (any authed). */
function canSeeUsefulness(actor) {
  return isDirectorLike(actor);
}

function canOverrideUsefulness(actor) {
  return isGeneralAdmin(actor) || (actor && actor.role === 'director');
}

function forbid(res, code = 'forbidden', status = 403) {
  return res.status(status).json({ error: code });
}

module.exports = {
  ROLES,
  REGIONS,
  isGeneralAdmin,
  isDirectorLike,
  isBoss,
  visibleUserIds,
  canSeeUser,
  canSeePrices,
  canSeeActivity,
  canSeeUsefulness,
  canOverrideUsefulness,
  forbid,
};
