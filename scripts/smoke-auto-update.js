'use strict';

/**
 * Smoke: packaging config + mocked update feed check (no full Windows NSIS build required).
 *
 * Verifies:
 *  1) package.json build.publish / NSIS / auto-updater.js presence
 *  2) electron-updater loads
 *  3) checkForUpdates against a local mock generic feed does not crash
 *
 * Usage (from gilil-on-desktop):
 *   export PATH="/home/box/.local/node-v20.19.5-linux-x64/bin:$PATH"
 *   npm run smoke:update
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const reportPath = path.join(ROOT, 'tmp', 'smoke-auto-update-report.json');
const summaryPath = path.join(ROOT, 'tmp', 'smoke-auto-update-summary.json');

function fail(msg, extra) {
  const out = { ok: false, error: msg, ...(extra || {}) };
  fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
  fs.writeFileSync(summaryPath, JSON.stringify(out, null, 2));
  console.error('[smoke:update] FAIL:', msg);
  process.exit(1);
}

function ok(data) {
  const out = { ok: true, ...(data || {}) };
  fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
  fs.writeFileSync(summaryPath, JSON.stringify(out, null, 2));
  console.log('[smoke:update] OK');
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}

function validateConfig() {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const checks = [];

  const push = (name, pass, detail) => {
    checks.push({ name, pass: !!pass, detail: detail || null });
  };

  push('dependency.electron-updater', !!(pkg.dependencies && pkg.dependencies['electron-updater']));
  push('file.auto-updater.js', fs.existsSync(path.join(ROOT, 'auto-updater.js')));
  push('file.preload.js', fs.existsSync(path.join(ROOT, 'preload.js')));
  push('build.publish.github', Array.isArray(pkg.build && pkg.build.publish) && pkg.build.publish[0] && pkg.build.publish[0].provider === 'github');
  push(
    'build.publish.owner_repo',
    pkg.build &&
      pkg.build.publish &&
      pkg.build.publish[0] &&
      pkg.build.publish[0].owner === 'ruslan613' &&
      pkg.build.publish[0].repo === 'gilil-on-desktop'
  );
  push('repository.url', !!(pkg.repository && /ruslan613\/gilil-on-desktop/.test(pkg.repository.url || '')));

  const targets = (((pkg.build || {}).win || {}).target) || [];
  const hasNsis = targets.some((t) => (typeof t === 'string' ? t === 'nsis' : t && t.target === 'nsis'));
  push('win.target.nsis', hasNsis, targets);

  const files = (pkg.build && pkg.build.files) || [];
  push('build.files.auto-updater', files.includes('auto-updater.js'));

  const preload = fs.readFileSync(path.join(ROOT, 'preload.js'), 'utf8');
  push('preload.update-api', /getUpdateStatus/.test(preload) && /downloadUpdate/.test(preload) && /installUpdate/.test(preload));

  const main = fs.readFileSync(path.join(ROOT, 'main.js'), 'utf8');
  push('main.setupAutoUpdater', /setupAutoUpdater\(/.test(main));

  const shellJs = fs.readFileSync(path.join(ROOT, 'server/public/shell-v2.js'), 'utf8');
  push('shell.bindUpdateUi', /function bindUpdateUi\(/.test(shellJs));
  const shellHtml = fs.readFileSync(path.join(ROOT, 'server/public/shell-v2.html'), 'utf8');
  push('shell.update-banner', /id="update-banner"/.test(shellHtml));

  push('docs.AUTO-UPDATE', fs.existsSync(path.join(ROOT, 'docs/AUTO-UPDATE.md')));

  const failed = checks.filter((c) => !c.pass);
  return { checks, failed, pkgVersion: pkg.version, publish: pkg.build.publish };
}

function makeLatestYml(version) {
  // Dummy sha512 (64 bytes -> base64). checkForUpdates does not verify until download.
  const sha512 = crypto.createHash('sha512').update(`gilil-smoke-${version}`).digest('base64');
  const file = `GililOn-${version}-win-setup.exe`;
  return [
    `version: ${version}`,
    'files:',
    `  - url: ${file}`,
    `    sha512: ${sha512}`,
    '    size: 1024',
    `path: ${file}`,
    `sha512: ${sha512}`,
    `releaseDate: '${new Date().toISOString()}'`,
    '',
  ].join('\n');
}

function startMockFeed(version) {
  return new Promise((resolve, reject) => {
    const yml = makeLatestYml(version);
    const server = http.createServer((req, res) => {
      const url = (req.url || '/').split('?')[0];
      console.log('[mock-feed]', req.method, url);
      // Windows: latest.yml; Linux smoke host: latest-linux.yml; also latest-mac.yml
      if (
        url === '/latest.yml' ||
        url === '/latest-linux.yml' ||
        url === '/latest-mac.yml' ||
        url === '/latest-linux-x86_64.yml'
      ) {
        res.writeHead(200, { 'Content-Type': 'text/yaml; charset=utf-8' });
        res.end(yml);
        return;
      }
      if (url.endsWith('.exe')) {
        // Tiny placeholder body — download not required for this smoke
        res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
        res.end(Buffer.alloc(1024, 1));
        return;
      }
      res.writeHead(404);
      res.end('not found');
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        server,
        url: `http://127.0.0.1:${port}`,
        yml,
        version,
      });
    });
    server.on('error', reject);
  });
}

function runElectronSmoke(feedUrl) {
  return new Promise((resolve) => {
    const electronBin = require('electron');
    const entry = path.join(__dirname, 'smoke-update-main.js');
    const env = Object.assign({}, process.env, {
      GILIL_UPDATE_SMOKE: '1',
      GILIL_UPDATE_FORCE: '1',
      GILIL_UPDATE_FEED_URL: feedUrl,
      GILIL_UPDATE_CHECK_DELAY_MS: '200',
      GILIL_UPDATE_SMOKE_REPORT: reportPath,
      ELECTRON_DISABLE_SECURITY_WARNINGS: '1',
    });
    // Clear potentially confusing portable flag
    delete env.PORTABLE_EXECUTABLE_DIR;

    const args = [entry, '--no-sandbox', '--disable-gpu'];
    console.log('[smoke:update] spawning electron', electronBin, args.join(' '));
    const child = spawn(electronBin, args, {
      cwd: ROOT,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (b) => {
      const s = b.toString();
      stdout += s;
      process.stdout.write(s);
    });
    child.stderr.on('data', (b) => {
      const s = b.toString();
      stderr += s;
      process.stderr.write(s);
    });

    const killTimer = setTimeout(() => {
      try {
        child.kill('SIGKILL');
      } catch (_) {}
    }, 25000);

    child.on('close', (code) => {
      clearTimeout(killTimer);
      let report = null;
      try {
        if (fs.existsSync(reportPath)) {
          report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        }
      } catch (_) {}
      resolve({ code, stdout, stderr, report });
    });
  });
}

async function tryBuilderConfigValidate(pkg) {
  // Lightweight: ensure electron-builder can parse config (no full win build).
  try {
    const builder = require('electron-builder');
    // Just confirm module loads and publish config shape is accepted by our expectations
    return {
      ok: true,
      note: 'electron-builder module loaded; full --win nsis build skipped on Linux (needs Wine/NSIS). Use Windows CI or wine for real installer.',
      version: require('electron-builder/package.json').version,
      publish: pkg.build.publish,
      winTargets: pkg.build.win.target,
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function main() {
  console.log('[smoke:update] validating config…');
  const { checks, failed, pkgVersion, publish } = validateConfig();
  checks.forEach((c) => console.log(`  ${c.pass ? '✓' : '✗'} ${c.name}`, c.detail ? JSON.stringify(c.detail) : ''));
  if (failed.length) {
    fail('config validation failed', { failed, checks });
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const builderInfo = await tryBuilderConfigValidate(pkg);

  // Unpackaged Electron smoke reports Electron's own version (e.g. 33.x).
  // Use a clearly higher mock version so update-available fires on Linux hosts.
  const mockVersion = process.env.GILIL_SMOKE_MOCK_VERSION || '99.0.0';

  console.log('[smoke:update] starting mock feed for version', mockVersion);
  const mock = await startMockFeed(mockVersion);

  try {
    const result = await runElectronSmoke(mock.url);
    const steps = (result.report && result.report.steps) || [];
    const hasAvailable = steps.some((s) => s.name === 'update-available');
    const hasResolved = steps.some((s) => s.name === 'checkForUpdates-resolved');
    const threwHard = steps.some((s) => s.name === 'checkForUpdates-threw') && !hasAvailable && !hasResolved;
    const pass = hasAvailable || (hasResolved && result.code === 0) || (result.report && result.report.ok && hasAvailable);
    if (!hasAvailable) {
      console.warn('[smoke:update] note: update-available not seen; steps=', steps.map((s) => s.name).join(','));
    }

    if (!pass || threwHard || !hasAvailable) {
      fail('electron update check smoke failed (expected update-available from mock feed)', {
        code: result.code,
        hasAvailable,
        hasResolved,
        threwHard,
        report: result.report,
        builderInfo,
        checks,
      });
    }

    ok({
      pkgVersion,
      mockVersion,
      feedUrl: mock.url,
      publish,
      builderInfo,
      electronExitCode: result.code,
      report: result.report,
      checks,
      winBuildNote:
        'Full Windows NSIS build was NOT run on this Linux box. Config targets nsis+portable; run `npm run dist:nsis` on Windows (or Wine) to produce GililOn-*-win-setup.exe + latest.yml for GitHub Releases.',
    });
  } finally {
    try {
      mock.server.close();
    } catch (_) {}
  }
}

main().catch((err) => fail(err.message || String(err)));
