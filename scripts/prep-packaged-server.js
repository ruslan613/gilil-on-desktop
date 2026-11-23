'use strict';
/**
 * Prepare server/ so electron-builder extraResources can boot under resources/server.
 *
 * The Windows release job only has what git contains. server/node_modules and
 * server/.env are gitignored, and the Stage 2 process exits immediately without
 * them (cannot resolve express/better-sqlite3, then JWT_SECRET / MESSAGE_KEY).
 *
 * This script does not install npm packages — run `npm ci` in server/ first.
 * It refuses to overwrite an existing server/.env. When that file is missing it
 * copies server/.env.example (documented local desktop defaults, not production
 * secrets).
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const serverDir = path.join(root, 'server');
const envPath = path.join(serverDir, '.env');
const examplePath = path.join(serverDir, '.env.example');
const expressPkg = path.join(serverDir, 'node_modules', 'express', 'package.json');
const dotenvPkg = path.join(serverDir, 'node_modules', 'dotenv', 'package.json');
const sqliteNode = path.join(
  serverDir,
  'node_modules',
  'better-sqlite3',
  'build',
  'Release',
  'better_sqlite3.node'
);

function fail(msg) {
  console.error('[prep-packaged-server]', msg);
  process.exit(1);
}

if (!fs.existsSync(expressPkg) || !fs.existsSync(dotenvPkg)) {
  fail(
    'server dependencies are not installed (missing express/dotenv). Run: npm ci --prefix server'
  );
}
if (!fs.existsSync(sqliteNode)) {
  fail(
    'better-sqlite3 native binding is missing at ' +
      sqliteNode +
      '. Run: npm ci --prefix server'
  );
}

if (!fs.existsSync(examplePath)) {
  fail('server/.env.example is missing');
}

if (!fs.existsSync(envPath)) {
  fs.copyFileSync(examplePath, envPath);
  console.log(
    '[prep-packaged-server] wrote server/.env from .env.example (desktop defaults, not production secrets)'
  );
} else {
  console.log('[prep-packaged-server] keeping existing server/.env');
}

const text = fs.readFileSync(envPath, 'utf8');
for (const key of ['PORT', 'JWT_SECRET', 'MESSAGE_KEY']) {
  const re = new RegExp('^\\s*(?:export\\s+)?' + key + '\\s*=\\s*\\S+', 'm');
  if (!re.test(text)) {
    fail(key + ' is missing or empty in server/.env — embedded server will exit on startup');
  }
}

console.log('[prep-packaged-server] server tree ready for extraResources (node_modules + .env)');
