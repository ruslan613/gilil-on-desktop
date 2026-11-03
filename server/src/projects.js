'use strict';

const { getDb } = require('./db');
const { isGeneralAdmin, isDirectorLike, forbid } = require('./acl');
const { publicUser } = require('./auth');

const GENERAL_ROLE = 'general'; // «Генерал» — locked observer on every project

function ensureProjectColumns(db) {
  const cols = db.prepare('PRAGMA table_info(projects)').all().map((c) => c.name);
  const add = [
    ['company', 'TEXT'],
    ['tender_no', 'TEXT'],
    ['description', 'TEXT'],
    ['curator', 'TEXT'],
    ['docs_person', 'TEXT'],
    ['manager', 'TEXT'],
    ['client_key', 'TEXT'],
    ['manager_ru_id', 'INTEGER'],
    ['manager_cn_id', 'INTEGER'],
    ['plan_pct', 'REAL'],
    ['plan_status', 'TEXT'],
  ];
  for (const [name, typ] of add) {
    if (!cols.includes(name)) db.exec(`ALTER TABLE projects ADD COLUMN ${name} ${typ}`);
  }
  // Link tasks → projects for «Статус выполнения плана»
  try {
    const tcols = db.prepare('PRAGMA table_info(tasks)').all().map((c) => c.name);
    if (!tcols.includes('project_id')) db.exec('ALTER TABLE tasks ADD COLUMN project_id INTEGER');
    if (!tcols.includes('due_at')) db.exec('ALTER TABLE tasks ADD COLUMN due_at TEXT');
  } catch (_) {}
  db.exec(`
    CREATE TABLE IF NOT EXISTS project_members (
      project_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      locked INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (project_id, user_id),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
}

/**
 * Статус выполнения плана по задачам проекта:
 * % готовых + метка «в плане» | «отстаёт» | «выполнено».
 */
function computePlanFromTasks(db, projectId) {
  const rows = db
    .prepare(
      `SELECT id, status, created_at, due_at, closed_at FROM tasks
       WHERE project_id = ? AND status != 'cancelled'`
    )
    .all(projectId);
  const total = rows.length;
  const done = rows.filter((r) => r.status === 'done').length;
  const overdue = rows.filter((r) => {
    if (r.status === 'done') return false;
    if (r.due_at) {
      try {
        return new Date(String(r.due_at).replace(' ', 'T') + (String(r.due_at).includes('Z') || String(r.due_at).includes('+') ? '' : 'Z')).getTime() < Date.now();
      } catch (_) {}
    }
    try {
      const created = new Date(String(r.created_at).replace(' ', 'T') + 'Z').getTime();
      return created < Date.now() - 86400000;
    } catch (_) {
      return false;
    }
  }).length;
  const pct = total === 0 ? 0 : Math.round((100 * done) / total);
  let status;
  if (total === 0) status = 'в плане';
  else if (done === total) status = 'выполнено';
  else if (overdue > 0) status = 'отстаёт';
  else status = 'в плане';
  return {
    plan_pct: pct,
    plan_status: status,
    plan_tasks_total: total,
    plan_tasks_done: done,
    plan_tasks_overdue: overdue,
  };
}

function persistPlanStatus(db, projectId) {
  const plan = computePlanFromTasks(db, projectId);
  db.prepare(`UPDATE projects SET plan_pct=?, plan_status=? WHERE id=?`).run(
    plan.plan_pct,
    plan.plan_status,
    projectId
  );
  return plan;
}

function refreshAllPlanStatuses(db) {
  const ids = db.prepare('SELECT id FROM projects').all();
  for (const p of ids) persistPlanStatus(db, p.id);
}

function getGeneralAdminIds(db) {
  return db.prepare(`SELECT id FROM users WHERE role = 'general_admin' AND active = 1`).all().map((r) => r.id);
}

function ensureGeneralOnAllProjects(db) {
  const admins = getGeneralAdminIds(db);
  if (!admins.length) return;
  const projects = db.prepare('SELECT id FROM projects').all();
  const upsert = db.prepare(
    `INSERT INTO project_members (project_id, user_id, role, locked)
     VALUES (?, ?, ?, 1)
     ON CONFLICT(project_id, user_id) DO UPDATE SET role=excluded.role, locked=1`
  );
  const tx = db.transaction(() => {
    for (const p of projects) for (const uid of admins) upsert.run(p.id, uid, GENERAL_ROLE);
  });
  tx();
}

function memberRows(db, projectId) {
  return db
    .prepare(
      `SELECT m.user_id, m.role, m.locked, u.username, u.display_name, u.role AS user_role, u.region
       FROM project_members m JOIN users u ON u.id = m.user_id
       WHERE m.project_id = ?
       ORDER BY CASE m.role WHEN 'general' THEN 0 WHEN 'manager_ru' THEN 1 WHEN 'manager_cn' THEN 2 ELSE 3 END, u.id`
    )
    .all(projectId)
    .map((r) => ({
      user_id: r.user_id,
      role: r.role,
      role_label:
        r.role === 'general'
          ? 'Генерал'
          : r.role === 'manager_ru'
            ? 'Менеджер RU'
            : r.role === 'manager_cn'
              ? 'Менеджер CN'
              : r.role,
      locked: !!r.locked,
      can_remove: !(r.locked || r.role === 'general'),
      user: {
        id: r.user_id,
        username: r.username,
        display_name: r.display_name,
        role: r.user_role,
        region: r.region,
      },
    }));
}

function rowToCard(db, row) {
  if (!row) return null;
  const plan = computePlanFromTasks(db, row.id);
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    region: row.region,
    status: row.status,
    owner_id: row.owner_id,
    company: row.company || '',
    tender_no: row.tender_no || '',
    description: row.description || '',
    curator: row.curator || '',
    docs_person: row.docs_person || '',
    manager: row.manager || '',
    manager_ru_id: row.manager_ru_id || null,
    manager_cn_id: row.manager_cn_id || null,
    client_key: row.client_key || null,
    created_at: row.created_at,
    plan_pct: plan.plan_pct,
    plan_status: plan.plan_status,
    plan_tasks_total: plan.plan_tasks_total,
    plan_tasks_done: plan.plan_tasks_done,
    plan_tasks_overdue: plan.plan_tasks_overdue,
    members: memberRows(db, row.id),
  };
}

function seedPlanDemoTasks(db) {
  ensureProjectColumns(db);
  // Link smoke tasks from Frunze project chat → project 1
  try {
    db.prepare(
      `UPDATE tasks SET project_id = (
         SELECT p.id FROM projects p WHERE p.client_key='pr-frunze' OR p.code='FRUNZE' LIMIT 1
       )
       WHERE project_id IS NULL AND source_chat_id IN (
         SELECT id FROM chats WHERE kind='project' AND (title LIKE '%Фрунзенский%' OR title LIKE '%Frunze%')
       )`
    ).run();
  } catch (_) {}

  const already = db.prepare(`SELECT COUNT(*) AS c FROM tasks WHERE project_id IS NOT NULL AND title LIKE 'План·%'`).get().c;
  if (already > 0) {
    refreshAllPlanStatuses(db);
    return;
  }

  const admin = db.prepare(`SELECT id FROM users WHERE role='director' AND region='RU' LIMIT 1`).get();
  const emp = db.prepare(`SELECT id FROM users WHERE role='employee' AND region='RU' LIMIT 1`).get();
  const creatorId = (admin && admin.id) || 2;
  const assigneeId = (emp && emp.id) || 5;
  const projects = db.prepare('SELECT id, client_key, code FROM projects ORDER BY id').all();
  const byKey = Object.fromEntries(projects.map((p) => [p.client_key || p.code, p.id]));
  const ins = db.prepare(
    `INSERT INTO tasks (title, description, status, type, creator_id, assignee_id, project_id, due_at, closed_at, created_at)
     VALUES (?, ?, ?, 'regular', ?, ?, ?, ?, ?, datetime('now', ?))`
  );

  function add(pid, title, status, dueOffsetDays, createdOffset, closed) {
    if (!pid) return;
    const due =
      dueOffsetDays == null
        ? null
        : db.prepare(`SELECT datetime('now', ?) AS d`).get((dueOffsetDays >= 0 ? '+' : '') + dueOffsetDays + ' days').d;
    const closedAt = closed
      ? db.prepare(`SELECT datetime('now', '-1 day') AS d`).get().d
      : null;
    ins.run(
      'План·' + title,
      'Задача плана проекта',
      status,
      creatorId,
      assigneeId,
      pid,
      due,
      closedAt,
      createdOffset
    );
  }

  // Frunze — отстаёт (есть просроченная открытая)
  add(byKey['pr-frunze'], 'КП клиенту', 'done', -2, '-5 days', true);
  add(byKey['pr-frunze'], 'Образцы CN', 'open', -1, '-3 days', false);
  add(byKey['pr-frunze'], 'Спецификация v2', 'open', 2, '-1 days', false);

  // CN-P2 — в плане (открытые без просрочки)
  add(byKey['pr-cn2'], 'BOM street lights', 'done', -1, '-4 days', true);
  add(byKey['pr-cn2'], 'Samples packing', 'open', 3, '-2 hours', false);

  // LED — выполнено
  add(byKey['pr-led'], 'Спека B2B', 'done', -1, '-6 days', true);
  add(byKey['pr-led'], 'Согласование сроков', 'done', -1, '-5 days', true);

  // Tender 466 — отстаёт
  add(byKey['pr-t466'], 'Переторжка', 'open', -2, '-4 days', false);
  add(byKey['pr-t466'], 'DWG A1', 'open', 1, '-1 days', false);

  // 2025-RU — в плане 50%
  add(byKey['pr-2025ru'], 'Retail package', 'done', -1, '-3 days', true);
  add(byKey['pr-2025ru'], 'КП retail', 'open', 4, '-2 hours', false);

  refreshAllPlanStatuses(db);
}

function seedProjectCards(db) {
  ensureProjectColumns(db);
  const n = db.prepare(`SELECT COUNT(*) AS c FROM projects WHERE company IS NOT NULL AND company != ''`).get().c;
  if (n === 0) {
    const upd = db.prepare(
      `UPDATE projects SET company=?, tender_no=?, description=?, curator=?, docs_person=?, manager=?, client_key=?
       WHERE code=? OR name=?`
    );
    for (const s of [
      {
        code: 'FRUNZE', name: 'ЖК Фрунзенский', company: 'ЖК Фрунзенский', tender_no: '0373100011226000001',
        description: 'Заказ светильников для лобби и двора', curator: 'Игорь · Директор RU',
        docs_person: 'Анна · Руководитель RU', manager: 'Мария К.', client_key: 'pr-frunze',
      },
      {
        code: 'CN-P2', name: 'CN Phase 2', company: 'Zhongshan LED Factory · Phase 2', tender_no: 'CN-PHASE-2',
        description: 'Street lights BOM / phase 2 production', curator: 'Li Wei · Director CN',
        docs_person: 'Wang Li', manager: 'Wang Li', client_key: 'pr-cn2',
      },
    ]) {
      const hit = db.prepare('SELECT id FROM projects WHERE code=? OR name=?').get(s.code, s.name);
      if (hit) upd.run(s.company, s.tender_no, s.description, s.curator, s.docs_person, s.manager, s.client_key, s.code, s.name);
    }
    const ins = db.prepare(
      `INSERT INTO projects (name, code, region, status, company, tender_no, description, curator, docs_person, manager, client_key)
       VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const e of [
      ['pr-2025ru', '2025-RU', 'RU', 'ООО Альфа Лайт', '2025-RU-RETAIL', 'Retail lighting package 2025', 'Игорь · Директор RU', 'Анна П.', 'Алексей · RU Manager'],
      ['pr-led', 'LED Platform', 'RU', 'ООО Северсвет', 'LED-PLAT-01', 'B2B LED platform specification', 'Игорь · Директор RU', 'Дмитрий С.', 'Алексей · RU Manager'],
      ['pr-iot', 'Control Hub', 'ALL', 'Shanghai Supply · Spot modules', 'IOT-HUB-01', 'IoT Control Hub solution', 'Li Wei · Director CN', 'Wang Li', 'Дмитрий С.'],
      ['pr-t466', 'Тендер 4661969', 'RU', 'ООО Северсвет', '4661969', 'B2B lighting tender rebid', 'Игорь · Директор RU', 'Анна · Руководитель RU', 'Алексей · RU Manager'],
    ]) {
      if (!db.prepare('SELECT id FROM projects WHERE client_key=?').get(e[0])) {
        ins.run(e[1], e[1], e[2], e[3], e[4], e[5], e[6], e[7], e[8], e[0]);
      }
    }
  }
  ensureGeneralOnAllProjects(db);
  seedPlanDemoTasks(db);
}

function findProject(db, id) {
  if (/^\d+$/.test(String(id))) return db.prepare('SELECT * FROM projects WHERE id=?').get(Number(id));
  return db.prepare('SELECT * FROM projects WHERE client_key=? OR code=?').get(id, id);
}

function mountProjectRoutes(app, { authMiddleware }) {
  const db = getDb();
  ensureProjectColumns(db);
  seedProjectCards(db);

  app.get('/api/projects/staff', authMiddleware, (req, res) => {
    const rows = db
      .prepare(
        `SELECT id, username, display_name, role, region, locale, manager_id FROM users
         WHERE active = 1 ORDER BY region, role, display_name`
      )
      .all();
    const notGeneral = (u) => u.role !== 'general_admin';
    res.json({
      ru: rows.filter((u) => notGeneral(u) && (u.region === 'RU' || u.region === 'ALL')).map(publicUser),
      cn: rows.filter((u) => notGeneral(u) && (u.region === 'CN' || u.region === 'ALL')).map(publicUser),
      general: rows.filter((u) => u.role === 'general_admin').map(publicUser),
      all: rows.map(publicUser),
    });
  });

  app.get('/api/projects', authMiddleware, (req, res) => {
    ensureGeneralOnAllProjects(db);
    refreshAllPlanStatuses(db);
    const rows = db.prepare('SELECT * FROM projects ORDER BY id DESC').all();
    res.json({ projects: rows.map((r) => rowToCard(db, r)) });
  });

  app.get('/api/projects/:id', authMiddleware, (req, res) => {
    const row = findProject(db, req.params.id);
    if (!row) return res.status(404).json({ error: 'not_found' });
    persistPlanStatus(db, row.id);
    const fresh = db.prepare('SELECT * FROM projects WHERE id=?').get(row.id);
    res.json({ project: rowToCard(db, fresh) });
  });

  app.get('/api/projects/:id/plan-status', authMiddleware, (req, res) => {
    if (!isDirectorLike(req.user) && !isGeneralAdmin(req.user)) return forbid(res, 'forbidden');
    const row = findProject(db, req.params.id);
    if (!row) return res.status(404).json({ error: 'not_found' });
    const plan = persistPlanStatus(db, row.id);
    res.json({ project_id: row.id, ...plan });
  });

  app.post('/api/projects', authMiddleware, (req, res) => {
    if (!isDirectorLike(req.user) && !isGeneralAdmin(req.user)) return forbid(res, 'forbidden');
    const body = req.body || {};
    const name = String(body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'name_required' });
    const managerRuId = Number(body.manager_ru_id);
    const managerCnId = Number(body.manager_cn_id);
    if (!Number.isFinite(managerRuId)) return res.status(400).json({ error: 'manager_ru_required' });
    if (!Number.isFinite(managerCnId)) return res.status(400).json({ error: 'manager_cn_required' });
    const ruUser = db.prepare('SELECT * FROM users WHERE id=? AND active=1').get(managerRuId);
    const cnUser = db.prepare('SELECT * FROM users WHERE id=? AND active=1').get(managerCnId);
    if (!ruUser) return res.status(400).json({ error: 'manager_ru_invalid' });
    if (!cnUser) return res.status(400).json({ error: 'manager_cn_invalid' });
    const clientKey = body.client_key || ('pr-' + Date.now().toString(36));
    const info = db
      .prepare(
        `INSERT INTO projects (name, code, region, status, owner_id, company, tender_no, description, curator, docs_person, manager, client_key, manager_ru_id, manager_cn_id, plan_pct, plan_status)
         VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'в плане')`
      )
      .run(
        name, body.code || name, body.region || 'ALL', req.user.id,
        String(body.company || ''), String(body.tender_no || ''), String(body.description || ''),
        String(body.curator || ''), String(body.docs_person || ''),
        String(body.manager || ruUser.display_name || ruUser.username),
        clientKey, managerRuId, managerCnId
      );
    const projectId = Number(info.lastInsertRowid);
    const mem = db.prepare(
      `INSERT INTO project_members (project_id, user_id, role, locked) VALUES (?, ?, ?, ?)
       ON CONFLICT(project_id, user_id) DO UPDATE SET role=excluded.role, locked=excluded.locked`
    );
    mem.run(projectId, managerRuId, 'manager_ru', 0);
    mem.run(projectId, managerCnId, 'manager_cn', 0);
    for (const uid of getGeneralAdminIds(db)) mem.run(projectId, uid, GENERAL_ROLE, 1);
    try {
      const chatInfo = db.prepare(`INSERT INTO chats (title, kind, region) VALUES (?, 'project', ?)`).run(name, body.region || 'ALL');
      const chatId = Number(chatInfo.lastInsertRowid);
      const cm = db.prepare(`INSERT OR IGNORE INTO chat_members (chat_id, user_id) VALUES (?, ?)`);
      for (const uid of new Set([req.user.id, managerRuId, managerCnId, ...getGeneralAdminIds(db)])) cm.run(chatId, uid);
    } catch (_) {}
    const row = db.prepare('SELECT * FROM projects WHERE id=?').get(projectId);
    res.status(201).json({ project: rowToCard(db, row) });
  });

  app.put('/api/projects/:id', authMiddleware, (req, res) => {
    if (!isDirectorLike(req.user) && !isGeneralAdmin(req.user)) return forbid(res, 'forbidden');
    const row = findProject(db, req.params.id);
    if (!row) return res.status(404).json({ error: 'not_found' });
    const body = req.body || {};
    const next = rowToCard(db, row);
    for (const f of ['company', 'tender_no', 'description', 'curator', 'docs_person', 'manager']) {
      if (body[f] != null) next[f] = String(body[f]);
    }
    if (body.name != null) next.name = String(body.name);
    if (body.manager_ru_id != null) next.manager_ru_id = Number(body.manager_ru_id) || null;
    if (body.manager_cn_id != null) next.manager_cn_id = Number(body.manager_cn_id) || null;
    db.prepare(
      `UPDATE projects SET company=?, tender_no=?, description=?, curator=?, docs_person=?, manager=?, name=?, manager_ru_id=?, manager_cn_id=? WHERE id=?`
    ).run(next.company, next.tender_no, next.description, next.curator, next.docs_person, next.manager, next.name || row.name, next.manager_ru_id, next.manager_cn_id, row.id);
    ensureGeneralOnAllProjects(db);
    persistPlanStatus(db, row.id);
    res.json({ project: rowToCard(db, db.prepare('SELECT * FROM projects WHERE id=?').get(row.id)) });
  });

  app.delete('/api/projects/:id/members/:userId', authMiddleware, (req, res) => {
    if (!isDirectorLike(req.user) && !isGeneralAdmin(req.user)) return forbid(res, 'forbidden');
    const row = findProject(db, req.params.id);
    if (!row) return res.status(404).json({ error: 'not_found' });
    const uid = Number(req.params.userId);
    const mem = db.prepare('SELECT * FROM project_members WHERE project_id=? AND user_id=?').get(row.id, uid);
    if (!mem) return res.status(404).json({ error: 'not_a_member' });
    if (mem.locked || mem.role === GENERAL_ROLE) {
      return res.status(403).json({ error: 'general_locked', message: 'Генерал нельзя удалить с проекта' });
    }
    db.prepare('DELETE FROM project_members WHERE project_id=? AND user_id=?').run(row.id, uid);
    res.json({ ok: true, project: rowToCard(db, row) });
  });
}

module.exports = {
  mountProjectRoutes,
  ensureProjectColumns,
  seedProjectCards,
  ensureGeneralOnAllProjects,
  rowToCard,
  computePlanFromTasks,
  persistPlanStatus,
  refreshAllPlanStatuses,
  GENERAL_ROLE,
};
