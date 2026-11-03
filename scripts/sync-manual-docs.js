'use strict';

/**
 * Copy user-manual Word/PDF from project root into docs/ before electron-builder.
 * Patterns: *инструкц*, *kak-polzovatsya*, *howto*, GililOn-kak*.docx/.pdf
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const docsDir = path.join(root, 'docs');

function isManualFilename(name) {
  if (!name || typeof name !== 'string') return false;
  if (!/\.(docx|pdf)$/i.test(name)) return false;
  const n = name.toLowerCase();
  if (/инструкц/i.test(name)) return true;
  if (n.includes('kak-polzovatsya')) return true;
  if (n.includes('howto')) return true;
  if (/^gililon-kak/i.test(n)) return true;
  if (n.includes('user-manual') || n.includes('user_manual')) return true;
  return false;
}

function ensureDocsDir() {
  fs.mkdirSync(docsDir, { recursive: true });
}

function listCandidates() {
  const hits = [];
  let entries = [];
  try {
    entries = fs.readdirSync(root);
  } catch (e) {
    console.warn('[sync-manual] readdir failed:', e.message);
    return hits;
  }
  for (const name of entries) {
    if (!isManualFilename(name)) continue;
    const p = path.join(root, name);
    try {
      if (fs.statSync(p).isFile()) hits.push(p);
    } catch (_) {}
  }
  // Prefer pdf (opens reliably), then newer
  hits.sort((a, b) => {
    const extA = path.extname(a).toLowerCase();
    const extB = path.extname(b).toLowerCase();
    if (extA === '.pdf' && extB !== '.pdf') return -1;
    if (extB === '.pdf' && extA !== '.pdf') return 1;
    try {
      return fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs;
    } catch (_) {
      return 0;
    }
  });
  return hits;
}

function clearOldManuals() {
  let entries = [];
  try {
    entries = fs.readdirSync(docsDir);
  } catch (_) {
    return;
  }
  for (const name of entries) {
    if (!/\.(docx|pdf)$/i.test(name)) continue;
    try {
      fs.unlinkSync(path.join(docsDir, name));
    } catch (_) {}
  }
}

function main() {
  ensureDocsDir();
  const hits = listCandidates();
  if (!hits.length) {
    console.log('[sync-manual] no manual .docx/.pdf in project root yet — packaging empty docs/');
    return;
  }
  clearOldManuals();
  for (const src of hits) {
    const base = path.basename(src);
    const dest = path.join(docsDir, base);
    fs.copyFileSync(src, dest);
    console.log('[sync-manual] copied', base, '-> docs/' + base);
  }
}


main();
