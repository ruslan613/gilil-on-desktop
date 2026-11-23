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
check('gear menu has no Gilil Supply entry', !/Gilil Supply/i.test(pop) && !pop.includes('pill-supply') && !pop.includes('sec-supply'));
check('top navigation still has Gilil Supply', html.includes('id="pill-supply"') && html.includes('>Gilil Supply</span>'));
check('supply section and frame remain', html.includes('id="sec-supply"') && html.includes('id="supply-frame"'));

const linksAt = html.indexOf('class="settings-links"');
const swatchAt = html.indexOf('id="theme-swatches"');
const ids = [...html.slice(linksAt, swatchAt).matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
check('instruction stays last', ids[ids.length - 1] === 'btn-settings-manual');
check('red new mark stays on the check button', html.includes('class="settings-update-new">new</span>'));

check('emblem is 50px, about 1.4 times 36', css.includes('width: 50px !important') && css.includes('height: 50px') && html.includes('width="50" height="50"'));
check('emblem keeps its picture', css.includes('object-fit: contain'));
check('narrow header uses a smaller emblem', css.includes('max-width: 900px') && css.includes('width: 42px'));

check('sidebar stretches to the row', css.includes('.sidebar {') && /height:\s*100%/.test(css.slice(css.indexOf('.sidebar {'), css.indexOf('.sidebar {') + 500)) && css.includes('align-self: stretch'));
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
check('updater still does not install on its own', updater.includes('autoInstallOnAppQuit = false') && !updater.includes('setTimeout'));

if (failed) {
  console.error(failed + ' failed');
  process.exit(1);
}
console.log('OK ui 1.1.3 patch');
