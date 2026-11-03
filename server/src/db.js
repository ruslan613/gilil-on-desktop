'use strict';

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.resolve(
  process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'gilil-on-stage2.db')
);

let Database;
let db;

function openDb() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  // eslint-disable-next-line global-require
  Database = require('better-sqlite3');
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

function getDb() {
  if (!db) openDb();
  return db;
}

function migrate(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('general_admin','director','manager','employee')),
      region TEXT NOT NULL DEFAULT 'RU' CHECK(region IN ('RU','CN','ALL')),
      display_name TEXT NOT NULL,
      locale TEXT NOT NULL DEFAULT 'ru',
      manager_id INTEGER,
      hire_date TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'direct' CHECK(kind IN ('direct','group','project')),
      region TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chat_members (
      chat_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      PRIMARY KEY (chat_id, user_id),
      FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      ciphertext TEXT NOT NULL,
      iv TEXT NOT NULL,
      tag TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id, id);

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','done','cancelled')),
      type TEXT NOT NULL DEFAULT 'regular' CHECK(type IN ('regular','from_chat','invoice')),
      creator_id INTEGER NOT NULL,
      assignee_id INTEGER,
      source_chat_id INTEGER,
      source_message_id INTEGER,
      source_message TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      closed_at TEXT,
      FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (source_chat_id) REFERENCES chats(id) ON DELETE SET NULL,
      FOREIGN KEY (source_message_id) REFERENCES messages(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id, status);

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number TEXT NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'RUB',
      region TEXT NOT NULL DEFAULT 'RU' CHECK(region IN ('RU','CN')),
      status TEXT NOT NULL DEFAULT 'draft',
      owner_id INTEGER,
      project_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT,
      region TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      owner_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      session_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      funnel_step TEXT,
      detail TEXT,
      ip TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS activity_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      session_token TEXT,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      ended_at TEXT,
      last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
      ip TEXT,
      user_agent TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reply_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER NOT NULL,
      employee_user_id INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('read','replied','in_progress','done')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(chat_id, employee_user_id),
      FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
      FOREIGN KEY (employee_user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS order_funnel (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_ref TEXT NOT NULL,
      title TEXT,
      region TEXT,
      created_by INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS order_funnel_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      funnel_id INTEGER NOT NULL,
      step TEXT NOT NULL CHECK(step IN ('read','suppliers','spec','price_compare','sent_client')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','in_progress','done','blocked')),
      assignee_id INTEGER,
      note TEXT,
      started_at TEXT,
      finished_at TEXT,
      UNIQUE(funnel_id, step),
      FOREIGN KEY (funnel_id) REFERENCES order_funnel(id) ON DELETE CASCADE,
      FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS usefulness_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      auto_score REAL NOT NULL DEFAULT 0,
      override_score REAL,
      override_comment TEXT,
      override_by INTEGER,
      override_at TEXT,
      idle_alert INTEGER NOT NULL DEFAULT 0,
      computed_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (override_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS login_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      user_id INTEGER,
      success INTEGER NOT NULL DEFAULT 0,
      ip TEXT,
      user_agent TEXT,
      reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip, created_at);
    CREATE INDEX IF NOT EXISTS idx_login_attempts_user ON login_attempts(username, created_at);

    CREATE TABLE IF NOT EXISTS login_ips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      ip TEXT NOT NULL,
      geo TEXT,
      first_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
      login_count INTEGER NOT NULL DEFAULT 1,
      UNIQUE(user_id, ip),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      meta_json TEXT,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS hack_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT,
      action TEXT NOT NULL,
      detail TEXT,
      ip TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );


    CREATE TABLE IF NOT EXISTS tender_news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL CHECK(kind IN ('new','change','result','info')),
      title TEXT NOT NULL,
      body TEXT,
      url TEXT,
      platform TEXT,
      tender_no TEXT,
      nmck REAL,
      published_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(kind, platform, tender_no)
    );

    CREATE INDEX IF NOT EXISTS idx_tender_news_published
      ON tender_news(published_at DESC, id DESC);

    CREATE TABLE IF NOT EXISTS tenders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tender_no TEXT NOT NULL,
      title TEXT NOT NULL,
      platform TEXT,
      nmck REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'RUB',
      deadline TEXT,
      status TEXT NOT NULL DEFAULT 'found'
        CHECK(status IN ('found','in_work','application','won','lost')),
      region TEXT NOT NULL DEFAULT 'RU',
      owner_id INTEGER,
      progress INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(tender_no),
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_tenders_status ON tenders(status, deadline);

    CREATE TABLE IF NOT EXISTS tender_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tender_id INTEGER NOT NULL,
      assignee_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      progress INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','done','cancelled')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (tender_id) REFERENCES tenders(id) ON DELETE CASCADE,
      FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_tender_tasks_assignee ON tender_tasks(assignee_id, status);

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS otp_codes (
      email TEXT PRIMARY KEY,
      code_hash TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 5,
      expires_at TEXT NOT NULL,
      last_sent_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS smtp_senders_allowlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL COLLATE NOCASE,
      label TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_by INTEGER REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(email)
    );
  `);

  // Additive: email on users (existing DBs)
  const cols = database.prepare("PRAGMA table_info(users)").all().map((c) => c.name);
  if (!cols.includes('email')) {
    database.exec('ALTER TABLE users ADD COLUMN email TEXT');
    console.log('[db] migrated: users.email');
  }
  database.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL');

  // Additive: hire_date (ISO date YYYY-MM-DD)
  const colsHire = database.prepare("PRAGMA table_info(users)").all().map((c) => c.name);
  if (!colsHire.includes('hire_date')) {
    database.exec('ALTER TABLE users ADD COLUMN hire_date TEXT');
    console.log('[db] migrated: users.hire_date');
  }
  database.exec(`UPDATE users SET hire_date = date(created_at) WHERE hire_date IS NULL OR hire_date = ''`);
}

function seed(database) {
  const count = database.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (count > 0) return;

  const hash = (p) => bcrypt.hashSync(p, 10);
  const ins = database.prepare(
    `INSERT INTO users (username, password_hash, role, region, display_name, locale, manager_id, hire_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  // 1 general_admin
  const adminId = Number(
    ins.run('admin', hash('admin123'), 'general_admin', 'ALL', 'Руслан · Ген.админ', 'ru', null, '2020-01-15')
      .lastInsertRowid
  );
  // 2 director RU
  const dirRuId = Number(
    ins.run('director_ru', hash('dir123'), 'director', 'RU', 'Игорь · Директор RU', 'ru', adminId, '2021-03-01')
      .lastInsertRowid
  );
  // 3 director CN
  const dirCnId = Number(
    ins.run('director_cn', hash('dir123'), 'director', 'CN', 'Li Wei · Director CN', 'zh', adminId, '2021-06-01')
      .lastInsertRowid
  );
  // 4 manager RU
  const mgrRuId = Number(
    ins.run('manager_ru', hash('mgr123'), 'manager', 'RU', 'Анна · Руководитель RU', 'ru', dirRuId, '2022-02-10')
      .lastInsertRowid
  );
  // 5–6 employees RU
  const empRu1 = Number(
    ins.run('emp_ru1', hash('emp123'), 'employee', 'RU', 'Мария К.', 'ru', mgrRuId, '2023-05-12').lastInsertRowid
  );
  const empRu2 = Number(
    ins.run('emp_ru2', hash('emp123'), 'employee', 'RU', 'Дмитрий С.', 'ru', mgrRuId, '2024-01-20').lastInsertRowid
  );
  // 7 employee CN
  const empCn1 = Number(
    ins.run('emp_cn1', hash('emp123'), 'employee', 'CN', 'Wang Li', 'zh', dirCnId, '2023-09-01').lastInsertRowid
  );

  // Demo chats
  const chatIns = database.prepare(`INSERT INTO chats (title, kind, region) VALUES (?, ?, ?)`);
  const memIns = database.prepare(`INSERT INTO chat_members (chat_id, user_id) VALUES (?, ?)`);
  const c1 = Number(chatIns.run('RU ↔ CN · поставки', 'group', 'ALL').lastInsertRowid);
  [adminId, dirRuId, dirCnId, empRu1, empCn1].forEach((uid) => memIns.run(c1, uid));
  const c2 = Number(chatIns.run('Мария · дирекция', 'direct', 'RU').lastInsertRowid);
  [dirRuId, empRu1].forEach((uid) => memIns.run(c2, uid));
  const c3 = Number(chatIns.run('ЖК Фрунзенский', 'project', 'RU').lastInsertRowid);
  [mgrRuId, empRu1, empRu2].forEach((uid) => memIns.run(c3, uid));

  // Projects & invoices
  const pIns = database.prepare(
    `INSERT INTO projects (name, code, region, status, owner_id) VALUES (?, ?, ?, ?, ?)`
  );
  const p1 = Number(pIns.run('ЖК Фрунзенский', 'FRUNZE', 'RU', 'active', mgrRuId).lastInsertRowid);
  const p2 = Number(pIns.run('CN Phase 2', 'CN-P2', 'CN', 'active', dirCnId).lastInsertRowid);
  database
    .prepare(
      `INSERT INTO invoices (number, title, amount, currency, region, status, owner_id, project_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run('INV-1001', 'Счёт Фрунзенский этап 1', 450000, 'RUB', 'RU', 'sent', empRu1, p1);
  database
    .prepare(
      `INSERT INTO invoices (number, title, amount, currency, region, status, owner_id, project_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run('INV-CN-77', 'CN Phase 2 deposit', 28000, 'CNY', 'CN', 'draft', empCn1, p2);

  // Sample funnel
  const fId = Number(
    database
      .prepare(
        `INSERT INTO order_funnel (order_ref, title, region, created_by) VALUES (?, ?, ?, ?)`
      )
      .run('ORD-2026-001', 'Заказ светильники Фрунзенский', 'RU', empRu1).lastInsertRowid
  );
  const steps = ['read', 'suppliers', 'spec', 'price_compare', 'sent_client'];
  const stepIns = database.prepare(
    `INSERT INTO order_funnel_steps (funnel_id, step, status, assignee_id) VALUES (?, ?, ?, ?)`
  );
  stepIns.run(fId, 'read', 'done', empRu1);
  stepIns.run(fId, 'suppliers', 'in_progress', empRu1);
  stepIns.run(fId, 'spec', 'pending', empRu2);
  stepIns.run(fId, 'price_compare', 'pending', null);
  stepIns.run(fId, 'sent_client', 'pending', null);

  // Usefulness placeholders
  const uIns = database.prepare(
    `INSERT INTO usefulness_scores (user_id, auto_score, idle_alert) VALUES (?, ?, ?)`
  );
  [empRu1, empRu2, empCn1, mgrRuId].forEach((uid, i) => {
    uIns.run(uid, 70 - i * 5, i === 1 ? 1 : 0);
  });

  console.log('[db] seeded demo users: admin/admin123, director_ru|cn/dir123, manager_ru/mgr123, emp_*/emp123');
}

/** Ensure demo / known users have emails for OTP login. */
function ensureUserEmails(database) {
  const map = {
    admin: 'gililllight@gmail.com',
    director_ru: 'director.ru@gililon.local',
    director_cn: 'director.cn@gililon.local',
    manager_ru: 'manager.ru@gililon.local',
    emp_ru1: 'emp.ru1@gililon.local',
    emp_ru2: 'emp.ru2@gililon.local',
    emp_cn1: 'emp.cn1@gililon.local',
  };
  const upd = database.prepare(
    `UPDATE users SET email = ? WHERE username = ? AND (email IS NULL OR email = '')`
  );
  for (const [username, email] of Object.entries(map)) {
    upd.run(email, username);
  }
}



function seedNews(database) {
  const count = database.prepare('SELECT COUNT(*) AS c FROM tender_news').get().c;
  if (count > 0) return;
  const ins = database.prepare(
    `INSERT INTO tender_news (kind, title, body, url, platform, tender_no, nmck, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const now = new Date().toISOString();
  ins.run(
    'info',
    'Канал новостей Gilil On готов',
    'Лента тендеров по освещению. В полной поставке данные приходят из npm run tenders:fetch (gilil-supply-server). Здесь — демо-записи Stage 2 desktop.',
    '/news.html',
    'other',
    'desktop-bootstrap',
    null,
    now
  );
  ins.run(
    'new',
    'Демо: поставка светодиодных светильников для ЖК',
    'Пример карточки нового тендера. Площадка ЕИС / zakupki. НМЦК ориентировочная.',
    'https://zakupki.gov.ru/',
    'zakupki',
    'DEMO-2026-001',
    1850000,
    now
  );
  ins.run(
    'change',
    'Демо: изменена дата подачи — объект освещение цеха',
    'Срок подачи сдвинут. Проверьте комплект КП и образцы.',
    'https://www.b2b-center.ru/',
    'b2b',
    'DEMO-4660000',
    420000,
    now
  );
  ins.run(
    'result',
    'Демо: итоги — лот наружное освещение',
    'Процедура завершена. Карточка для проверки фильтров «Итоги».',
    '/news.html',
    'rts',
    'DEMO-RESULT-1',
    990000,
    now
  );
  console.log('[db] seeded demo tender_news (4 items)');
}


function seedTenders(database) {
  const count = database.prepare('SELECT COUNT(*) AS c FROM tenders').get().c;
  if (count > 0) return;

  const users = database.prepare('SELECT id, username FROM users').all();
  const byUser = Object.fromEntries(users.map((u) => [u.username, u.id]));
  const emp1 = byUser.emp_ru1 || users[0]?.id;
  const emp2 = byUser.emp_ru2 || emp1;
  const mgr = byUser.manager_ru || emp1;
  const empCn = byUser.emp_cn1 || emp1;

  const ins = database.prepare(
    `INSERT INTO tenders (tender_no, title, platform, nmck, currency, deadline, status, region, owner_id, progress, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const taskIns = database.prepare(
    `INSERT INTO tender_tasks (tender_id, assignee_id, title, progress, status)
     VALUES (?, ?, ?, ?, ?)`
  );

  // Counts intentionally NOT 12/5/3/2 — live seed for SRM TV
  const rows = [
    ['4661969', 'B2B освещение · переторжка', 'b2b', 2450000, 'RUB', '2026-11-12', 'application', 'RU', emp1, 72, 'КП финал'],
    ['4652879', 'Урал регион · наружное освещение', 'zakupki', 1180000, 'RUB', '2026-11-05', 'in_work', 'RU', emp2, 40, null],
    ['0373100011226000001', 'ЕИС · светильники ЖК', 'zakupki', 3200000, 'RUB', '2026-11-18', 'application', 'RU', mgr, 55, null],
    ['DEMO-2026-001', 'Светодиоды для ЖК (демо)', 'zakupki', 1850000, 'RUB', '2026-11-22', 'found', 'RU', emp1, 0, null],
    ['DEMO-4660000', 'Освещение цеха · срок сдвинут', 'b2b', 420000, 'RUB', '2026-11-08', 'in_work', 'RU', emp2, 25, null],
    ['RTS-88421', 'RTS · парковое освещение', 'rts', 960000, 'RUB', '2026-11-15', 'found', 'RU', null, 0, null],
    ['B2B-70112', 'Складская подсветка', 'b2b', 670000, 'RUB', '2026-11-28', 'found', 'RU', emp1, 5, null],
    ['EIS-55201', 'Школьный двор · LED', 'zakupki', 540000, 'RUB', '2026-10-20', 'won', 'RU', mgr, 100, 'Подписан'],
    ['B2B-44990', 'Офисный лот · проигран', 'b2b', 310000, 'RUB', '2026-10-12', 'lost', 'RU', emp2, 100, 'Цена'],
    ['CN-P2-LED', 'CN Phase 2 · LED samples', 'other', 88000, 'CNY', '2026-11-30', 'in_work', 'CN', empCn, 35, null],
    ['ZAK-99102', 'Мост · архитектурная подсветка', 'zakupki', 4500000, 'RUB', '2026-12-01', 'found', 'RU', null, 0, null],
    ['RTS-91003', 'Заявка · ТРЦ атриум', 'rts', 2100000, 'RUB', '2026-11-09', 'application', 'RU', emp1, 80, 'Ждём протокол'],
    ['B2B-66001', 'Лот проигран · спецификация', 'b2b', 195000, 'RUB', '2026-09-30', 'lost', 'RU', emp2, 100, null],
    ['EIS-44110', 'Найден · больница крыло Б', 'zakupki', 1280000, 'RUB', '2026-12-05', 'found', 'RU', null, 0, null],
    ['DEMO-RESULT-WON', 'Итоги · наружное освещение выиграно', 'rts', 990000, 'RUB', '2026-10-05', 'won', 'RU', mgr, 100, null],
    ['FOUND-7788', 'Новый лот · спорткомплекс', 'zakupki', 760000, 'RUB', '2026-12-12', 'found', 'RU', emp1, 0, null],
    ['WORK-3310', 'В работе · КП черновик', 'b2b', 405000, 'RUB', '2026-11-14', 'in_work', 'RU', emp2, 18, null],
  ];

  const ids = [];
  for (const r of rows) {
    ids.push(Number(ins.run(...r).lastInsertRowid));
  }

  // Employee task strip samples
  const tasks = [
    [ids[0], emp1, 'Дособрать КП и спецификацию', 72, 'open'],
    [ids[0], emp2, 'Проверить чертежи DWG', 50, 'open'],
    [ids[1], emp2, 'Сравнение цен поставщиков', 40, 'open'],
    [ids[2], mgr, 'Согласовать НМЦК с дирекцией', 55, 'open'],
    [ids[4], emp2, 'Обновить дату подачи в CRM', 25, 'open'],
    [ids[9], empCn, 'Samples + packing list', 35, 'open'],
    [ids[11], emp1, 'Загрузить заявку на RTS', 80, 'open'],
    [ids[7], mgr, 'Договор и график поставок', 100, 'done'],
    [ids[16], emp2, 'Черновик КП', 18, 'open'],
  ];
  for (const t of tasks) taskIns.run(...t);

  const byStatus = database
    .prepare(`SELECT status, COUNT(*) AS c FROM tenders GROUP BY status`)
    .all();
  console.log('[db] seeded tenders', byStatus.map((x) => x.status + '=' + x.c).join(' '));
}

/** Seed SMTP outbound allowlist (shared mailbox who/what may send/receive OTP). */
function seedSmtpAllowlist(database) {
  // Remove superseded draft spellings (keep only confirmed Ruslan@light-Industry.com).
  database.exec(`
    DELETE FROM smtp_senders_allowlist
    WHERE lower(email) IN (
      lower('ruslan@lightindustry.com'),
      lower('ruslan@lightdevindustry.com'),
      lower('ruslan@lightindustry.com')
    )
    OR (
      lower(email) LIKE 'ruslan@%'
      AND lower(email) != lower('Ruslan@light-Industry.com')
    )
  `);

  const upsert = database.prepare(
    `INSERT INTO smtp_senders_allowlist (email, label, active, created_by)
     VALUES (?, ?, 1, NULL)
     ON CONFLICT(email) DO UPDATE SET
       email = excluded.email,
       label = excluded.label,
       active = 1`
  );
  // Mailbox / system OTP sender identity (admin user email stays gililllight for OTP inbox).
  upsert.run('gililllight@gmail.com', 'mailbox / system');
  // General admin (Ruslan) — FINAL confirmed: Ruslan@light-Industry.com (hyphen, capital I).
  upsert.run('Ruslan@light-Industry.com', 'генерал / general_admin');
  console.log('[db] smtp_senders_allowlist seeded (gililllight@gmail.com, Ruslan@light-Industry.com)');
}


function initDb() {
  const database = openDb();
  migrate(database);
  seed(database);
  ensureUserEmails(database);
  seedSmtpAllowlist(database);
  seedNews(database);
  seedTenders(database);
  try {
    const { ensureProjectColumns, seedProjectCards } = require('./projects');
    ensureProjectColumns(database);
    seedProjectCards(database);
  } catch (e) {
    console.warn('[db] project cards seed skipped', e.message);
  }
  console.log('[db] ready', DB_PATH);
  return database;
}

module.exports = { initDb, getDb, DB_PATH, openDb };

