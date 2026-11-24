'use strict';

/**
 * Navigation move, top-tab type size, and zh/ru/en completeness for the shell.
 * Does not launch Windows or touch a release.
 */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'server/public/shell-v2.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'server/public/shell-v2.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'server/public/shell-v2.js'), 'utf8');

let failed = 0;
function check(name, cond) {
  if (cond) console.log('PASS', name);
  else {
    failed += 1;
    console.error('FAIL', name);
  }
}

const navStart = html.indexOf('id="pills"');
const navEnd = html.indexOf('id="theme-popover-wrap"');
const nav = html.slice(navStart, navEnd);
const settingsStart = html.indexOf('class="settings-links"');
const settingsEnd = html.indexOf('id="theme-swatches"');
const settings = html.slice(settingsStart, settingsEnd);

check('CRM stays in the top navigation', nav.includes('data-section="crm"') && nav.includes('data-i18n="nav.crm"'));
check('Gilil Supply left the top navigation', !nav.includes('data-section="supply"') && !nav.includes('id="pill-supply"'));
check('mail statistics left the top navigation', !nav.includes('data-section="mail-stats"'));
check('journal left the top navigation', !nav.includes('data-section="activity"'));
check('Gilil Supply is a settings action', settings.includes('id="btn-settings-supply"') && settings.includes('data-i18n="nav.supply"'));
check('mail statistics is a settings action', settings.includes('id="btn-settings-mail-stats"') && settings.includes('data-i18n="nav.mail_stats"'));
check('journal is a settings action', settings.includes('id="btn-settings-activity"') && settings.includes('data-i18n="nav.activity"'));
check('no invented delete-supply control', !/delete-supply|удалить поставк|删除供应/i.test(html + js));
check('supply section still exists', html.includes('id="sec-supply"') && html.includes('id="supply-frame"'));
check('role gates still target the moved entries', js.includes("$('#btn-settings-mail-stats')") && js.includes("$('#btn-settings-activity')"));
check('settings links still open the same sections', js.includes("bindSettingsLink('btn-settings-supply', 'supply')") && js.includes("bindSettingsLink('btn-settings-mail-stats', 'mail-stats')") && js.includes("bindSettingsLink('btn-settings-activity', 'activity')"));

check('top tabs wrap instead of a clipping scrollbar', /flex-wrap:\s*wrap/.test(css) && css.includes('scrollbar-width: none'));
check('top tab font is the 12.5px baseline plus exactly 2pt', css.includes('calc(12.5px + (2 * 96px / 72))'));
check('narrow layout does not put the old 12px size back', !/\.pill\s*\{[^}]*font-size:\s*12px/.test(css));
const side = css.slice(css.indexOf('.sidebar {'), css.indexOf('.sidebar {') + 700);
const shell = css.slice(css.indexOf('#app-shell {'), css.indexOf('#app-shell {') + 400);
const bodyRule = css.slice(css.indexOf('.body {'), css.indexOf('.body {') + 450);
check('sidebar column stretches inside a viewport-tall shell', /height:\s*100dvh/.test(shell) && /grid-row:\s*3/.test(bodyRule) && /height:\s*100%/.test(side) && /min-height:\s*100%/.test(side) && /background-color:\s*var\(--bg-elev\)/.test(side));
check('chat list scrolls inside the sidebar column', /\.chat-groups\s*\{[^}]*flex:\s*1 1 auto/.test(css) && /\.chat-groups\s*\{[^}]*min-height:\s*0/.test(css) && /\.chat-groups\s*\{[^}]*overflow:\s*auto/.test(css));
check('uninstall still does not delete AppData', !js.includes('--delete-app-data') && fs.readFileSync(path.join(root, 'package.json'), 'utf8').includes('"deleteAppDataOnUninstall": false'));

const i18nStart = js.indexOf('const I18N = {');
let depth = 0;
let end = -1;
for (let p = js.indexOf('{', i18nStart); p < js.length; p++) {
  if (js[p] === '{') depth += 1;
  else if (js[p] === '}') {
    depth -= 1;
    if (depth === 0) { end = p + 1; break; }
  }
}
const I18N = eval('(' + js.slice(js.indexOf('{', i18nStart), end) + ')');
const langs = ['zh', 'ru', 'en'];
const keys = new Set();
langs.forEach((l) => Object.keys(I18N[l]).forEach((k) => keys.add(k)));
let missing = 0;
for (const key of keys) {
  for (const lang of langs) {
    if (I18N[lang][key] == null || String(I18N[lang][key]).trim() === '') {
      missing += 1;
      console.error('MISSING', lang, key);
    }
  }
}
check('zh, ru, and en have the same nonempty shell keys', missing === 0);

function han(s) { return (String(s).match(/\p{Script=Han}/gu) || []).length; }
function cyr(s) { return (String(s).match(/\p{Script=Cyrillic}/gu) || []).length; }
const allowLatin = /^(CRM|SRM|TV|Gilil Supply|Gilil On|email@example\.com|SRM TV|AI Lighting Studio — Gilil Supply)$/;
let zhCyr = 0;
let enForeign = 0;
for (const [key, value] of Object.entries(I18N.zh)) {
  if (cyr(value) > 0) {
    zhCyr += 1;
    console.error('ZH CYRILLIC', key, value);
  }
}
for (const [key, value] of Object.entries(I18N.en)) {
  if ((cyr(value) > 0 || han(value) > 0) && !allowLatin.test(String(value).trim())) {
    enForeign += 1;
    console.error('EN FOREIGN', key, value);
  }
}
check('Chinese shell strings do not contain Cyrillic', zhCyr === 0);
check('English shell strings are not Chinese or Russian leftovers', enForeign === 0);
check('Chinese reload control is Chinese', I18N.zh['supply.reload'] === '刷新');
check('journal and mail statistics have natural labels', I18N.ru['nav.activity'] === 'Журнал' && I18N.en['nav.activity'] === 'Activity log' && I18N.zh['nav.mail_stats'] === '邮件统计' && I18N.en['nav.mail_stats'] === 'Mail statistics');
const roleToast = ['toast.tpl_deny', 'toast.tpl_count', 'toast.mail_stats_deny'].map((k) => I18N.zh[k] + '\n' + I18N.ru[k]).join('\n');
check('Russian and Chinese role toasts use role words, not admin/director ids', !/admin|director/i.test(roleToast));
check('role fixture stays off in the desktop shell and off outside localhost', js.includes('window.gililDesktop') && js.includes("get('fixtureRole')") && js.includes("host !== '127.0.0.1'") && js.includes("host !== 'localhost'"));
const tv = fs.readFileSync(path.join(root, 'server/public/crm-tv.html'), 'utf8');
const pageLang = fs.readFileSync(path.join(root, 'server/public/ui-lang.js'), 'utf8');
check('SRM clock reads the selected language and refreshes when it changes', tv.includes('GililPageLang.lang()') && tv.includes('tickClock()') && !/toLocaleString\(\s*'ru-RU'/.test(tv));
check('embedded pages apply a language the shell posts', pageLang.includes("e.data.type !== 'gilil:lang'") && js.includes("type: 'gilil:lang'"));
const statsFn = js.slice(js.indexOf('async function renderMailStats'), js.indexOf('async function renderMailStats') + 3200);
check('mail statistics column headers use translation keys', statsFn.includes("t('mail.col_role')") && statsFn.includes("t('mail.col_client')") && !statsFn.includes("'Роль'") && !statsFn.includes("'Клиент'"));
check('localhost fixture paints the empty mail and journal layout without a token', js.includes('isolatedFixtureRole') && statsFn.includes("t('mail.no_rows')") && js.includes("t('activity.empty')") && js.includes("isolatedFixtureRole === 'admin'"));

const baselinePx = 12.5;
const plusTwoPtPx = 2 * 96 / 72;
const newPx = baselinePx + plusTwoPtPx;
check('two points is 8/3 CSS pixels', Math.abs(plusTwoPtPx - (8 / 3)) < 1e-9);
console.log('FONT baseline 12.5px = 9.375pt; new ' + newPx + 'px = 11.375pt');

if (failed) {
  console.error(failed + ' failed');
  process.exit(1);
}
console.log('OK shell nav and i18n');
