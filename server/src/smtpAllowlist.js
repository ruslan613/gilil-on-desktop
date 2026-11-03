'use strict';

/**
 * CRUD for smtp_senders_allowlist — general_admin only.
 * Does not expose App Password / OAuth secrets.
 */

const { getDb } = require('./db');
const { isGeneralAdmin, forbid } = require('./acl');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function requireGeneralAdmin(req, res) {
  if (!req.user) {
    res.status(401).json({ error: 'unauthorized' });
    return false;
  }
  if (!isGeneralAdmin(req.user)) {
    forbid(res, 'forbidden_role');
    return false;
  }
  return true;
}

function rowPublic(r) {
  if (!r) return null;
  return {
    id: r.id,
    email: r.email,
    label: r.label,
    active: !!r.active,
    created_by: r.created_by,
    created_at: r.created_at,
  };
}

function listAllowlist() {
  return getDb()
    .prepare(
      `SELECT id, email, label, active, created_by, created_at
       FROM smtp_senders_allowlist
       ORDER BY id ASC`
    )
    .all()
    .map(rowPublic);
}

function addAllowlist({ email, label, active, createdBy }) {
  const raw = String(email || '').trim();
  const e = normalizeEmail(raw);
  if (!isValidEmail(e)) {
    const err = new Error('invalid_email');
    err.status = 400;
    throw err;
  }
  // Canonical general address (confirmed by Ruslan). Store preferred casing if this email.
  const storeEmail =
    e === 'ruslan@light-industry.com' ? 'Ruslan@light-Industry.com' : e;

  const lab = label != null ? String(label).trim() || null : null;
  const act = active === 0 || active === false ? 0 : 1;
  try {
    const info = getDb()
      .prepare(
        `INSERT INTO smtp_senders_allowlist (email, label, active, created_by)
         VALUES (?, ?, ?, ?)`
      )
      .run(storeEmail, lab, act, createdBy || null);
    return rowPublic(
      getDb().prepare('SELECT * FROM smtp_senders_allowlist WHERE id = ?').get(Number(info.lastInsertRowid))
    );
  } catch (e2) {
    if (String(e2.message || '').includes('UNIQUE')) {
      getDb()
        .prepare(
          `UPDATE smtp_senders_allowlist
           SET email = ?, active = ?, label = COALESCE(?, label)
           WHERE email = ? COLLATE NOCASE`
        )
        .run(storeEmail, act, lab, e);
      return rowPublic(
        getDb()
          .prepare('SELECT * FROM smtp_senders_allowlist WHERE email = ? COLLATE NOCASE')
          .get(e)
      );
    }
    throw e2;
  }
}

function patchAllowlist(id, { label, active }) {
  const row = getDb().prepare('SELECT * FROM smtp_senders_allowlist WHERE id = ?').get(id);
  if (!row) {
    const err = new Error('not_found');
    err.status = 404;
    throw err;
  }
  const lab = label !== undefined ? (String(label).trim() || null) : row.label;
  const act =
    active !== undefined ? (active === 0 || active === false ? 0 : 1) : row.active;
  getDb()
    .prepare(`UPDATE smtp_senders_allowlist SET label = ?, active = ? WHERE id = ?`)
    .run(lab, act, id);
  return rowPublic(getDb().prepare('SELECT * FROM smtp_senders_allowlist WHERE id = ?').get(id));
}

function deleteAllowlist(id) {
  const row = getDb().prepare('SELECT * FROM smtp_senders_allowlist WHERE id = ?').get(id);
  if (!row) {
    const err = new Error('not_found');
    err.status = 404;
    throw err;
  }
  getDb().prepare('DELETE FROM smtp_senders_allowlist WHERE id = ?').run(id);
  return { ok: true, deleted: rowPublic(row) };
}

function mountSmtpAllowlistRoutes(app, { authMiddleware }) {
  app.get('/api/mail/smtp-allowlist', authMiddleware, (req, res) => {
    if (!requireGeneralAdmin(req, res)) return;
    res.json({
      items: listAllowlist(),
      enforce: String(process.env.SMTP_ALLOWLIST_ENFORCE || '') === '1',
    });
  });

  app.post('/api/mail/smtp-allowlist', authMiddleware, (req, res) => {
    if (!requireGeneralAdmin(req, res)) return;
    try {
      const body = req.body || {};
      const item = addAllowlist({
        email: body.email,
        label: body.label,
        active: body.active,
        createdBy: req.user && req.user.id,
      });
      res.status(201).json({ item });
    } catch (e) {
      res.status(e.status || 500).json({
        error: e.message || 'create_failed',
        hint: e.hint,
      });
    }
  });

  app.patch('/api/mail/smtp-allowlist/:id', authMiddleware, (req, res) => {
    if (!requireGeneralAdmin(req, res)) return;
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid_id' });
      const item = patchAllowlist(id, req.body || {});
      res.json({ item });
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message || 'patch_failed' });
    }
  });

  app.delete('/api/mail/smtp-allowlist/:id', authMiddleware, (req, res) => {
    if (!requireGeneralAdmin(req, res)) return;
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid_id' });
      const out = deleteAllowlist(id);
      res.json(out);
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message || 'delete_failed' });
    }
  });
}

module.exports = {
  mountSmtpAllowlistRoutes,
  listAllowlist,
  addAllowlist,
  patchAllowlist,
  deleteAllowlist,
  normalizeEmail,
};
