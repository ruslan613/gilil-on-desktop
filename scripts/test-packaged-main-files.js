'use strict';

/**
 * build.files is the allowlist electron-builder copies into app.asar.
 * A relative require that is not on that list crashes the packaged main
 * process (Cannot find module) before the embedded server listens.
 *
 * Walks main.js and every local file it requires, including auto-updater.js.
 */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
let failed = 0;

function check(name, cond) {
  if (cond) console.log('PASS', name);
  else {
    failed += 1;
    console.error('FAIL', name);
  }
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

/** Same include/exclude split electron-builder applies to build.files. */
function coveredByFiles(rel, patterns) {
  const file = rel.split(path.sep).join('/');
  const includes = [];
  const excludes = [];
  for (const pattern of patterns) {
    const text = String(pattern).split('\\').join('/');
    if (text.startsWith('!')) excludes.push(text.slice(1));
    else includes.push(text);
  }
  const matched = includes.some((pattern) => globMatch(pattern, file));
  const excluded = excludes.some((pattern) => globMatch(pattern, file));
  return matched && !excluded;
}

function globMatch(pattern, file) {
  let re = '^';
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === '*' && pattern[i + 1] === '*') {
      if (pattern[i + 2] === '/') {
        re += '(?:.*/)?';
        i += 2;
      } else {
        re += '.*';
        i += 1;
      }
      continue;
    }
    if (ch === '*') {
      re += '[^/]*';
      continue;
    }
    if (ch === '?') {
      re += '[^/]';
      continue;
    }
    if ('.+^${}()|[]\\'.includes(ch)) re += '\\';
    re += ch;
  }
  return new RegExp(re + '$').test(file);
}

function resolveLocal(fromFile, spec) {
  const base = path.resolve(path.dirname(fromFile), spec);
  const candidates = [base, base + '.js', base + '.json', path.join(base, 'index.js')];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function relativeRequires(source) {
  const specs = [];
  const opaque = [];
  source.split(/\n/).forEach((line, index) => {
    const code = line;
    const literal = /require\s*\(\s*(['"])(\.[^'"]*)\1\s*\)/g;
    let match;
    while ((match = literal.exec(code))) specs.push({ spec: match[2], line: index + 1 });
    const call = /require\s*\(\s*([^)]*)\)/.exec(code);
    if (call && !/^\s*['"]/.test(call[1])) opaque.push({ expr: call[1].trim(), line: index + 1 });
  });
  return { specs, opaque };
}

function walk(file, seen) {
  const rel = path.relative(root, file).split(path.sep).join('/');
  if (seen.has(rel)) return;
  seen.add(rel);
  const parsed = relativeRequires(fs.readFileSync(file, 'utf8'));
  for (const item of parsed.opaque) {
    check(rel + ':' + item.line + ' require is a string literal (' + item.expr + ')', false);
  }
  for (const item of parsed.specs) {
    const resolved = resolveLocal(file, item.spec);
    check(rel + ':' + item.line + ' resolves ' + item.spec, !!resolved && resolved.startsWith(root + path.sep));
    if (resolved) walk(resolved, seen);
  }
}

check('exact file pattern matches only that file', globMatch('update-schedule.js', 'update-schedule.js') && !globMatch('auto-updater.js', 'update-schedule.js'));
check('a single star does not cross a directory', globMatch('*.js', 'main.js') && !globMatch('*.js', 'scripts/main.js'));
check('a double star crosses directories', globMatch('**/*.js', 'scripts/main.js') && globMatch('**/*.js', 'main.js'));

const pkg = readJson('package.json');
const patterns = (pkg.build && pkg.build.files) || [];
check('build.files is an allowlist', Array.isArray(patterns) && patterns.length > 0);
check('uninstall does not delete AppData', pkg.build && pkg.build.nsis && pkg.build.nsis.deleteAppDataOnUninstall === false);

const required = new Set();
walk(path.join(root, 'main.js'), required);

const missing = [];
for (const rel of required) {
  const ok = coveredByFiles(rel, patterns);
  check(rel + ' is in build.files', ok);
  if (!ok) missing.push(rel);
}

check('main.js requires auto-updater.js', required.has('auto-updater.js'));
check('auto-updater.js requires update-schedule.js', required.has('update-schedule.js'));
check('main.js requires window-chrome.js', required.has('window-chrome.js'));

const withoutSchedule = patterns.filter((p) => p !== 'update-schedule.js' && p !== 'window-chrome.js');
check('omitting update-schedule.js fails this check', !coveredByFiles('update-schedule.js', withoutSchedule));
check('omitting window-chrome.js fails this check', !coveredByFiles('window-chrome.js', withoutSchedule));

if (missing.length) {
  console.error('Missing from build.files:', missing.join(', '));
}

if (failed) {
  console.error(failed + ' failed');
  process.exit(1);
}
console.log('OK packaged main-process files');
