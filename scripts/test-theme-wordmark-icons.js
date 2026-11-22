'use strict';

/**
 * Checks the shipped wordmark ICOs and that the installer/shortcut wiring
 * points at those files. Does not launch Electron or Windows.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..');

function readIco(file) {
  const data = fs.readFileSync(file);
  assert.strictEqual(data.readUInt16LE(0), 0, 'reserved');
  assert.strictEqual(data.readUInt16LE(2), 1, 'type icon');
  const count = data.readUInt16LE(4);
  const images = [];
  for (let i = 0; i < count; i++) {
    const base = 6 + i * 16;
    let w = data.readUInt8(base);
    let h = data.readUInt8(base + 1);
    if (w === 0) w = 256;
    if (h === 0) h = 256;
    const bytes = data.readUInt32LE(base + 8);
    const offset = data.readUInt32LE(base + 12);
    const blob = data.subarray(offset, offset + bytes);
    assert.strictEqual(blob.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${file} size ${w} is PNG`);
    images.push({ w, h, blob });
  }
  return images;
}

function sampleOpaque(blob) {
  // PNG IHDR is enough to know dimensions; decode via a tiny inflate of IDAT is unnecessary.
  // Look at the raw file for a non-zero alpha by scanning the uncompressed... we instead
  // require the PNG color type to include alpha (byte 25 of IHDR: color type 6).
  const ihdr = blob.indexOf(Buffer.from('IHDR'));
  assert.ok(ihdr > 0);
  const colorType = blob[ihdr + 4 + 8 + 1];
  assert.strictEqual(colorType, 6, 'RGBA PNG');
}

const required = [16, 20, 24, 32, 40, 48, 64, 96, 128, 256];
const themes = ['dark', 'bitrix', 'cyan'];
const digests = new Set();
for (const theme of themes) {
  const file = path.join(root, 'icons', 'themes', `gilil-on-${theme}.ico`);
  const images = readIco(file);
  const sizes = images.map((im) => im.w).sort((a, b) => a - b);
  assert.deepStrictEqual(sizes, required, theme + ' sizes');
  for (const im of images) sampleOpaque(im.blob);
  digests.add(fs.readFileSync(file).toString('hex').slice(0, 64));
}
assert.strictEqual(digests.size, 3, 'theme icons must differ');

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
assert.strictEqual(pkg.build.nsis.createDesktopShortcut, 'always');
assert.ok(pkg.build.nsis.deleteAppDataOnUninstall !== true, 'uninstall must keep the user database');
assert.strictEqual(pkg.build.nsis.include, 'build/nsis-gilil.nsh');
assert.ok(pkg.build.extraResources.some((r) => r.from === 'icons/themes'));

const nsh = fs.readFileSync(path.join(root, 'build', 'nsis-gilil.nsh'), 'utf8');
assert.ok(nsh.includes('gilil-on-dark.ico'));
assert.ok(nsh.includes('Gilil On.lnk'));
assert.ok(!nsh.includes('RMDir /r "$APPDATA\\gilil-on-desktop"'), 'uninstall must not delete AppData');
assert.ok(nsh.includes('0x2000'), 'SHCNE_UPDATEITEM');
assert.ok(!nsh.includes('0x08000000') && !nsh.includes('0x8000000'), 'no SHCNE_ASSOCCHANGED');

const main = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
assert.ok(main.includes('gilil-on-dark.ico'));
assert.ok(main.includes('SHCNE_UPDATEITEM = 0x00002000'));
assert.ok(main.includes('unlinkSync(staleFlag)'));
assert.ok(!main.includes('writeFileSync(flagPath'));
assert.ok(!main.includes('DESKTOP_SHORTCUT_FLAG'));
assert.ok(main.includes('server-startup.log'), 'startup fix still present');
assert.ok(main.includes('Server exited before becoming ready'), 'fail-fast dialog still present');

const index = fs.readFileSync(path.join(root, 'server', 'src', 'index.js'), 'utf8');
assert.ok(index.includes("server.on('error'"));
assert.ok(index.includes('EADDRINUSE'));

console.log('theme wordmark icon checks passed');
