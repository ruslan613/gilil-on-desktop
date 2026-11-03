'use strict';

const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  Notification,
  nativeImage,
  ipcMain,
  session,
  shell,
  dialog,
  screen,
} = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

const {
  setupAutoUpdater,
  getUpdateState,
  trayUpdateMenuItems,
  startDownload: updateStartDownload,
  quitAndInstall: updateQuitAndInstall,
} = require('./auto-updater');

const DEFAULT_PORT = 8788;
const UI_PATH = '/shell-v2.html';
const APP_VERSION = '1.1.2';

const DEFAULT_ALLOW_HOSTS = [
  '127.0.0.1',
  'localhost',
  '::1',
  'registry.npmjs.org',
  'github.com',
  'objects.githubusercontent.com',
  'release-assets.githubusercontent.com',
  'cdn.npmmirror.com',
];

function dataDirPath() {
  return path.join(app.getPath('userData'), 'gilil-on-data');
}

function ensureDataDir() {
  const dir = dataDirPath();
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (_) {}
  return dir;
}

function securityLog(line) {
  const ts = new Date().toISOString();
  const msg = `[${ts}] ${line}`;
  console.log(`[gilil-security] ${msg}`);
  try {
    const dir = ensureDataDir();
    fs.appendFileSync(path.join(dir, 'security.log'), msg + '\n', 'utf8');
  } catch (e) {
    console.warn('[gilil-security] log write failed:', e.message);
  }
}

/**
 * Windows Authenticode check via PowerShell Get-AuthenticodeSignature.
 * Non-Windows: skip (Linux build / macOS). Not a hard block — confirm only.
 */
function checkAuthenticodeSignature() {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      securityLog(
        `signature_check_skipped_platform platform=${process.platform} path=${process.execPath}`
      );
      resolve({ skipped: true, status: 'SkippedPlatform' });
      return;
    }

    const exePath = process.execPath;
    const ps = `(Get-AuthenticodeSignature -FilePath '${String(exePath).replace(/'/g, "''")}').Status`;
    const child = spawn(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', ps],
      { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }
    );

    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      try {
        child.kill();
      } catch (_) {}
    }, 15000);

    child.stdout.on('data', (b) => {
      stdout += b.toString();
    });
    child.stderr.on('data', (b) => {
      stderr += b.toString();
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      securityLog(
        `signature_check_error path=${exePath} error=${err.message}`
      );
      resolve({ skipped: false, status: 'UnknownError', error: err.message, path: exePath });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      const status = String(stdout || '')
        .trim()
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean)
        .pop() || 'UnknownError';
      securityLog(
        `signature_check status=${status} path=${exePath} code=${code} stderr=${(stderr || '').trim().slice(0, 200)}`
      );
      resolve({ skipped: false, status, path: exePath, code });
    });
  });
}

async function confirmIfSignatureInvalid(result) {
  if (!result || result.skipped) return true;
  const status = String(result.status || '');
  if (status === 'Valid') {
    securityLog(`signature_ok status=Valid path=${result.path}`);
    return true;
  }
  // NotSigned / HashMismatch / NotTrusted / UnknownError / …
  const { response } = await dialog.showMessageBox({
    type: 'warning',
    buttons: ['Продолжить', 'Выход'],
    defaultId: 1,
    cancelId: 1,
    title: 'Gilil On — проверка подписи',
    message: 'Цифровая подпись отсутствует или невалидна',
    detail:
      `Файл: ${result.path || process.execPath}\n` +
      `Статус Authenticode: ${status}\n\n` +
      'Это может означать подмену или повреждение файла. ' +
      'Продолжайте только если вы доверяете источнику копии.\n\n' +
      'Рекомендуется скачать официальную сборку с подписью.',
    noLink: true,
  });
  const cont = response === 0;
  securityLog(
    `signature_user_choice continue=${cont} status=${status} path=${result.path || process.execPath}`
  );
  return cont;
}

function loadDomainWhitelist() {
  const bundled = path.join(__dirname, 'security-domains.json');
  let cfg = {
    allowHosts: DEFAULT_ALLOW_HOSTS.slice(),
    allowIpLiteralsLoopbackOnly: true,
  };
  try {
    if (fs.existsSync(bundled)) {
      const j = JSON.parse(fs.readFileSync(bundled, 'utf8'));
      if (j && Array.isArray(j.allowHosts) && j.allowHosts.length) {
        cfg.allowHosts = j.allowHosts.map((h) => String(h).toLowerCase());
      }
      if (typeof j.allowIpLiteralsLoopbackOnly === 'boolean') {
        cfg.allowIpLiteralsLoopbackOnly = j.allowIpLiteralsLoopbackOnly;
      }
      securityLog(`whitelist_loaded_bundled path=${bundled} hosts=${cfg.allowHosts.length}`);
    }
  } catch (e) {
    securityLog(`whitelist_bundled_error error=${e.message}`);
  }

  try {
    const override = path.join(dataDirPath(), 'security-domains.json');
    if (fs.existsSync(override)) {
      const j = JSON.parse(fs.readFileSync(override, 'utf8'));
      if (j && Array.isArray(j.allowHosts) && j.allowHosts.length) {
        cfg.allowHosts = j.allowHosts.map((h) => String(h).toLowerCase());
        securityLog(`whitelist_loaded_override path=${override} hosts=${cfg.allowHosts.length}`);
      }
      if (typeof j.allowIpLiteralsLoopbackOnly === 'boolean') {
        cfg.allowIpLiteralsLoopbackOnly = j.allowIpLiteralsLoopbackOnly;
      }
    }
  } catch (e) {
    securityLog(`whitelist_override_error error=${e.message}`);
  }

  cfg.allowSet = new Set(cfg.allowHosts.map((h) => h.toLowerCase()));
  return cfg;
}

function isLoopbackHost(hostname) {
  const h = String(hostname || '').toLowerCase().replace(/^\[|\]$/g, '');
  if (h === '127.0.0.1' || h === 'localhost' || h === '::1') return true;
  // 127.0.0.0/8
  if (/^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  return false;
}

function isIpLiteral(hostname) {
  const h = String(hostname || '').replace(/^\[|\]$/g, '');
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return true;
  if (h.includes(':')) return true; // rough IPv6
  return false;
}

function hostAllowed(hostname, cfg) {
  const raw = String(hostname || '').toLowerCase();
  const h = raw.replace(/^\[|\]$/g, '');
  if (!h) return false;
  if (cfg.allowSet.has(h) || cfg.allowSet.has(raw)) return true;
  if (isLoopbackHost(h)) return true;
  if (cfg.allowIpLiteralsLoopbackOnly && isIpLiteral(h)) {
    return isLoopbackHost(h);
  }
  return false;
}

function setupDomainWhitelist() {
  const cfg = loadDomainWhitelist();
  const ses = session.defaultSession;
  const filter = { urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*'] };

  ses.webRequest.onBeforeRequest(filter, (details, callback) => {
    let allowed = false;
    let host = '';
    try {
      const u = new URL(details.url);
      host = u.hostname;
      allowed = hostAllowed(host, cfg);
    } catch (_) {
      allowed = false;
    }
    if (!allowed) {
      securityLog(`request_blocked url=${details.url} host=${host}`);
      callback({ cancel: true });
      return;
    }
    callback({});
  });

  securityLog(
    `whitelist_active hosts=${[...cfg.allowSet].join(',')} loopbackIpOnly=${cfg.allowIpLiteralsLoopbackOnly}`
  );
}

let mainWindow = null;
let splashWindow = null;
let serverProcess = null;
let quitting = false;
let tray = null;
let unreadBadge = 0;
let notifSoundOn = true;
let splashShownAt = 0;

/** Splash theme map: only dark | bitrix | cyan */
const SPLASH_THEMES = new Set(['dark', 'bitrix', 'cyan']);
const SPLASH_BG = {
  dark: '#0c0a08',
  bitrix: '#F8FAFB',
  cyan: '#0F172A',
};
const SPLASH_MIN_MS = 1400;

function resolveServerRoot() {
  // Packaged: resources/server
  // Dev: __dirname/server
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'server');
  }
  return path.join(__dirname, 'server');
}

/**
 * User manual (Word/PDF). Packaged: resources/docs or next to exe.
 * Dev: project root / docs/. Searches by name patterns when exact file missing.
 */
function manualSearchDirs() {
  const dirs = [];
  if (app.isPackaged) {
    dirs.push(path.join(process.resourcesPath, 'docs'));
    dirs.push(process.resourcesPath);
    try {
      dirs.push(path.dirname(process.execPath));
    } catch (_) {}
  }
  dirs.push(path.join(__dirname, 'docs'));
  dirs.push(__dirname);
  return dirs;
}

function isManualFilename(name) {
  if (!name || typeof name !== 'string') return false;
  if (!/\.(docx|pdf)$/i.test(name)) return false;
  const n = name.toLowerCase();
  // Cyrillic "инструкц" / "инструкция" + latin patterns
  if (/инструкц/i.test(name)) return true;
  if (n.includes('kak-polzovatsya')) return true;
  if (n.includes('howto')) return true;
  if (/^gililon-kak/i.test(n)) return true;
  if (n.includes('user-manual') || n.includes('user_manual')) return true;
  return false;
}

function findManualPath() {
  const preferred = [
    'GililOn-kak-polzovatsya.pdf',
    'GililOn-kak-polzovatsya.PDF',
    'GililOn-kak-polzovatsya.docx',
    'GililOn-kak-polzovatsya.DOCX',
  ];
  const dirs = manualSearchDirs();
  for (const dir of dirs) {
    try {
      if (!fs.existsSync(dir)) continue;
    } catch (_) {
      continue;
    }
    for (const name of preferred) {
      const p = path.join(dir, name);
      try {
        if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
      } catch (_) {}
    }
    try {
      const entries = fs.readdirSync(dir);
      const hits = entries
        .filter((n) => isManualFilename(n))
        .map((n) => path.join(dir, n))
        .filter((p) => {
          try {
            return fs.statSync(p).isFile();
          } catch (_) {
            return false;
          }
        })
        .sort((a, b) => {
          // Prefer docx over pdf, then newer mtime
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
      if (hits.length) return hits[0];
    } catch (_) {}
  }
  return null;
}

async function openManualFile() {
  const found = findManualPath();
  if (!found) {
    return { ok: false, error: 'not_found' };
  }
  try {
    const errMsg = await shell.openPath(found);
    if (errMsg) {
      // Fallback: file:// URL via openExternal
      try {
        await shell.openExternal('file://' + found.replace(/\\/g, '/'));
        return { ok: true, path: found, via: 'openExternal' };
      } catch (e2) {
        return { ok: false, error: errMsg || e2.message, path: found };
      }
    }
    return { ok: true, path: found, via: 'openPath' };
  } catch (e) {
    return { ok: false, error: e.message || String(e), path: found };
  }
}

/**
 * Resolve the Node binary used to run the Gilil On stage2 server.
 * Packaged Windows builds ALWAYS use the portable node.exe shipped in
 * resources/node/ (no system Node required). Dev / non-packaged keeps
 * GILIL_NODE or PATH `node`.
 */
function resolveNodeBin() {
  if (app.isPackaged) {
    const embedded = path.join(process.resourcesPath, 'node', 'node.exe');
    if (process.platform === 'win32' || fs.existsSync(embedded)) {
      return embedded;
    }
  }
  return process.env.GILIL_NODE || 'node';
}

function resolveAppIcon() {
  const candidates = [
    path.join(__dirname, 'icons', 'gilil-on-windows.ico'),
    path.join(__dirname, 'icons', 'gilil-on-512.png'),
    path.join(__dirname, 'tray-icon.png'),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        const img = nativeImage.createFromPath(p);
        if (!img.isEmpty()) return { path: p, image: img };
      }
    } catch (_) {}
  }
  return { path: null, image: null };
}

function readPort(serverRoot) {
  const envPath = path.join(serverRoot, '.env');
  try {
    const text = fs.readFileSync(envPath, 'utf8');
    const m = text.match(/^\s*PORT\s*=\s*(\d+)\s*$/m);
    if (m) return Number(m[1]);
  } catch (_) {
    /* no .env — use default */
  }
  return DEFAULT_PORT;
}

function waitForPort(port, timeoutMs = 30000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(
        { host: '127.0.0.1', port, path: '/api/health', timeout: 1000 },
        (res) => {
          res.resume();
          if (res.statusCode && res.statusCode < 500) {
            resolve();
            return;
          }
          retry();
        }
      );
      req.on('error', retry);
      req.on('timeout', () => {
        req.destroy();
        retry();
      });
    };
    const retry = () => {
      if (Date.now() - started > timeoutMs) {
        reject(new Error(`Server did not become ready on port ${port} within ${timeoutMs}ms`));
        return;
      }
      setTimeout(attempt, 250);
    };
    attempt();
  });
}

function startServer(serverRoot, port) {
  const entry = path.join(serverRoot, 'src', 'index.js');
  if (!fs.existsSync(entry)) {
    throw new Error(`Server entry not found: ${entry}`);
  }

  // Writable DB under userData (resources/ may be read-only in some installs)
  const dataDir = path.join(app.getPath('userData'), 'gilil-on-data');
  try {
    fs.mkdirSync(dataDir, { recursive: true });
  } catch (_) {}
  const dbPath = path.join(dataDir, 'gilil-on-stage2.db');

  const env = {
    ...process.env,
    PORT: String(port),
    DATABASE_PATH: dbPath,
  };

  const nodeBin = resolveNodeBin();
  console.log(`[gilil-desktop] v=${APP_VERSION} nodeBin=${nodeBin}`);
  console.log(`[gilil-desktop] db=${dbPath}`);

  serverProcess = spawn(nodeBin, [entry], {
    cwd: serverRoot,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  serverProcess.stdout.on('data', (buf) => {
    console.log(`[gilil-server] ${buf.toString().trimEnd()}`);
  });
  serverProcess.stderr.on('data', (buf) => {
    console.error(`[gilil-server] ${buf.toString().trimEnd()}`);
  });
  serverProcess.on('exit', (code, signal) => {
    console.log(`[gilil-server] exited code=${code} signal=${signal}`);
    serverProcess = null;
    if (!quitting && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(
          `<body style="margin:0;background:#0b0d10;color:#e8eaed;font:14px/1.4 system-ui;display:grid;place-items:center;height:100vh">
           <div><h1>Gilil On</h1><p>Сервер остановлен (code ${code}). Перезапустите приложение.</p></div></body>`
        )}`
      );
    }
  });

  return serverProcess;
}

function killServerTree() {
  if (!serverProcess || serverProcess.killed) {
    serverProcess = null;
    return;
  }
  const child = serverProcess;
  serverProcess = null;
  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      });
    } else {
      child.kill('SIGTERM');
      setTimeout(() => {
        try {
          if (!child.killed) child.kill('SIGKILL');
        } catch (_) {
          /* ignore */
        }
      }, 2000);
    }
  } catch (e) {
    console.error('[gilil-desktop] kill server failed:', e.message);
  }
}

function windowIsQuiet() {
  if (!mainWindow || mainWindow.isDestroyed()) return true;
  return mainWindow.isMinimized() || !mainWindow.isFocused();
}

function focusMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function sectionForNotifType(type) {
  if (type === 'message') return 'chats';
  if (type === 'task') return 'personal';
  if (type === 'invoice') return 'crm';
  if (type === 'lead') return 'leads';
  if (type === 'mail') return 'mail';
  return null;
}

function sendToRenderer(channel, payload) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  try {
    mainWindow.webContents.send(channel, payload);
  } catch (_) {}
}

function loadTrayIcon() {
  const candidates = [
    path.join(__dirname, 'tray-icon.png'),
    path.join(__dirname, 'icons', 'tray-icon.png'),
    path.join(__dirname, 'icons', 'gilil-on-512.png'),
  ];
  for (const iconPath of candidates) {
    try {
      if (fs.existsSync(iconPath)) {
        const img = nativeImage.createFromPath(iconPath);
        if (!img.isEmpty()) return img;
      }
    } catch (_) {}
  }
  // 16x16 teal fallback
  const size = 16;
  const buf = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const dx = x - 7.5;
      const dy = y - 7.5;
      const on = dx * dx + dy * dy <= 36;
      buf[i] = on ? 20 : 0;
      buf[i + 1] = on ? 184 : 0;
      buf[i + 2] = on ? 166 : 0;
      buf[i + 3] = on ? 255 : 0;
    }
  }
  return nativeImage.createFromBuffer(buf, { width: size, height: size });
}

function trayTooltip() {
  if (unreadBadge > 0) {
    return `Gilil On · ${unreadBadge > 99 ? '99+' : unreadBadge} непрочит.`;
  }
  return 'Gilil On';
}

function rebuildTrayMenu() {
  if (!tray) return;
  const soundLabel = notifSoundOn ? 'Выключить звук' : 'Включить звук';
  const template = [
    {
      label: 'Открыть Gilil On',
      click: () => focusMainWindow(),
    },
    {
      label: 'Прочитать все',
      click: () => {
        focusMainWindow();
        sendToRenderer('gilil:mark-all-read');
      },
    },
    {
      label: soundLabel,
      click: () => {
        notifSoundOn = !notifSoundOn;
        sendToRenderer('gilil:toggle-sound');
        rebuildTrayMenu();
      },
    },
  ];

  const updItems = trayUpdateMenuItems();
  if (updItems && updItems.length) {
    template.push({ type: 'separator' });
    for (const it of updItems) {
      const action = it.action;
      template.push({
        label: it.label,
        enabled: it.enabled !== false,
        click: () => {
          if (action === 'download') {
            focusMainWindow();
            updateStartDownload().catch(() => {});
          } else if (action === 'install') {
            updateQuitAndInstall();
          } else {
            focusMainWindow();
          }
        },
      });
    }
  }

  template.push({ type: 'separator' });
  template.push({
    label: 'Выход',
    click: () => {
      quitting = true;
      killServerTree();
      app.quit();
    },
  });

  const menu = Menu.buildFromTemplate(template);
  tray.setContextMenu(menu);
  const st = getUpdateState();
  let tip = trayTooltip();
  if (st && st.status === 'available') {
    tip = st.version
      ? `Gilil On · обновление v${st.version}`
      : 'Gilil On · обновление доступно';
  } else if (st && st.status === 'downloaded') {
    tip = 'Gilil On · готово к установке';
  }
  tray.setToolTip(tip);
}

function setupTray() {
  if (tray) return;
  try {
    tray = new Tray(loadTrayIcon());
    tray.setToolTip('Gilil On');
    tray.on('click', () => focusMainWindow());
    tray.on('double-click', () => focusMainWindow());
    rebuildTrayMenu();
  } catch (e) {
    console.warn('[gilil-desktop] tray unavailable:', e.message);
    tray = null;
  }
}

function showDesktopToast(payload) {
  if (!Notification.isSupported()) return;
  // Only when minimized / unfocused — avoid toast spam while working in-app
  if (!windowIsQuiet()) return;

  const title = String((payload && (payload.title || payload.actor_name)) || 'Gilil On').slice(0, 120);
  const body = String((payload && payload.body) || '').slice(0, 200);
  const notif = new Notification({
    title,
    body: body || 'Новое уведомление',
    silent: !notifSoundOn,
  });
  notif.on('click', () => {
    focusMainWindow();
    const type = payload && payload.type;
    const section = sectionForNotifType(type);
    sendToRenderer('gilil:navigate', {
      section,
      type,
      notifId: payload && payload.id,
      entity_type: payload && payload.entity_type,
      entity_id: payload && payload.entity_id,
    });
  });
  notif.show();
}

function setupIpc() {
  ipcMain.on('gilil:notify', (_e, payload) => {
    try {
      showDesktopToast(payload || {});
    } catch (err) {
      console.warn('[gilil-desktop] toast failed:', err.message);
    }
  });

  ipcMain.on('gilil:tray-badge', (_e, count) => {
    unreadBadge = Math.max(0, Number(count) || 0);
    if (tray) {
      try {
        tray.setToolTip(trayTooltip());
        if (process.platform === 'darwin') {
          app.dock && app.dock.setBadge(unreadBadge > 0 ? String(Math.min(unreadBadge, 99)) : '');
        } else if (typeof tray.setTitle === 'function') {
          tray.setTitle(unreadBadge > 0 ? (unreadBadge > 99 ? '99+' : String(unreadBadge)) : '');
        }
      } catch (_) {}
    }
  });

  ipcMain.on('gilil:notif-sound', (_e, on) => {
    notifSoundOn = !!on;
    rebuildTrayMenu();
  });

  ipcMain.on('gilil:set-theme', (_e, id) => {
    writeSavedSplashTheme(id);
  });

  ipcMain.handle('gilil:open-manual', async () => {
    try {
      return await openManualFile();
    } catch (err) {
      console.warn('[gilil-desktop] open-manual failed:', err && err.message);
      return { ok: false, error: (err && err.message) || 'open_failed' };
    }
  });
}

const DESKTOP_SHORTCUT_FLAG = 'desktop-shortcut-created.flag';

/**
 * Portable builds have no installer UI, so NSIS createDesktopShortcut never runs.
 * On first packaged Windows launch, create a desktop .lnk once (userData flag).
 */
function ensureDesktopShortcutOnce() {
  if (process.platform !== 'win32') return;
  if (!app.isPackaged) return;

  const flagPath = path.join(app.getPath('userData'), DESKTOP_SHORTCUT_FLAG);
  try {
    if (fs.existsSync(flagPath)) return;
  } catch (_) {
    return;
  }

  let desktopDir;
  try {
    desktopDir = app.getPath('desktop');
  } catch (e) {
    console.warn('[gilil-desktop] desktop path unavailable:', e.message);
    return;
  }

  const shortcutPath = path.join(desktopDir, 'Gilil On.lnk');
  const iconPath = (() => {
    const ico = path.join(__dirname, 'icons', 'gilil-on-windows.ico');
    try {
      if (fs.existsSync(ico)) return ico;
    } catch (_) {}
    return process.execPath;
  })();

  let created = false;
  try {
    created = shell.writeShortcutLink(shortcutPath, 'create', {
      target: process.execPath,
      cwd: path.dirname(process.execPath),
      args: '',
      description: 'Gilil On',
      icon: iconPath,
      iconIndex: 0,
      appUserModelId: 'com.gilil.on',
    });
  } catch (e) {
    console.warn('[gilil-desktop] writeShortcutLink failed:', e.message);
    return;
  }

  if (!created) {
    // If link already exists, still mark done so we do not retry forever.
    try {
      if (fs.existsSync(shortcutPath)) created = true;
    } catch (_) {}
  }

  if (created) {
    try {
      fs.mkdirSync(path.dirname(flagPath), { recursive: true });
      fs.writeFileSync(flagPath, `created=${new Date().toISOString()}\npath=${shortcutPath}\n`, 'utf8');
      console.log(`[gilil-desktop] desktop shortcut ok: ${shortcutPath}`);
    } catch (e) {
      console.warn('[gilil-desktop] shortcut flag write failed:', e.message);
    }
  } else {
    console.warn('[gilil-desktop] desktop shortcut not created');
  }
}


function themeFilePath() {
  return path.join(app.getPath('userData'), 'gilil_theme.txt');
}

function readSavedSplashTheme() {
  try {
    let t = String(fs.readFileSync(themeFilePath(), 'utf8') || '').trim();
    if (t === 'blue') t = 'cyan';
    if (t === 'beige') t = 'bitrix';
    if (SPLASH_THEMES.has(t)) return t;
  } catch (_) {}
  return 'dark';
}

function writeSavedSplashTheme(id) {
  const theme = SPLASH_THEMES.has(id) ? id : 'dark';
  try {
    fs.writeFileSync(themeFilePath(), theme + '\n', 'utf8');
  } catch (e) {
    console.warn('[gilil-desktop] theme write failed:', e.message);
  }
  return theme;
}

function createSplashWindow() {
  const theme = readSavedSplashTheme();
  const bg = SPLASH_BG[theme] || SPLASH_BG.dark;
  splashShownAt = Date.now();
  splashWindow = new BrowserWindow({
    width: 440,
    height: 340,
    frame: false,
    transparent: false,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    center: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    backgroundColor: bg,
    title: 'Gilil On',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  });
  const splashPath = path.join(__dirname, 'splash-electron.html');
  splashWindow.loadFile(splashPath, { query: { theme } }).catch((err) => {
    console.warn('[gilil-desktop] splash load failed:', err.message);
  });
  splashWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) splashWindow.show();
  });
  splashWindow.on('closed', () => {
    splashWindow = null;
  });
}

function closeSplashWindow() {
  const finish = () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      try {
        splashWindow.close();
      } catch (_) {}
    }
    splashWindow = null;
  };
  const elapsed = Date.now() - (splashShownAt || Date.now());
  const wait = Math.max(0, SPLASH_MIN_MS - elapsed);
  setTimeout(finish, wait);
}

async function createWindow() {
  const serverRoot = resolveServerRoot();
  const port = readPort(serverRoot) || DEFAULT_PORT;

  console.log(`[gilil-desktop] serverRoot=${serverRoot} port=${port}`);

  startServer(serverRoot, port);
  await waitForPort(port);

  const iconInfo = resolveAppIcon();

  // Fit inside the display under the cursor (multi-monitor / taskbar / HiDPI safe).
  // Default = normal window within workArea with inset — do NOT maximize on start
  // (maximize made the app feel "огромным"; user can still maximize via titlebar).
  let display;
  try {
    display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  } catch (_) {
    display = null;
  }
  if (!display) display = screen.getPrimaryDisplay();
  const wa = display.workArea; // { x, y, width, height } excludes taskbar/dock
  const waW = wa.width;
  const waH = wa.height;
  const MIN_W = 900;
  const MIN_H = 600;
  const SCALE = 0.85;
  const margin = Math.round(Math.min(waW, waH) * 0.04); // ~4% inset
  const maxW = Math.max(1, waW - margin * 2);
  const maxH = Math.max(1, waH - margin * 2);
  const minW = Math.min(MIN_W, maxW);
  const minH = Math.min(MIN_H, maxH);
  let winW = Math.round(waW * SCALE);
  let winH = Math.round(waH * SCALE);
  winW = Math.min(maxW, Math.max(minW, winW));
  winH = Math.min(maxH, Math.max(minH, winH));
  const winX = Math.round(wa.x + (waW - winW) / 2);
  const winY = Math.round(wa.y + (waH - winH) / 2);

  const winOpts = {
    width: winW,
    height: winH,
    x: winX,
    y: winY,
    minWidth: minW,
    minHeight: minH,
    resizable: true,
    maximizable: true,
    fullscreenable: true,
    backgroundColor: SPLASH_BG[readSavedSplashTheme()] || '#0c0a08',
    title: `Gilil On ${APP_VERSION}`,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
    },
  };
  if (iconInfo.path) winOpts.icon = iconInfo.path;

  mainWindow = new BrowserWindow(winOpts);
  try {
    mainWindow.setMinimumSize(minW, minH);
  } catch (_) {}

  // --- Security hardening (permissions / navigation / external links) ---
  const localOrigin = `http://127.0.0.1:${port}`;
  const ses = mainWindow.webContents.session;

  ses.setPermissionRequestHandler((_wc, permission, callback, details) => {
    // Deny filesystem / camera / screens / MIDI etc. by default.
    // Allow microphone only for our local shell (voice messages in chat).
    const requestingUrl = (details && details.requestingUrl) || '';
    let originOk = false;
    try {
      const u = new URL(requestingUrl);
      originOk = u.hostname === '127.0.0.1' || u.hostname === 'localhost';
    } catch (_) {
      originOk = false;
    }
    if (permission === 'media' || permission === 'microphone') {
      // media covers mic+camera in Chromium; we still deny camera via
      // setDisplayMediaRequestHandler / mediaTypes when available.
      const types = (details && details.mediaTypes) || [];
      if (types.includes('video')) {
        callback(false);
        return;
      }
      callback(!!originOk);
      return;
    }
    if (permission === 'mediaKeySystem' || permission === 'clipboard-sanitized-write') {
      callback(!!originOk);
      return;
    }
    // fileSystem, openExternal, geolocation, notifications (OS notifs go via
    // main Notification API), pointerLock, etc. — deny.
    callback(false);
  });

  ses.setPermissionCheckHandler((_wc, permission, requestingOrigin, details) => {
    let originOk = false;
    try {
      const u = new URL(requestingOrigin || '');
      originOk = u.hostname === '127.0.0.1' || u.hostname === 'localhost';
    } catch (_) {
      originOk = false;
    }
    if (permission === 'media' || permission === 'microphone') {
      const types = (details && details.mediaTypes) || [];
      if (types.includes('video')) return false;
      return !!originOk;
    }
    if (permission === 'clipboard-sanitized-write') return !!originOk;
    return false;
  });

  // Block display/screen capture / camera display-media prompts.
  if (typeof ses.setDisplayMediaRequestHandler === 'function') {
    ses.setDisplayMediaRequestHandler((_req, callback) => {
      callback({}); // deny
    });
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const u = new URL(url);
      if (u.protocol === 'https:') {
        shell.openExternal(url).catch(() => {});
      }
    } catch (_) {}
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    try {
      const u = new URL(url);
      const allowed =
        (u.hostname === '127.0.0.1' || u.hostname === 'localhost') &&
        u.port === String(port) &&
        (u.protocol === 'http:' || u.protocol === 'https:');
      if (!allowed) {
        event.preventDefault();
        if (u.protocol === 'https:') {
          shell.openExternal(url).catch(() => {});
        }
      }
    } catch (_) {
      event.preventDefault();
    }
  });

  mainWindow.once('ready-to-show', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      // Keep fitted workArea bounds — no maximize on startup.
      try {
        mainWindow.setBounds({ x: winX, y: winY, width: winW, height: winH });
      } catch (_) {}
      mainWindow.show();
    }
    closeSplashWindow();
  });

  await mainWindow.loadURL(`${localOrigin}${UI_PATH}`);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('minimize', () => {
    /* tray remains for badge/toast */
  });
}


// Deny <webview> / guest content (no remote embedding of privileged pages).
app.on('web-contents-created', (_e, contents) => {
  contents.on('will-attach-webview', (event) => {
    event.preventDefault();
  });
});

app.whenReady().then(async () => {
  setupIpc();
  setupDomainWhitelist();

  const sig = await checkAuthenticodeSignature();
  const ok = await confirmIfSignatureInvalid(sig);
  if (!ok) {
    quitting = true;
    killServerTree();
    app.quit();
    return;
  }

  setupTray();
  try {
    ensureDesktopShortcutOnce();
  } catch (e) {
    console.warn('[gilil-desktop] ensureDesktopShortcutOnce:', e.message);
  }
  try {
    createSplashWindow();
  } catch (e) {
    console.warn('[gilil-desktop] splash failed:', e.message);
  }
  createWindow()
    .then(() => {
      try {
        setupAutoUpdater({
          sendToRenderer,
          rebuildTrayMenu,
          focusMainWindow,
          windowIsQuiet,
        });
      } catch (e) {
        console.warn('[gilil-desktop] auto-updater setup failed:', e && e.message);
      }
    })
    .catch((err) => {
      console.error('[gilil-desktop] startup failed:', err);
      try { closeSplashWindow(); } catch (_) {}
      dialog.showErrorBox('Gilil On', `Не удалось запустить сервер:\n${err.message}`);
      quitting = true;
      killServerTree();
      app.quit();
    });
});

app.on('window-all-closed', () => {
  quitting = true;
  killServerTree();
  if (tray) {
    try {
      tray.destroy();
    } catch (_) {}
    tray = null;
  }
  app.quit();
});

app.on('before-quit', () => {
  quitting = true;
  killServerTree();
});

app.on('will-quit', () => {
  killServerTree();
});
