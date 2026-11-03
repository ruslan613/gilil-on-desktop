'use strict';

/**
 * Gilil On — quiet auto-update via electron-updater (NSIS / GitHub Releases).
 * Portable builds skip auto-install (no installer). Dev skips unless GILIL_UPDATE_FORCE=1
 * or GILIL_UPDATE_FEED_URL is set (smoke / mock feed).
 */

const { app, ipcMain, Notification } = require('electron');
const path = require('path');
const fs = require('fs');

/** @type {import('electron-updater').AppUpdater | null} */
let updater = null;

const state = {
  status: 'idle', // idle|checking|available|not-available|downloading|downloaded|error|skipped
  version: null,
  currentVersion: null,
  progress: null, // { percent, transferred, total, bytesPerSecond }
  error: null,
  enabled: false,
  reason: null,
};

let hooks = {
  sendToRenderer: () => {},
  rebuildTrayMenu: () => {},
  focusMainWindow: () => {},
  windowIsQuiet: () => false,
};

function isPortableBuild() {
  return !!process.env.PORTABLE_EXECUTABLE_DIR;
}

function loadUpdater() {
  if (updater) return updater;
  try {
    // eslint-disable-next-line global-require
    updater = require('electron-updater').autoUpdater;
    return updater;
  } catch (err) {
    console.warn('[gilil-update] electron-updater load failed:', err && err.message);
    return null;
  }
}

function snapshot() {
  return {
    status: state.status,
    version: state.version,
    currentVersion: state.currentVersion || app.getVersion(),
    progress: state.progress
      ? {
          percent: Number(state.progress.percent) || 0,
          transferred: Number(state.progress.transferred) || 0,
          total: Number(state.progress.total) || 0,
          bytesPerSecond: Number(state.progress.bytesPerSecond) || 0,
        }
      : null,
    error: state.error,
    enabled: state.enabled,
    reason: state.reason,
  };
}

function broadcast() {
  try {
    hooks.sendToRenderer('gilil:update-status', snapshot());
  } catch (_) {}
  try {
    hooks.rebuildTrayMenu();
  } catch (_) {}
}

function toastUpdateAvailable(version) {
  try {
    if (!Notification.isSupported()) return;
    // Quiet OS toast only when window is in background
    if (!hooks.windowIsQuiet()) return;
    const n = new Notification({
      title: 'Gilil On',
      body: version
        ? `Обновление доступно · v${version}`
        : 'Обновление доступно',
      silent: true,
    });
    n.on('click', () => {
      try {
        hooks.focusMainWindow();
      } catch (_) {}
    });
    n.show();
  } catch (err) {
    console.warn('[gilil-update] toast failed:', err && err.message);
  }
}

async function quietCheck() {
  if (!state.enabled || !updater) return snapshot();
  try {
    state.status = 'checking';
    state.error = null;
    broadcast();
    const result = await updater.checkForUpdates();
    return { ok: true, result: result && result.updateInfo ? result.updateInfo.version : null, state: snapshot() };
  } catch (err) {
    // Network / 404 / missing release: do not crash the app
    const msg = (err && err.message) || String(err);
    console.warn('[gilil-update] check failed (non-fatal):', msg);
    state.status = 'error';
    state.error = msg;
    broadcast();
    return { ok: false, error: msg, state: snapshot() };
  }
}

async function startDownload() {
  if (!state.enabled || !updater) {
    return { ok: false, error: 'updater_disabled', state: snapshot() };
  }
  try {
    state.status = 'downloading';
    state.progress = { percent: 0, transferred: 0, total: 0, bytesPerSecond: 0 };
    state.error = null;
    broadcast();
    await updater.downloadUpdate();
    return { ok: true, state: snapshot() };
  } catch (err) {
    const msg = (err && err.message) || String(err);
    console.warn('[gilil-update] download failed:', msg);
    state.status = 'error';
    state.error = msg;
    broadcast();
    return { ok: false, error: msg, state: snapshot() };
  }
}

function quitAndInstall() {
  if (!state.enabled || !updater) {
    return { ok: false, error: 'updater_disabled', state: snapshot() };
  }
  if (state.status !== 'downloaded') {
    return { ok: false, error: 'not_downloaded', state: snapshot() };
  }
  try {
    // isSilent=false, isForceRunAfter=true → relaunch with new code
    setImmediate(() => {
      try {
        updater.quitAndInstall(false, true);
      } catch (err) {
        console.error('[gilil-update] quitAndInstall failed:', err && err.message);
      }
    });
    return { ok: true, state: snapshot() };
  } catch (err) {
    const msg = (err && err.message) || String(err);
    state.status = 'error';
    state.error = msg;
    broadcast();
    return { ok: false, error: msg, state: snapshot() };
  }
}

/**
 * Wire updater into main process. Safe to call once after app ready.
 * @param {object} opts
 */
function setupAutoUpdater(opts) {
  hooks = Object.assign(hooks, opts || {});
  state.currentVersion = app.getVersion();

  const force =
    process.env.GILIL_UPDATE_FORCE === '1' ||
    !!process.env.GILIL_UPDATE_FEED_URL ||
    process.env.GILIL_UPDATE_SMOKE === '1';

  if (!app.isPackaged && !force) {
    state.enabled = false;
    state.status = 'skipped';
    state.reason = 'dev_unpackaged';
    console.log('[gilil-update] skipped (dev). Set GILIL_UPDATE_FORCE=1 or GILIL_UPDATE_FEED_URL to test.');
    wireIpc();
    broadcast();
    return snapshot();
  }

  if (isPortableBuild() && !force) {
    state.enabled = false;
    state.status = 'skipped';
    state.reason = 'portable';
    console.log(
      '[gilil-update] skipped (portable). Auto-update works with NSIS installer builds (npm run dist:nsis).'
    );
    wireIpc();
    broadcast();
    return snapshot();
  }

  const u = loadUpdater();
  if (!u) {
    state.enabled = false;
    state.status = 'skipped';
    state.reason = 'module_missing';
    wireIpc();
    broadcast();
    return snapshot();
  }

  state.enabled = true;
  state.reason = null;
  u.autoDownload = false;
  u.autoInstallOnAppQuit = true;

  if (!app.isPackaged) {
    // Allow check against mock / custom feed in smoke & local tests
    u.forceDevUpdateConfig = true;
  }

  const feedUrl = process.env.GILIL_UPDATE_FEED_URL;
  if (feedUrl) {
    try {
      u.setFeedURL({ provider: 'generic', url: feedUrl.replace(/\/$/, '') });
      console.log('[gilil-update] feed URL override:', feedUrl);
    } catch (err) {
      console.warn('[gilil-update] setFeedURL failed:', err && err.message);
    }
  }

  // Optional path to a local app-update.yml for smoke (generic provider still preferred)
  const smokeYml = process.env.GILIL_UPDATE_DEV_YML;
  if (smokeYml && fs.existsSync(smokeYml)) {
    try {
      // electron-updater reads this when forceDevUpdateConfig is true
      const dest = path.join(path.dirname(app.getAppPath()), 'dev-app-update.yml');
      // Prefer copying into project root if packaged path unavailable
      const candidates = [
        path.join(process.cwd(), 'dev-app-update.yml'),
        path.join(__dirname, 'dev-app-update.yml'),
      ];
      for (const c of candidates) {
        try {
          fs.copyFileSync(smokeYml, c);
        } catch (_) {}
      }
      void dest;
    } catch (err) {
      console.warn('[gilil-update] smoke yml copy failed:', err && err.message);
    }
  }

  u.on('checking-for-update', () => {
    state.status = 'checking';
    state.error = null;
    broadcast();
  });

  u.on('update-available', (info) => {
    state.status = 'available';
    state.version = (info && info.version) || null;
    state.error = null;
    broadcast();
    toastUpdateAvailable(state.version);
  });

  u.on('update-not-available', () => {
    state.status = 'not-available';
    state.version = null;
    state.progress = null;
    broadcast();
  });

  u.on('download-progress', (p) => {
    state.status = 'downloading';
    state.progress = p || null;
    broadcast();
  });

  u.on('update-downloaded', (info) => {
    state.status = 'downloaded';
    state.version = (info && info.version) || state.version;
    state.progress = state.progress
      ? Object.assign({}, state.progress, { percent: 100 })
      : { percent: 100, transferred: 0, total: 0, bytesPerSecond: 0 };
    state.error = null;
    broadcast();
  });

  u.on('error', (err) => {
    const msg = (err && err.message) || String(err);
    console.warn('[gilil-update] error event (non-fatal):', msg);
    state.status = 'error';
    state.error = msg;
    broadcast();
  });

  wireIpc();

  const delayMs = Number(process.env.GILIL_UPDATE_CHECK_DELAY_MS) || 4000;
  setTimeout(() => {
    quietCheck().catch(() => {});
  }, delayMs);

  return snapshot();
}

let ipcWired = false;
function wireIpc() {
  if (ipcWired) return;
  ipcWired = true;

  ipcMain.handle('gilil:update-get-status', () => snapshot());
  ipcMain.handle('gilil:update-check', async () => quietCheck());
  ipcMain.handle('gilil:update-download', async () => startDownload());
  ipcMain.handle('gilil:update-install', async () => quitAndInstall());
}

function getUpdateState() {
  return snapshot();
}

/** Labels for tray menu (Russian). */
function trayUpdateMenuItems() {
  const items = [];
  if (!state.enabled) return items;
  if (state.status === 'available') {
    items.push({
      id: 'update-available',
      label: state.version
        ? `Обновление доступно · v${state.version}`
        : 'Обновление доступно',
      action: 'focus',
    });
    items.push({
      id: 'update-download',
      label: 'Загрузить обновление',
      action: 'download',
    });
  } else if (state.status === 'downloading') {
    const pct = state.progress ? Math.round(Number(state.progress.percent) || 0) : 0;
    items.push({
      id: 'update-progress',
      label: `Загрузка обновления… ${pct}%`,
      action: 'focus',
      enabled: false,
    });
  } else if (state.status === 'downloaded') {
    items.push({
      id: 'update-install',
      label: 'Установить и перезапустить',
      action: 'install',
    });
  }
  return items;
}

module.exports = {
  setupAutoUpdater,
  getUpdateState,
  trayUpdateMenuItems,
  quietCheck,
  startDownload,
  quitAndInstall,
};
