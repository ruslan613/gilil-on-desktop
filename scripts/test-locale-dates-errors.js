'use strict';

const fs = require('fs');
const path = require('path');
const loc = require('../server/public/ui-locale');

const root = path.join(__dirname, '..');
let failed = 0;
function check(name, cond) {
  if (cond) console.log('PASS', name);
  else {
    failed += 1;
    console.error('FAIL', name);
  }
}

check('ru date is day.month.year', loc.formatDate('2026-05-26', 'ru') === '26.05.2026');
check('zh date is year-month-day', loc.formatDate('2026-05-26', 'zh') === '2026-05-26');
check('en date is month/day/year', loc.formatDate('2026-05-26', 'en') === '05/26/2026');
check('ru text parses back to iso', loc.parseDate('26.05.2026', 'ru').iso === '2026-05-26');
check('zh text parses back to iso', loc.parseDate('2026-05-26', 'zh').iso === '2026-05-26');
check('en text parses back to iso', loc.parseDate('05/26/2026', 'en').iso === '2026-05-26');
check('empty date is empty', loc.parseDate('  ', 'ru').empty === true);
check('31.02 is invalid', loc.parseDate('31.02.2026', 'ru').invalid === true);
check('time accepts 24-hour', loc.parseTime('9:05').value === '09:05');
check('time rejects 25:00', loc.parseTime('25:00').invalid === true);

const ruErr = loc.userError('unauthorized', 'ru');
const zhErr = loc.userError('unauthorized', 'zh');
const enErr = loc.userError('general_locked', 'en');
check('unauthorized is Russian for ru', /вход/i.test(ruErr) && !/[\u4e00-\u9fff]/.test(ruErr));
check('unauthorized is Chinese for zh', /登录/.test(zhErr));
check('general_locked is English and not the stored Russian sentence', enErr.indexOf('cannot be removed') >= 0 && enErr.indexOf('Генерал') < 0);
check('a Russian sentence is not shown as the error', loc.userError('Генерал нельзя удалить с проекта', 'zh') === loc.userError('', 'zh'));
check('unknown code stays a code inside a translated sentence', loc.userError('some_new_code', 'en').indexOf('some_new_code') >= 0 && loc.userError('some_new_code', 'en').indexOf('failed') >= 0);

const html = fs.readFileSync(path.join(root, 'server/public/shell-v2.html'), 'utf8');
const news = fs.readFileSync(path.join(root, 'server/public/news.html'), 'utf8');
check('shell date fields are text, not the browser date widget', html.includes('class="gilil-date"') && !html.includes('type="date"'));
check('shell time field is text, not the browser time widget', html.includes('class="gilil-time"') && !html.includes('type="time"'));
check('settings studio label is a translation key', html.includes('data-i18n="nav.als"'));
check('shell does not link to tenders-dashboard.html', !html.includes('tenders-dashboard.html'));
check('shell does not link to crm.html', !html.includes('/crm.html'));
check('news does not link to the absent files', !news.includes('tenders-dashboard.html') && !news.includes('href="/crm.html"'));
check('tenders-dashboard.html is not in the repo', !fs.existsSync(path.join(root, 'server/public/tenders-dashboard.html')));
check('crm.html is not in the repo', !fs.existsSync(path.join(root, 'server/public/crm.html')));

const shell = fs.readFileSync(path.join(root, 'server/public/shell-v2.js'), 'utf8');
check('api messages are not placed in the panel text', !shell.includes("esc((r.data && r.data.error)"));
check('language switch refreshes date fields', shell.includes('refreshLocaleFields()'));
check('a 401 without a body is treated as sign-in required', shell.includes("status === 401") && shell.includes("key = 'unauthorized'"));

if (failed) {
  console.error(failed + ' failed');
  process.exit(1);
}
console.log('OK locale dates and errors');
