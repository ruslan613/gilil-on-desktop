'use strict';
/** Before Windows dist: put win32 better-sqlite3 .node into stage2 server node_modules. */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const winNode = path.join(root, 'vendor', 'better-sqlite3-win32', 'better_sqlite3.node');
const targetDir = path.join(
  root,
  'server',
  'node_modules',
  'better-sqlite3',
  'build',
  'Release'
);
const target = path.join(targetDir, 'better_sqlite3.node');
const bak = path.join(targetDir, 'better_sqlite3.node.linux-x64.bak');

if (!fs.existsSync(winNode)) {
  console.error('[prep-win-native] missing', winNode);
  process.exit(1);
}
if (!fs.existsSync(targetDir)) {
  console.error('[prep-win-native] server better-sqlite3 not installed at', targetDir);
  process.exit(1);
}

const cur = fs.readFileSync(target);
const isPE = cur[0] === 0x4d && cur[1] === 0x5a;
if (!isPE) {
  // Backup current (likely linux ELF) once
  if (!fs.existsSync(bak)) {
    fs.copyFileSync(target, bak);
    console.log('[prep-win-native] backed up linux .node ->', bak);
  }
}
fs.copyFileSync(winNode, target);
console.log('[prep-win-native] installed win32 better_sqlite3.node into server/');
