'use strict';

const { getDb } = require('./db');
const { publicUser } = require('./auth');

const EDITABLE = Object.freeze(['display_name', 'profile_company']);
const PROTECTED = Object.freeze([
  'id',
  'role',
  'region',
  'username',
  'password',
  'password_hash',
  'manager_id',
  'hire_date',
  'active',
  'email',
  'locale',
]);

function updateOwnProfile(database, userId, body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'invalid_body', status: 400 };
  }
  const keys = Object.keys(body);
  for (const key of keys) {
    if (PROTECTED.includes(key)) {
      return { error: 'field_protected', field: key, status: 403 };
    }
    if (!EDITABLE.includes(key)) {
      return { error: 'field_not_editable', field: key, status: 400 };
    }
  }
  if (!Object.prototype.hasOwnProperty.call(body, 'display_name')) {
    return { error: 'display_name_required', status: 400 };
  }
  const name = String(body.display_name == null ? '' : body.display_name).trim();
  if (!name || name.length > 120) {
    return { error: 'display_name_invalid', status: 400 };
  }
  const row = database.prepare('SELECT * FROM users WHERE id = ? AND active = 1').get(userId);
  if (!row) return { error: 'user_not_found', status: 404 };

  let company = row.profile_company || null;
  if (Object.prototype.hasOwnProperty.call(body, 'profile_company')) {
    company = String(body.profile_company == null ? '' : body.profile_company).trim();
    if (company.length > 120) return { error: 'profile_company_invalid', status: 400 };
    if (!company) company = null;
  }
  database.prepare('UPDATE users SET display_name = ?, profile_company = ? WHERE id = ?').run(name, company, userId);
  const updated = database.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  return { user: publicUser(updated) };
}

function mountProfileRoutes(app, authMiddleware) {
  app.get('/api/me', authMiddleware, (req, res) => {
    res.json({ user: publicUser(req.userRow) });
  });

  app.patch('/api/me/profile', authMiddleware, (req, res) => {
    const result = updateOwnProfile(getDb(), req.user.id, req.body || {});
    if (result.error) return res.status(result.status || 400).json({ error: result.error, field: result.field || null });
    res.json(result);
  });
}

module.exports = {
  EDITABLE,
  PROTECTED,
  updateOwnProfile,
  mountProfileRoutes,
};
