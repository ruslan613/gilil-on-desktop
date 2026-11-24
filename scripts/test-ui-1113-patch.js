'use strict';

/**
 * Static checks for the 1.1.3 UI patch.
 * No Electron window, no installer, no database.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { captionForTheme, captionOptions, CAPTION_HEIGHT } = require('../window-chrome');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'server/public/shell-v2.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'server/public/shell-v2.css'), 'utf8');
const main = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
const updater = fs.readFileSync(path.join(root, 'auto-updater.js'), 'utf8');

let failed = 0;
function check(name, cond) {
  if (cond) console.log('PASS', name);
  else {
    failed += 1;
    console.error('FAIL', name);
  }
}

const popStart = html.indexOf('id="theme-popover"');
const popEnd = html.indexOf('id="notif-wrap"');
const pop = html.slice(popStart, popEnd);
check('settings keeps Gilil Supply', pop.includes('id="btn-settings-supply"') && pop.includes('data-i18n="nav.supply"'));
check('top navigation no longer has the Supply pill', !html.includes('id="pill-supply"'));
check('supply section and frame remain', html.includes('id="sec-supply"') && html.includes('id="supply-frame"'));

const linksAt = html.indexOf('class="settings-links"');
const swatchAt = html.indexOf('id="theme-swatches"');
const ids = [...html.slice(linksAt, swatchAt).matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
check('instruction stays last', ids[ids.length - 1] === 'btn-settings-manual');
check('red new mark stays on the check button', html.includes('class="settings-update-new"') && html.includes('id="btn-settings-check-update"'));

check('emblem is 50px, about 1.4 times 36', css.includes('width: 50px !important') && css.includes('height: 50px') && html.includes('width="50" height="50"'));
check('emblem keeps its picture', css.includes('object-fit: contain'));
check('narrow header uses a smaller emblem', css.includes('max-width: 900px') && css.includes('width: 42px'));

const sideBlock = css.slice(css.indexOf('.sidebar {'), css.indexOf('.sidebar {') + 700);
check('sidebar stretches to the row', css.includes('.sidebar {') && /align-self:\s*stretch/.test(sideBlock) && /height:\s*100%/.test(sideBlock) && /grid-row:\s*3/.test(css) && css.includes('height: 100dvh'));
check('team list scrolls inside the sidebar', css.includes('flex: 1 1 auto') && css.includes('min-height: 0'));

assert.strictEqual(CAPTION_HEIGHT, 32);
assert.deepStrictEqual(captionForTheme('dark'), { color: '#14110e', symbolColor: '#f1e6d4' });
assert.deepStrictEqual(captionForTheme('bitrix'), { color: '#FFFFFF', symbolColor: '#333333' });
assert.deepStrictEqual(captionForTheme('beige'), { color: '#fbf8f3', symbolColor: '#2b2622' });
assert.deepStrictEqual(captionForTheme('cyan'), { color: '#111827', symbolColor: '#e5e7eb' });
assert.deepStrictEqual(captionForTheme('blue').color, captionForTheme('cyan').color);
assert.strictEqual(captionOptions('dark').height, 32);
check('caption colors match the three themes', true);

check('windows caption is applied from the saved theme', main.includes("titleBarStyle = 'hidden'") && main.includes('titleBarOverlay = captionOptions(readSavedSplashTheme())'));
check('theme switch repaints the caption', main.includes('applyWindowChrome(mainWindow, theme)'));
check('caption inset is only marked for Windows', html.includes("platform === 'win32'") && css.includes('html.win-caption #app-shell'));
check('updater downloads from the release feed and installs on quit', updater.includes('u.autoDownload = true') && updater.includes('u.autoInstallOnAppQuit = true') && updater.includes('shouldStartCheck'));

const nsh = fs.readFileSync(path.join(root, 'build/nsis-gilil.nsh'), 'utf8');
check('start menu shortcut uses the approved emblem', nsh.includes('$newStartMenuLink') && nsh.includes('gilil-on-dark.ico') && !nsh.includes('RMDir'));
check('runtime refreshes the Start menu shortcut', main.includes('Start Menu') && main.includes('brandedShortcutPaths'));
const darkIco = fs.readFileSync(path.join(root, 'icons/themes/gilil-on-dark.ico'));
const winIco = fs.readFileSync(path.join(root, 'icons/gilil-on-windows.ico'));
check('exe fallback ico is the approved dark emblem', darkIco.equals(winIco));
check('favicon default is the theme emblem', html.includes('href="/icons/themes/gililon-dark.png"'));
check('settings gear button remains the settings control', html.includes('id="btn-theme-gear"') && html.includes('⚙'));

if (failed) {
  console.error(failed + ' failed');
  process.exit(1);
}
console.log('OK ui 1.1.3 patch');
