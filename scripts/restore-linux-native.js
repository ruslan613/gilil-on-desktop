'use strict';
/** After Windows dist: restore linux better-sqlite3 .node if backup exists. */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
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

if (fs.existsSync(bak)) {
  fs.copyFileSync(bak, target);
  console.log('[restore-linux-native] restored linux better_sqlite3.node');
} else {
  console.log('[restore-linux-native] no linux backup; leave as-is');
}
