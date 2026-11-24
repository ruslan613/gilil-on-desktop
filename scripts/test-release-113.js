'use strict';

/**
 * Release 1.1.3 checks that do not launch Windows, Electron, or a network publish.
 * Icon bytes, settings order, manual update wiring, and AppData retention.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
let failed = 0;
function check(name, cond) {
  if (cond) console.log('PASS', name);
  else {
    failed += 1;
    console.error('FAIL', name);
  }
}

function sha(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const nsh = fs.readFileSync(path.join(root, 'build', 'nsis-gilil.nsh'), 'utf8');
const updater = fs.readFileSync(path.join(root, 'auto-updater.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'server/public/shell-v2.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'server/public/shell-v2.js'), 'utf8');
const main = fs.readFileSync(path.join(root, 'main.js'), 'utf8');

check('package version is 1.1.5', pkg.version === '1.1.5');
check('installer name stays on the existing feed pattern', pkg.build.nsis.artifactName === 'GililOn-${version}-win-setup.exe');
check('uninstall does not opt into deleting AppData', pkg.build.nsis.deleteAppDataOnUninstall === false);
check('custom uninstall does not remove the user directory', !nsh.includes('RMDir') && nsh.includes('Leave %APPDATA%\\gilil-on-desktop'));
check('packaged app checks on startup and in the background', updater.includes('START_DELAY_MS') && updater.includes('BACKGROUND_MS') && updater.includes('shouldStartCheck'));
check('download is automatic and install waits for quit', updater.includes('u.autoDownload = true') && updater.includes('u.autoInstallOnAppQuit = true'));
const downloaded = updater.slice(updater.indexOf("u.on('update-downloaded'"), updater.indexOf("u.on('error'"));
check('a finished download does not restart the app', !downloaded.includes('quitAndInstall'));
check('manual download IPC remains beside automatic download', updater.includes("ipcMain.handle('gilil:update-download'") && updater.includes('u.autoDownload = true'));

const linksAt = html.indexOf('class="settings-links"');
const swatchAt = html.indexOf('id="theme-swatches"');
const ids = [...html.slice(linksAt, swatchAt).matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
check('instruction is last and the other actions keep their order', JSON.stringify(ids) === JSON.stringify([
  'btn-settings-tv',
  'btn-settings-funnel',
  'btn-settings-usefulness',
  'btn-settings-director',
  'btn-settings-supply',
  'btn-settings-mail-stats',
  'btn-settings-activity',
  'btn-settings-als',
  'btn-settings-check-update',
  'settings-update-status',
  'btn-settings-manual',
]));
check('red new mark is on the check button', html.includes('class="settings-update-new"') && html.includes('id="btn-settings-check-update"'));
const handler = js.slice(js.indexOf('async function onSettingsCheckUpdate'), js.indexOf('function bindUpdateUi'));
check('settings button calls checkForUpdates only', handler.includes('checkForUpdates') && !handler.includes('downloadUpdate') && !handler.includes('installUpdate') && !handler.includes('location.reload'));
check('instruction still calls openManual', js.includes("['btn-settings-manual', 'btn-settings-manual-personal']") && js.includes('openManual()'));

check('database path stays under userData', main.includes("path.join(app.getPath('userData'), 'gilil-on-data')") && main.includes('DATABASE_PATH: dbPath'));
check('window, tray, and shortcut use the theme icon', main.includes('resolveThemeWordmarkIcon(readSavedSplashTheme())') && main.includes('tray.setImage') && main.includes('mainWindow.setIcon'));

const cyan = sha(path.join(root, 'server/public/icons/themes/gililon-cyan.svg'));
check('cyan SVG is the approved byte-for-byte file', cyan === '4e04719e8cfb6f410654d4ab51b0126df01b32db486f578e0bd790cd7aed4ea6');
check('gold and navy SVG hashes are the approved files',
  sha(path.join(root, 'server/public/icons/themes/gililon-dark.svg')) === '1d43e6834b0d9d5d73aecf15c11c839e963b5a1721619e81bb27ea20ac6d8d6f' &&
  sha(path.join(root, 'server/public/icons/themes/gililon-bitrix.svg')) === 'd81a8ec141ea7f632a171218c9eeae97c70fa7af869615a561a4edbfc1761713');

function icoFrames(file) {
  const data = fs.readFileSync(file);
  const count = data.readUInt16LE(4);
  const frames = [];
  for (let i = 0; i < count; i++) {
    const base = 6 + i * 16;
    let w = data.readUInt8(base);
    let h = data.readUInt8(base + 1);
    if (w === 0) w = 256;
    if (h === 0) h = 256;
    const bytes = data.readUInt32LE(base + 8);
    const offset = data.readUInt32LE(base + 12);
    const blob = data.subarray(offset, offset + bytes);
    const ihdr = blob.indexOf(Buffer.from('IHDR'));
    frames.push({
      w,
      h,
      png: blob.subarray(0, 4).toString('hex') === '89504e47',
      colorType: ihdr > 0 ? blob[ihdr + 4 + 8 + 1] : -1,
      ihdrW: ihdr > 0 ? blob.readUInt32BE(ihdr + 4) : 0,
      ihdrH: ihdr > 0 ? blob.readUInt32BE(ihdr + 8) : 0,
    });
  }
  return frames;
}
const expected = [16, 20, 24, 32, 40, 48, 64, 96, 128, 256];
for (const theme of ['dark', 'bitrix', 'cyan']) {
  const file = path.join(root, 'icons', 'themes', `gilil-on-${theme}.ico`);
  const frames = icoFrames(file);
  const sizes = frames.map((f) => f.w).sort((a, b) => a - b);
  check(theme + ' ico frames', JSON.stringify(sizes) === JSON.stringify(expected));
  check(theme + ' frames are square RGBA png', frames.every((f) => f.png && f.w === f.h && f.colorType === 6 && f.ihdrW === f.w && f.ihdrH === f.h));
}

if (failed) {
  console.error(failed + ' failed');
  process.exit(1);
}
console.log('OK release 1.1.3 checks');
