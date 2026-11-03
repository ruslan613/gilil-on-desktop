'use strict';

/**
 * Minimal Electron entry for auto-update smoke (no server / UI).
 * Env:
 *   GILIL_UPDATE_FEED_URL — generic provider base URL (mock HTTP)
 *   GILIL_UPDATE_SMOKE=1
 *   GILIL_UPDATE_CHECK_DELAY_MS=500
 */
const { app } = require('electron');
const path = require('path');
const fs = require('fs');

const reportPath =
  process.env.GILIL_UPDATE_SMOKE_REPORT ||
  path.join(__dirname, '..', 'tmp', 'smoke-auto-update-report.json');

const report = {
  ok: false,
  steps: [],
  error: null,
  updateInfo: null,
  startedAt: new Date().toISOString(),
};

function step(name, data) {
  report.steps.push({ name, at: new Date().toISOString(), ...(data || {}) });
  console.log('[smoke-update]', name, data ? JSON.stringify(data) : '');
}

function finish(ok, error) {
  report.ok = !!ok;
  report.error = error || null;
  report.finishedAt = new Date().toISOString();
  try {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  } catch (e) {
    console.error('[smoke-update] report write failed:', e.message);
  }
  // Exit codes: 0 = check did not throw (even if no update / expected 404 handled)
  setTimeout(() => {
    app.exit(ok ? 0 : 1);
  }, 200);
}

app.whenReady().then(async () => {
  step('ready', {
    version: app.getVersion(),
    packaged: app.isPackaged,
    feed: process.env.GILIL_UPDATE_FEED_URL || null,
  });

  let autoUpdater;
  try {
    autoUpdater = require('electron-updater').autoUpdater;
    step('electron-updater-loaded', { version: require('electron-updater/package.json').version });
  } catch (err) {
    step('electron-updater-load-failed', { error: err.message });
    finish(false, err.message);
    return;
  }

  autoUpdater.autoDownload = false;
  autoUpdater.forceDevUpdateConfig = true;
  autoUpdater.logger = {
    info: (...a) => console.log('[updater]', ...a),
    warn: (...a) => console.warn('[updater]', ...a),
    error: (...a) => console.error('[updater]', ...a),
    debug: () => {},
  };

  const feed = process.env.GILIL_UPDATE_FEED_URL;
  if (!feed) {
    finish(false, 'GILIL_UPDATE_FEED_URL missing');
    return;
  }

  try {
    autoUpdater.setFeedURL({ provider: 'generic', url: feed.replace(/\/$/, '') });
    step('setFeedURL', { url: feed });
  } catch (err) {
    step('setFeedURL-failed', { error: err.message });
    finish(false, err.message);
    return;
  }

  let settled = false;
  const timer = setTimeout(() => {
    if (settled) return;
    settled = true;
    step('timeout');
    finish(false, 'timeout_waiting_for_update-available');
  }, 15000);

  autoUpdater.on('error', (err) => {
    step('event-error', { error: (err && err.message) || String(err) });
    // For smoke: error event after a thrown-less check is acceptable if we already called check
  });

  autoUpdater.on('update-available', (info) => {
    step('update-available', { version: info && info.version });
    report.updateInfo = { version: info && info.version, files: info && info.files };
    if (!settled) {
      settled = true;
      clearTimeout(timer);
      finish(true, null);
    }
  });

  autoUpdater.on('update-not-available', (info) => {
    step('update-not-available', { version: info && info.version });
    if (!settled) {
      settled = true;
      clearTimeout(timer);
      finish(true, null);
    }
  });

  try {
    step('checkForUpdates-call');
    const result = await autoUpdater.checkForUpdates();
    step('checkForUpdates-resolved', {
      version: result && result.updateInfo && result.updateInfo.version,
      hasDownloadPromise: !!(result && result.downloadPromise),
    });
    report.updateInfo = report.updateInfo || {
      version: result && result.updateInfo && result.updateInfo.version,
    };
    // Promise resolved without throw — success even if events race
    if (!settled) {
      settled = true;
      clearTimeout(timer);
      finish(true, null);
    }
  } catch (err) {
    step('checkForUpdates-threw', { error: err.message });
    const msg = (err && err.message) || String(err);
    // Do not finish yet — update-available/error events may still race; timer handles timeout.
    // If nothing settles, timeout marks failure unless we later get update-available.
    if (!settled) {
      // brief grace for event handlers
      setTimeout(() => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          finish(false, msg);
        }
      }, 1500);
    }
  }
});

app.on('window-all-closed', (e) => {
  // no windows
});
