'use strict';

/**
 * Preload bridge for Gilil On desktop.
 * contextIsolation: true, nodeIntegration: false.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('gililDesktop', {
  platform: process.platform,
  isDesktop: true,

  /** Show OS toast when window unfocused/minimized (main decides). */
  notify(payload) {
    try {
      ipcRenderer.send('gilil:notify', payload || {});
    } catch (_) {}
  },

  setTrayBadge(count) {
    try {
      ipcRenderer.send('gilil:tray-badge', Number(count) || 0);
    } catch (_) {}
  },

  setNotifSound(on) {
    try {
      ipcRenderer.send('gilil:notif-sound', !!on);
    } catch (_) {}
  },

  /** Persist splash theme (dark|bitrix|cyan) for next Electron cold start. */
  setTheme(id) {
    try {
      ipcRenderer.send('gilil:set-theme', id);
    } catch (_) {}
  },

  onNavigate(cb) {
    if (typeof cb !== 'function') return;
    ipcRenderer.on('gilil:navigate', (_e, payload) => {
      try {
        cb(payload);
      } catch (_) {}
    });
  },

  onMarkAllRead(cb) {
    if (typeof cb !== 'function') return;
    ipcRenderer.on('gilil:mark-all-read', () => {
      try {
        cb();
      } catch (_) {}
    });
  },

  onToggleSound(cb) {
    if (typeof cb !== 'function') return;
    ipcRenderer.on('gilil:toggle-sound', () => {
      try {
        cb();
      } catch (_) {}
    });
  },

  /** Open packaged / nearby user manual (Word/PDF). Returns {ok, path?, error?}. */
  openManual() {
    try {
      return ipcRenderer.invoke('gilil:open-manual');
    } catch (_) {
      return Promise.resolve({ ok: false, error: 'ipc_unavailable' });
    }
  },

  /* ——— Auto-update (electron-updater) ——— */

  getUpdateStatus() {
    try {
      return ipcRenderer.invoke('gilil:update-get-status');
    } catch (_) {
      return Promise.resolve({ enabled: false, status: 'skipped' });
    }
  },

  checkForUpdates() {
    try {
      return ipcRenderer.invoke('gilil:update-check');
    } catch (_) {
      return Promise.resolve({ ok: false, error: 'ipc_unavailable' });
    }
  },

  downloadUpdate() {
    try {
      return ipcRenderer.invoke('gilil:update-download');
    } catch (_) {
      return Promise.resolve({ ok: false, error: 'ipc_unavailable' });
    }
  },

  installUpdate() {
    try {
      return ipcRenderer.invoke('gilil:update-install');
    } catch (_) {
      return Promise.resolve({ ok: false, error: 'ipc_unavailable' });
    }
  },

  onUpdateStatus(cb) {
    if (typeof cb !== 'function') return;
    ipcRenderer.on('gilil:update-status', (_e, payload) => {
      try {
        cb(payload);
      } catch (_) {}
    });
  },
});
