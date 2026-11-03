'use strict';

const { getDb } = require('./db');

const WEEKS = new Set(['week1', 'week2', 'week3', 'week4', 'week5', 'week6', 'week7', 'week8']);
const STATUSES = new Set(['in_progress', 'done', 'blocked']);
const ACCEPTS = new Set(['PASS', 'FAIL', '']);

function ensureAlsTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS als_updates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      source TEXT NOT NULL CHECK(source IN ('agent','user')),
      week TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('in_progress','done','blocked')),
      accept TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      paths_json TEXT,
      how_to_run TEXT,
      author TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_als_updates_created ON als_updates(created_at DESC, id DESC);
  `);
}

function ensureAlsProject(db) {
  try {
    const hit = db
      .prepare(
        `SELECT id FROM projects WHERE name = ? OR code = ? OR client_key = ? LIMIT 1`
      )
      .get('AI Lighting Studio', 'ALS', 'pr-als');
    if (hit) return hit.id;
    // Prefer projects.js helpers when available (columns already migrated).
    try {
      const { ensureProjectColumns, ensureGeneralOnAllProjects } = require('./projects');
      ensureProjectColumns(db);
      const info = db.prepare('PRAGMA table_info(projects)').all().map((c) => c.name);
      if (info.includes('company') && info.includes('client_key')) {
        const r = db
          .prepare(
            `INSERT INTO projects (name, code, region, status, company, tender_no, description, curator, docs_person, manager, client_key)
             VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?)`
          )
          .run(
            'AI Lighting Studio',
            'ALS',
            'ALL',
            'Gilil / AI Lighting Studio',
            'ALS-W2',
            'Неделя 2: модули Дизайн и 3D-конструктор, CLI, приёмка. Обновления через /als-studio.html',
            'Руслан · Генерал',
            'agent',
            'agent',
            'pr-als'
          );
        try {
          ensureGeneralOnAllProjects(db);
        } catch (_) {}
        return Number(r.lastInsertRowid);
      }
    } catch (_) {}
    const r = db
      .prepare(
        `INSERT INTO projects (name, code, region, status) VALUES (?, ?, 'ALL', 'active')`
      )
      .run('AI Lighting Studio', 'ALS');
    return Number(r.lastInsertRowid);
  } catch (e) {
    console.warn('[als] project seed skipped:', e.message);
    return null;
  }
}

function normalizePayload(body, { source, author }) {
  const week = String((body && body.week) || 'week2').trim();
  const status = String((body && body.status) || 'in_progress').trim();
  let accept = body && body.accept != null ? String(body.accept).trim() : '';
  if (accept === 'pass') accept = 'PASS';
  if (accept === 'fail') accept = 'FAIL';
  if (!WEEKS.has(week)) {
    const err = new Error('invalid_week');
    err.code = 'invalid_week';
    throw err;
  }
  if (!STATUSES.has(status)) {
    const err = new Error('invalid_status');
    err.code = 'invalid_status';
    throw err;
  }
  if (!ACCEPTS.has(accept)) {
    const err = new Error('invalid_accept');
    err.code = 'invalid_accept';
    throw err;
  }
  const title = String((body && body.title) || '').slice(0, 500);
  const bodyText = String((body && body.body) || '').slice(0, 20000);
  const howToRun = body && body.how_to_run != null ? String(body.how_to_run).slice(0, 5000) : null;
  let paths = body && (body.paths != null ? body.paths : body.paths_json);
  let pathsJson = null;
  if (paths != null) {
    if (typeof paths === 'string') {
      try {
        JSON.parse(paths);
        pathsJson = paths;
      } catch (_) {
        pathsJson = JSON.stringify([paths]);
      }
    } else {
      pathsJson = JSON.stringify(paths);
    }
  }
  return {
    source,
    author: author || null,
    week,
    status,
    accept,
    title,
    body: bodyText,
    paths_json: pathsJson,
    how_to_run: howToRun,
  };
}

function insertUpdate(db, row) {
  const r = db
    .prepare(
      `INSERT INTO als_updates
        (source, week, status, accept, title, body, paths_json, how_to_run, author)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      row.source,
      row.week,
      row.status,
      row.accept,
      row.title,
      row.body,
      row.paths_json,
      row.how_to_run,
      row.author
    );
  return db.prepare('SELECT * FROM als_updates WHERE id = ?').get(r.lastInsertRowid);
}

function mapRow(r) {
  let paths = null;
  if (r.paths_json) {
    try {
      paths = JSON.parse(r.paths_json);
    } catch (_) {
      paths = r.paths_json;
    }
  }
  return {
    id: r.id,
    created_at: r.created_at,
    source: r.source,
    week: r.week,
    status: r.status,
    accept: r.accept || '',
    title: r.title,
    body: r.body,
    paths,
    how_to_run: r.how_to_run,
    author: r.author,
  };
}

function agentTokenOk(req) {
  const expected = process.env.ALS_BRIDGE_TOKEN || 'gilil-als-local';
  const got = req.headers['x-als-token'] || req.headers['x-als-bridge-token'] || '';
  return String(got) === String(expected);
}

function mountAlsRoutes(app, { authMiddleware }) {
  const db = getDb();
  ensureAlsTables(db);
  ensureAlsProject(db);

  app.get('/api/als/updates', authMiddleware, (req, res) => {
    try {
      const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
      const rows = db
        .prepare(
          `SELECT * FROM als_updates ORDER BY datetime(created_at) DESC, id DESC LIMIT ?`
        )
        .all(limit);
      res.json({ ok: true, count: rows.length, items: rows.map(mapRow) });
    } catch (e) {
      console.error('[als] list failed', e.message);
      res.status(500).json({ ok: false, error: 'als_list_failed', message: e.message });
    }
  });

  app.post('/api/als/updates', authMiddleware, (req, res) => {
    try {
      const row = normalizePayload(req.body || {}, {
        source: 'user',
        author: (req.user && req.user.username) || null,
      });
      const saved = insertUpdate(db, row);
      res.status(201).json({ ok: true, item: mapRow(saved) });
    } catch (e) {
      if (e.code) return res.status(400).json({ ok: false, error: e.code });
      console.error('[als] user update failed', e.message);
      res.status(500).json({ ok: false, error: 'als_save_failed', message: e.message });
    }
  });

  app.post('/api/als/agent-update', (req, res) => {
    if (!agentTokenOk(req)) {
      return res.status(401).json({ ok: false, error: 'invalid_als_token' });
    }
    try {
      const author =
        (req.body && (req.body.author || req.body.agent)) || 'agent';
      const row = normalizePayload(req.body || {}, {
        source: 'agent',
        author: String(author).slice(0, 120),
      });
      const saved = insertUpdate(db, row);
      res.status(201).json({ ok: true, item: mapRow(saved) });
    } catch (e) {
      if (e.code) return res.status(400).json({ ok: false, error: e.code });
      console.error('[als] agent update failed', e.message);
      res.status(500).json({ ok: false, error: 'als_save_failed', message: e.message });
    }
  });
}

module.exports = {
  mountAlsRoutes,
  ensureAlsTables,
  ensureAlsProject,
};
