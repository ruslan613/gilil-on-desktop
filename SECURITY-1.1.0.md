# Gilil On 1.1.0 — Security review (Windows portable)

**Дата:** 2026-10-31 (Asia/Hong_Kong, HKT)  
**Артефакт:** `/workspace/artifacts/gilil-on-desktop/dist/GililOn-1.1.0-win.exe`  
**Размер:** 94481444 байт (~90.1 MB)  
**SHA256:** `5763dbad0b06600c7f9143e07565715c23c7faf0646caf7fdeea592dc1829733`  
**PE Authenticode:** certificate table size = 0 → **UNSIGNED**  
**Предыдущий SHA256 (до hardening-rebuild):** `c7ec15fcd16e7956d4e73f7af133f8f434382ebf11ec75b53f15bdaecc5675f7`

---

## 1) ClamAV

| Параметр | Значение |
|----------|----------|
| Engine | ClamAV 1.4.2 |
| main.cvd | version **63**, sigs **3 287 027** (builder tomjudge) |
| daily.cvd | version **28169**, sigs **355 841** (builder svc.clamav-publisher, build 2026-10-30) |
| bytecode.cvd | version **339**, sigs **80** |
| Known viruses (loaded) | **3 628 245** |
| Update | `freshclam` OK → database.clamav.net (DNS fallback → HTTP) |

### Полный скан (pre-rebuild baseline, тот же код + Electron tree)

- Цели: `GililOn-1.1.0-win.exe` + `dist/win-unpacked/`
- Scanned files: **995**, directories: **251**
- Data scanned: **444.80 MB**
- **Infected files: 0**
- Все файлы: **OK** (0 FOUND)
- Exit: 0  
- Время (UTC в логе ClamAV): 03:26:53–03:28:21 → **11:26–11:28 HKT**

### Повторный скан после hardening-rebuild

- Цели: новый `GililOn-1.1.0-win.exe`, `Gilil On.exe`, `app.asar`, `elevate.exe`, `resources/node`, `resources/server/src`, `.env`
- Scanned files: **20**
- **Infected files: 0** — все **OK**
- Exit: 0  
- Время: 03:30:45–03:32:15 UTC → **11:30–11:32 HKT**

**Итог ClamAV: чисто (infected = 0).**

---

## 2) Права / возможности Windows (анализ кода)

Анализ: `main.js`, `preload.js`, asar, `server/src/*`, `server/public/shell-v2.*`.

### Файловая система

| Путь / действие | Назначение | Произвольный доступ к Documents/Desktop/Photos? |
|-----------------|------------|--------------------------------------------------|
| `app.getPath('userData')/gilil-on-data/` | SQLite БД (`gilil-on-stage2.db`) | **Нет** — только каталог приложения Electron |
| `process.resourcesPath/server/` | Чтение упакованного Stage2 сервера + `.env` (PORT) | **Нет** — только ресурсы приложения |
| `process.resourcesPath/node/node.exe` | spawn встроенного Node | **Нет** |
| Иконки в asar (`icons/`, `tray-icon.png`) | Tray / window icon | **Нет** |
| `dialog.showOpenDialog` / `showSaveDialog` | — | **Отсутствуют** |
| Сканирование `%USERPROFILE%`, Documents, Desktop, Pictures, почты | — | **Отсутствует** |
| `<input type="file">` в shell-v2 | — | **Нет** (голос — MediaRecorder blob, не file picker) |

**Вывод:** программа не читает документы/фото/почту/произвольные файлы ПК. Запись только в свой `userData` и чтение своего install tree.

### Реестр Windows

- Кода обращения к реестру (`winreg`, `regedit`, `Registry`) **нет**.
- Electron/Chromium могут писать свои служебные ключи профиля — не из прикладного кода Gilil On.

### Камера / микрофон

| API | Поведение |
|-----|-----------|
| `getUserMedia({ audio: true })` в `shell-v2.js` | Голосовые сообщения в чате (по кнопке пользователя) |
| Камера / `video` | **Deny** в `setPermissionRequestHandler` / check handler |
| Display media / screen capture | **Deny** (`setDisplayMediaRequestHandler` → пустой callback) |
| Микрофон | **Allow только** для origin `http://127.0.0.1` / `localhost` |

OS toast: Electron `Notification` API (main process), не Chromium notification permission из renderer.

### Сеть

| Было | Стало |
|------|-------|
| `server.listen(PORT)` → все интерфейсы (0.0.0.0) | **`server.listen(PORT, '127.0.0.1')`** — только loopback |
| UI / health | `http://127.0.0.1:8788` (+ `/ws`) |
| Внешний outbound из main | Нет (кроме потенциального `shell.openExternal` только **https:**) |

### Прочее Electron API

| API | Статус |
|-----|--------|
| `clipboard` (Electron main) | Не используется |
| Renderer `navigator.clipboard` (app-v2 legacy) | Только в `app-v2.js` (не основной UI); shell-v2 — нет |
| `shell.openPath` | **Нет** |
| `shell.openExternal` | Только **https:** через `setWindowOpenHandler` / `will-navigate` |
| `dialog.showErrorBox` | Только при фатальной ошибке старта сервера |
| preload IPC | Узкий bridge: notify / tray-badge / sound / navigate callbacks — без FS |

### webPreferences (после hardening)

- `nodeIntegration: false`
- `nodeIntegrationInWorker/SubFrames: false`
- `contextIsolation: true`
- `sandbox: true`
- `webSecurity: true` (явно; выключение запрещено политикой)
- `allowRunningInsecureContent: false`
- `<webview>` блокируется (`will-attach-webview` preventDefault)

---

## 3–4) Что изменено для ограничения доступа

Файлы:

1. **`main.js`**
   - Явные `webSecurity: true`, запрет insecure content / experimental
   - `session.setPermissionRequestHandler` + `setPermissionCheckHandler`: deny `fileSystem` и прочих; mic только localhost; video/camera deny
   - `setDisplayMediaRequestHandler` → deny
   - `setWindowOpenHandler` / `will-navigate`: наружу только https via `openExternal`; навигация UI только на `127.0.0.1:<port>`
   - Блок `<webview>`
2. **`server/src/index.js`**
   - Listen на **`127.0.0.1`** (не LAN)
3. Пересборка: `npm run dist` → `dist/GililOn-1.1.0-win.exe` (версия **1.1.0** сохранена)

Ранее уже было (сохранено): `contextIsolation`, `nodeIntegration: false`, `sandbox: true`, нет `showOpenDialog`, БД в userData.

---

## 5) Остаточные риски

| Риск | Комментарий |
|------|-------------|
| **UNSIGNED exe** | Authenticode отсутствует → SmartScreen / AV могут предупреждать; нужна подпись сертификатом |
| **`.env` secrets in package** | `resources/server/.env` содержит dev `JWT_SECRET` / `MESSAGE_KEY` — извлечь из portable может любой с файлом. Нужно: генерировать секреты при первом запуске в userData, не шипить prod-секреты |
| **`elevate.exe`** | Штатный helper electron-builder / Squirrel; ClamAV OK; не вызывается прикладным кодом Gilil On |
| **Демо-пароли в seed БД** | admin/admin123 и др. — только для локального stage2 demo |
| **Голосовой `/api/.../voice`** | UI шлёт FormData; отдельного upload-роута в `server/src` сейчас нет → запрос падает, на диск пользователя чужие файлы не пишутся |
| **cors()` без ограничения** | Смягчено bind на 127.0.0.1; всё же лучше сузить origin |
| **Нет code signing / notarize** | См. UNSIGNED |
| **Встроенный Node + полный server tree** | Любой локальный процесс может стучаться на 127.0.0.1:8788 (localhost threat model) |

---

## Соответствие требованию «без явного разрешения пользователя»

| Требование | Статус |
|------------|--------|
| Не читать Documents/Desktop/Photos/почту/произвольные файлы | **Соблюдено** (кода нет; fileSystem permission deny) |
| Доступ к файлам только с явного разрешения | Нет скрытого file picker / home scan; file dialogs отсутствуют |
| Микрофон | Только по действию пользователя в чате + OS/Chromium prompt; origin localhost |
| Камера | Deny по умолчанию |

