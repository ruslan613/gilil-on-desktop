# SHORTCUT-FIX — Gilil On 1.1.0 desktop shortcut

Дата: 2026-10-31 (Asia/Hong_Kong)

## Было не так

- Сборка Windows — **только portable** (`electron-builder --win portable`, `build.win.target: portable`).
- Portable `.exe` **не устанавливает** приложение: нет NSIS-мастера, нет чекбокса «ярлык на рабочий стол».
- В `package.json` уже был блок `build.nsis` с `createDesktopShortcut`, но он **никогда не применялся**, потому что target `nsis` не входил в сборку.
- В `main.js` не было создания `.lnk` при первом запуске.

## Что изменено

### A) Portable — ярлык при первом запуске (`main.js`)

- Добавлена `ensureDesktopShortcutOnce()`:
  - только `win32` + `app.isPackaged`;
  - флаг `userData/desktop-shortcut-created.flag` (один раз);
  - `shell.writeShortcutLink` → `%USERPROFILE%\Desktop\Gilil On.lnk`;
  - target = `process.execPath` (сам portable exe), icon = `icons/gilil-on-windows.ico` или exe.
- Вызов из `app.whenReady()` после tray, до `createWindow()`.

### B) NSIS (документация / опционально)

`build.nsis` обновлён:

```json
"nsis": {
  "oneClick": false,
  "allowToChangeInstallationDirectory": true,
  "createDesktopShortcut": "always",
  "createStartMenuShortcut": true,
  "shortcutName": "Gilil On"
}
```

Чтобы собрать installer вместо (или вместе с) portable:

```bash
npm run dist:nsis
# эквивалент: electron-builder --win nsis
```

Или оба target в `build.win.target`:

```json
"target": [
  { "target": "portable", "arch": ["x64"] },
  { "target": "nsis", "arch": ["x64"] }
]
```

**По умолчанию `npm run dist` по-прежнему собирает portable** — mid-rebuild другого executor не ломаем.

## Нужна ли пересборка exe?

**Да.** Правки в исходниках (`main.js` / `package.json`); текущий `dist/GililOn-1.1.0-win.exe` без rebuild ярлык при первом запуске не получит.

На момент фикса в `dist/` мог идти чужой `npm run dist` (window-size) — этот фикс **не** перезапускал dist, чтобы не конфликтовать с записью в ту же папку.
