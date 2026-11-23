'use strict';

/**
 * Demo entry is gone. Real username/password login still accepts a correct
 * password and refuses a wrong one. Uses a temporary database only.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const bcrypt = require(path.join(__dirname, '..', 'server', 'node_modules', 'bcryptjs'));

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'server/public/shell-v2.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'server/public/shell-v2.js'), 'utf8');

let failed = 0;
function check(name, cond) {
  if (cond) console.log('PASS', name);
  else {
    failed += 1;
    console.error('FAIL', name);
  }
}

const gateStart = html.indexOf('id="login-gate"');
const gateEnd = html.indexOf('id="app-shell"');
const gate = html.slice(gateStart, gateEnd);
check('login gate has username and password fields', gate.includes('id="login-username"') && gate.includes('id="login-password"') && gate.includes('id="btn-password-login"'));
check('login gate has no demo button or passwordless hint', !gate.includes('id="btn-enter"') && !gate.includes('btn-demo-enter') && !/без пароля|无需密码|no password/i.test(gate));
check('shell does not open a demo session', !js.includes('function enterDemo') && !js.includes("get('demo')") && !js.includes("sess === 'ru1'"));
check('client no longer carries seeded passwords', !js.includes('admin123') && !js.includes('mgr123') && !js.includes('dir123'));
check('password login calls the real auth route', js.includes("fetch('/api/auth/login'") && js.includes('loginWithPassword'));
const loginFn = js.slice(js.indexOf('async function loginWithPassword'), js.indexOf('// ——— Wire events ———'));
check('password login does not open the shell before a token', loginFn.indexOf('if (!r.ok || !data || !data.token)') < loginFn.indexOf('openShellAfterAuth'));

const dbPath = path.join(os.tmpdir(), 'gilil-auth-test-' + process.pid + '.db');
for (const suffix of ['', '-wal', '-shm']) {
  try { fs.unlinkSync(dbPath + suffix); } catch (_) {}
}
process.env.DATABASE_PATH = dbPath;
const { initDb } = require('../server/src/db');
const { login } = require('../server/src/auth');
process.env.JWT_SECRET = 'ui-test-only-secret';
const db = initDb();
const username = 'auth_check_user';
const password = 'pw-' + process.pid + '-ok';
db.prepare(
  `INSERT INTO users (username, password_hash, role, region, display_name, locale, active)
   VALUES (?, ?, 'manager', 'RU', 'Auth Check', 'ru', 1)`
).run(username, bcrypt.hashSync(password, 8));

const ok = login(username, password, { ip: '127.0.0.1', userAgent: 'test' });
check('correct password returns a token', !!(ok && ok.token && ok.user && ok.user.username === username));

let refused = false;
try {
  login(username, 'not-the-password', { ip: '127.0.0.1', userAgent: 'test' });
} catch (err) {
  refused = err && err.message === 'invalid_credentials' && err.status === 401;
}
check('wrong password is refused', refused);

let emptyRefused = false;
try {
  login(username, '', { ip: '127.0.0.1', userAgent: 'test' });
} catch (err) {
  emptyRefused = err && err.message === 'invalid_credentials';
}
check('empty password is refused', emptyRefused);

for (const suffix of ['', '-wal', '-shm']) {
  try { fs.unlinkSync(dbPath + suffix); } catch (_) {}
}

if (failed) {
  console.error(failed + ' failed');
  process.exit(1);
}
console.log('OK no demo login');
