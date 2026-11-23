'use strict';

/**
 * Own profile edit. Temporary database only. Does not touch a live user database.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const bcrypt = require(path.join(__dirname, '..', 'server', 'node_modules', 'bcryptjs'));

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'server/public/shell-v2.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'server/public/shell-v2.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'server/public/shell-v2.css'), 'utf8');

let failed = 0;
function check(name, cond) {
  if (cond) console.log('PASS', name);
  else {
    failed += 1;
    console.error('FAIL', name);
  }
}

const cardStart = html.indexOf('class="card who-card"');
const cardEnd = html.indexOf('id="director-rating-card"');
const card = html.slice(cardStart, cardEnd);
check('who card has a gear in its top area', card.includes('id="btn-who-edit"') && card.includes('⚙') && card.indexOf('btn-who-edit') < card.indexOf('id="who-view"'));
check('editor offers name and company only', card.includes('id="who-edit-name"') && card.includes('id="who-edit-company"') && !card.includes('name="role"') && !card.includes('name="username"'));
check('save and cancel are both present', card.includes('id="who-edit-save"') && card.includes('id="who-edit-cancel"'));
check('edit form starts hidden', card.includes('id="who-edit-form"') && card.includes('class="who-edit hidden"'));
check('who card still uses the theme card class', card.includes('class="card who-card"') && css.includes('.who-card-gear'));

const cancelFn = js.slice(js.indexOf('function bindWhoEditor'), js.indexOf('function bind('));
check('cancel closes the editor and does not save', cancelFn.includes('setWhoEditing(false)') && !cancelFn.includes("fetch('/api/me/profile'"));
const saveFn = js.slice(js.indexOf('async function saveOwnProfile'), js.indexOf('function bindWhoEditor'));
check('save sends only name and company', saveFn.includes('display_name') && saveFn.includes('profile_company') && !saveFn.includes('role:') && !saveFn.includes('username:'));

const dbPath = path.join(os.tmpdir(), 'gilil-profile-test-' + process.pid + '.db');
for (const suffix of ['', '-wal', '-shm']) {
  try { fs.unlinkSync(dbPath + suffix); } catch (_) {}
}
process.env.DATABASE_PATH = dbPath;
process.env.JWT_SECRET = 'profile-test-only';
const { initDb } = require('../server/src/db');
const { updateOwnProfile } = require('../server/src/profile');
const db = initDb();
const hash = bcrypt.hashSync('pw-' + process.pid, 8);
const insert = db.prepare(
  `INSERT INTO users (username, password_hash, role, region, display_name, locale, active)
   VALUES (?, ?, ?, 'RU', ?, 'ru', 1)`
);
const idA = Number(insert.run('profile_a_' + process.pid, hash, 'employee', 'Alpha').lastInsertRowid);
const idB = Number(insert.run('profile_b_' + process.pid, hash, 'director', 'Beta').lastInsertRowid);

const saved = updateOwnProfile(db, idA, { display_name: 'Alpha Edited', profile_company: 'Studio' });
const rowA = db.prepare('SELECT * FROM users WHERE id = ?').get(idA);
const rowB = db.prepare('SELECT * FROM users WHERE id = ?').get(idB);
check('save persists and reload reads the new name and company', saved.user && saved.user.display_name === 'Alpha Edited' && rowA.display_name === 'Alpha Edited' && rowA.profile_company === 'Studio');
check('another user is not changed', rowB.display_name === 'Beta' && rowB.role === 'director' && !rowB.profile_company);

const blocked = updateOwnProfile(db, idA, { display_name: 'Hacked', role: 'general_admin' });
const afterBlock = db.prepare('SELECT role, display_name FROM users WHERE id = ?').get(idA);
check('role cannot be self-escalated', blocked.error === 'field_protected' && blocked.status === 403 && afterBlock.role === 'employee' && afterBlock.display_name === 'Alpha Edited');

const regionBlocked = updateOwnProfile(db, idA, { display_name: 'Alpha Edited', region: 'ALL' });
check('region stays protected', regionBlocked.error === 'field_protected' && db.prepare('SELECT region FROM users WHERE id = ?').get(idA).region === 'RU');

const loginBlocked = updateOwnProfile(db, idA, { display_name: 'Alpha Edited', username: 'other' });
check('username stays protected', loginBlocked.error === 'field_protected' && db.prepare('SELECT username FROM users WHERE id = ?').get(idA).username.indexOf('profile_a_') === 0);

for (const suffix of ['', '-wal', '-shm']) {
  try { fs.unlinkSync(dbPath + suffix); } catch (_) {}
}

if (failed) {
  console.error(failed + ' failed');
  process.exit(1);
}
console.log('OK own profile');
