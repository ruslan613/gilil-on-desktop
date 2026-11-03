'use strict';

const { getDb } = require('./db');
const { isGeneralAdmin, isBoss, canSeePrices } = require('./acl');

function pushHit(out, hit, lim) {
  if (out.length >= lim) return false;
  out.push(hit);
  return true;
}

function matches(hay, q) {
  return String(hay || '')
    .toLowerCase()
    .includes(q);
}

function searchAll(user, qRaw, limit) {
  const q = String(qRaw || '')
    .trim()
    .toLowerCase();
  const lim = Math.min(Math.max(Number(limit) || 40, 1), 100);
  const out = [];
  if (!q) return out;
  const db = getDb();

  // Chats (membership) — JS match for Cyrillic-safe lowercasing
  const chats = db
    .prepare(
      `SELECT c.id, c.title, c.kind FROM chats c
       JOIN chat_members m ON m.chat_id = c.id
       WHERE m.user_id = ?
       ORDER BY c.id DESC LIMIT 200`
    )
    .all(user.id);
  for (const c of chats) {
    if (!matches(c.title, q)) continue;
    if (
      !pushHit(
        out,
        {
          type: 'chat',
          id: 'chat-' + c.id,
          title: c.title,
          subtitle: c.kind,
          section: 'chats',
          entity_id: String(c.id),
        },
        lim
      )
    )
      return out;
  }

  // Tasks
  {
    let rows;
    if (isGeneralAdmin(user)) {
      rows = db.prepare('SELECT id, title, description, status, type FROM tasks ORDER BY id DESC LIMIT 300').all();
    } else if (isBoss(user)) {
      rows = db
        .prepare(
          `SELECT t.id, t.title, t.description, t.status, t.type FROM tasks t
           WHERE t.creator_id = ? OR t.assignee_id = ?
              OR t.creator_id IN (SELECT id FROM users WHERE manager_id = ?)
              OR t.assignee_id IN (SELECT id FROM users WHERE manager_id = ?)
           ORDER BY t.id DESC LIMIT 300`
        )
        .all(user.id, user.id, user.id, user.id);
    } else {
      rows = db
        .prepare(
          `SELECT id, title, description, status, type FROM tasks
           WHERE creator_id = ? OR assignee_id = ?
           ORDER BY id DESC LIMIT 300`
        )
        .all(user.id, user.id);
    }
    for (const r of rows) {
      if (!matches(r.title, q) && !matches(r.description, q)) continue;
      if (
        !pushHit(
          out,
          {
            type: 'task',
            id: 'task-' + r.id,
            title: r.title,
            subtitle: r.status + ' · ' + r.type,
            section: 'tasks',
            entity_id: String(r.id),
          },
          lim
        )
      )
        return out;
    }
  }

  // Invoices (region ACL for amounts)
  {
    const rows = db
      .prepare(
        `SELECT id, number, title, amount, currency, region, status, owner_id
         FROM invoices ORDER BY id DESC LIMIT 200`
      )
      .all();
    for (const r of rows) {
      if (!matches(r.number, q) && !matches(r.title, q)) continue;
      const seeAmount = canSeePrices(user, r.region);
      const own = isGeneralAdmin(user) || isBoss(user) || r.owner_id === user.id;
      if (!own && !seeAmount) continue;
      if (
        !pushHit(
          out,
          {
            type: 'invoice',
            id: 'inv-' + r.id,
            title: r.number + ' · ' + r.title,
            subtitle: seeAmount ? `${r.amount} ${r.currency} · ${r.status}` : r.status,
            section: 'invoices',
            entity_id: String(r.id),
            meta: { region: r.region },
          },
          lim
        )
      )
        return out;
    }
  }

  // Projects
  {
    const rows = db
      .prepare(`SELECT id, name, code, region, status FROM projects ORDER BY id DESC LIMIT 200`)
      .all();
    for (const r of rows) {
      if (!matches(r.name, q) && !matches(r.code, q)) continue;
      if (
        !pushHit(
          out,
          {
            type: 'project',
            id: 'proj-' + r.id,
            title: r.name,
            subtitle: [r.code, r.region, r.status].filter(Boolean).join(' · '),
            section: 'projects',
            entity_id: String(r.id),
          },
          lim
        )
      )
        return out;
    }
  }

  return out;
}

function mountSearchRoutes(app, { authMiddleware }) {
  app.get('/api/search', authMiddleware, (req, res) => {
    const q = req.query.q || '';
    const results = searchAll(req.user, q, req.query.limit);
    res.json({ q, results });
  });
}

module.exports = { mountSearchRoutes, searchAll };
