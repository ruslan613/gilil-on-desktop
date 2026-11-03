# Gilil On — автообновление (electron-updater)

Тихая проверка обновлений при старте → кнопка **«Обновление доступно»** → **«Загрузить»** (прогресс) → **«Установить и перезапустить»**.

## Что поддерживается

| Сборка | Автообновление |
|--------|----------------|
| **NSIS installer** (`GililOn-*-win-setup.exe`) | Да — полный цикл через electron-updater |
| **Portable** (`GililOn-*-win.exe`) | Нет (нет установщика). Пользователям с portable — раздавать NSIS или скачивать новый portable вручную |

Publish-канал: **GitHub Releases** репозитория [`ruslan613/gilil-on-desktop`](https://github.com/ruslan613/gilil-on-desktop).

> Репозиторий нужно создать (private OK), если его ещё нет. Аккаунт GitHub владельца: **ruslan613**.

## Файлы

| Файл | Роль |
|------|------|
| `auto-updater.js` | Main-process: check / download / quitAndInstall, IPC, tray hooks |
| `main.js` | Подключает updater после старта окна; пункты трея |
| `preload.js` | `gililDesktop.getUpdateStatus / checkForUpdates / downloadUpdate / installUpdate / onUpdateStatus` |
| `server/public/shell-v2.*` | Баннер «Обновление доступно» + прогресс + кнопки (RU/ZH/EN) |
| `package.json` → `build.publish` | `provider: github`, owner/repo |
| `scripts/smoke-auto-update.js` | Mock feed smoke |

Не затрагивает: колокольчик уведомлений, трей-бейдж, Gilil Supply iframe (**8797**), API/WS **8788**, live Supply **8787**.

## Пошаговая публикация обновления

### 0. Один раз: репозиторий и токен

1. Создайте private (или public) репозиторий **`ruslan613/gilil-on-desktop`** на GitHub (можно пустой).
2. Создайте Personal Access Token с правом `repo` (для private) / `public_repo`.
3. На машине сборки:

```bash
export GH_TOKEN=ghp_xxxxxxxx   # или GITHUB_TOKEN
export PATH="/home/box/.local/node-v20.19.5-linux-x64/bin:$PATH"  # если на этой box
```

### 1. Поднять версию

В `package.json` (и при желании `APP_VERSION` в `main.js`) например `1.1.0` → `1.1.1`.

### 2. Собрать Windows NSIS (на Windows или CI с Wine)

```bash
cd gilil-on-desktop
npm install
npm run dist:nsis
# или оба артефакта: npm run dist
```

Артефакты в `dist/`:

- `GililOn-<ver>-win-setup.exe` — установщик (нужен для auto-update)
- `latest.yml` — манифест electron-updater
- `*.exe.blockmap` — для дифференциальных обновлений (если сгенерирован)
- опционально portable `GililOn-<ver>-win.exe` (не для updater)

### 3. Залить в GitHub Releases

**Вариант A — electron-builder publish (предпочтительно):**

```bash
export GH_TOKEN=...
npx electron-builder --win nsis --publish always
```

Создаст/обновит Release с тегом `v<version>` и приложит setup + `latest.yml`.

**Вариант B — вручную:**

1. GitHub → `ruslan613/gilil-on-desktop` → Releases → Draft / New release.
2. Tag: `v1.1.1` (как версия в package.json).
3. Загрузить: `GililOn-1.1.1-win-setup.exe`, `latest.yml`, `.blockmap` (если есть).
4. Publish release.

### 4. Что видит пользователь

1. При следующем запуске установленного NSIS-приложения тихая проверка GitHub Releases.
2. Если версия на Releases выше локальной — баннер и пункт трея **«Обновление доступно»**.
3. **Загрузить** — прогресс-бар.
4. **Установить и перезапустить** — NSIS silent install + relaunch.

## Альтернатива без GitHub (generic HTTP)

Если Releases недоступны, положите на HTTPS-сервер ту же пару файлов и при старте задайте:

```bash
set GILIL_UPDATE_FEED_URL=https://updates.example.com/gilil-on/
```

Структура на сервере:

```
https://updates.example.com/gilil-on/latest.yml
https://updates.example.com/gilil-on/GililOn-1.1.1-win-setup.exe
```

В коде: `autoUpdater.setFeedURL({ provider: 'generic', url })` при наличии `GILIL_UPDATE_FEED_URL`.

## Dev / smoke

```bash
export PATH="/home/box/.local/node-v20.19.5-linux-x64/bin:$PATH"
cd /workspace/artifacts/gilil-on-desktop
npm run smoke:update
```

Поднимает локальный mock feed (`latest.yml`), запускает минимальный Electron entry и проверяет, что `checkForUpdates` не падает.

Принудительно в обычном `npm start`:

```bash
GILIL_UPDATE_FORCE=1 GILIL_UPDATE_FEED_URL=http://127.0.0.1:PORT npm start
```

## Private GitHub Releases

Клиентам нужен доступ к артефактам. Для private repo:

- либо сделайте release assets доступными через публичный репозиторий / generic HTTPS;
- либо настройте token на клиенте (не рекомендуется раздавать PAT в десктоп).

Рекомендация: private исходники + **public** Releases repo **или** generic HTTPS на своём сервере.

## Безопасность сети

В `security-domains.json` уже разрешены хосты обновлений: `github.com`, `api.github.com`, `objects.githubusercontent.com`, `release-assets.githubusercontent.com`.
