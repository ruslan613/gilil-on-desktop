#!/usr/bin/env node
/**
 * Thin wrapper — same CLI as compose-icon-photo.py
 * Usage: node scripts/compose-icon-photo.js --photo ./me.jpg
 */
const { spawnSync } = require('child_process');
const path = require('path');
const py = path.join(__dirname, 'compose-icon-photo.py');
const r = spawnSync('python3', [py, ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(r.status == null ? 1 : r.status);
