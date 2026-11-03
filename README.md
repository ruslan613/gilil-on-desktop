# Gilil On (Desktop)

Каркас Windows-приложения на Electron для интерфейса Gilil On поверх сервера Gilil Supply.

## Требования

### Portable .exe (чистая Windows)

**Node.js на целевой машине не нужен.** В сборку встроен portable Node.js (win-x64) и зависимости сервера, включая win32-биндинг `better-sqlite3`.

### Dev на машине разработчика

- Node.js ≥ 20 (для `npm start` / сборки)
- Рядом должна лежать папка сервера: `../gilil-supply-server` (точка входа `src/index.js`, порт из `.env` или **8787**)
- Опционально `GILIL_NODE` — путь к node для dev-запуска сервера

## Установка (dev)

```bash
cd gilil-on-desktop
npm install
```

Убедитесь, что зависимости сервера тоже установлены:

```bash
cd ../gilil-supply-server
npm install
```

Для Windows-сборки: в `vendor/node-win-x64/` должен лежать portable Node (zip с nodejs.org, `node.exe` в корне). Win32-бинарь `better-sqlite3` кладётся в `node_modules/better-sqlite3/build/Release/` (см. `vendor/better-sqlite3-win32/`).

## Запуск (dev)

```bash
npm start
```

При старте Electron:

1. поднимает сервер через `resolveNodeBin()` → в packaged: `resources/node/node.exe`, в dev: `GILIL_NODE` или системный `node`;
2. ждёт готовности порта (`/api/health`);
3. открывает окно **1280×800** (тёмный фон) с `http://127.0.0.1:<PORT>/shell-v2.html`;
4. при выходе убивает дочерний процесс сервера (на Windows — всё дерево процессов).

## Сборка portable Windows (.exe)

```bash
npm run dist
```

Результат: `dist/Gilil On 1.0.0.exe` (portable) и `dist/win-unpacked/`.

В `resources/`:

- `node/node.exe` — встроенный portable Node
- `gilil-supply-server/` — сервер + `node_modules` (с win32 `better-sqlite3`)

## Структура

| Файл / папка | Назначение |
|--------------|------------|
| `main.js` | Окно, spawn сервера через embedded node, ожидание порта, cleanup |
| `preload.js` | Изолированный preload (`contextIsolation`) |
| `vendor/node-win-x64/` | Portable Node win-x64 для extraResources |
| `package.json` | electron, electron-builder, scripts `start`/`dist` |

Сервер (шифрование RU↔CN, роли) **не изменяется** этим каркасом.


## Автообновление (Windows NSIS)

Тихая проверка при старте → баннер/трей **«Обновление доступно»** → **Загрузить** (прогресс) → **Установить и перезапустить**.

- Канал: GitHub Releases [`ruslan613/gilil-on-desktop`](https://github.com/ruslan613/gilil-on-desktop)
- Сборка установщика: `npm run dist:nsis` (portable **не** обновляется через electron-updater)
- Подробности: [docs/AUTO-UPDATE.md](docs/AUTO-UPDATE.md)
- Smoke (mock feed): `npm run smoke:update`

## Gilil Supply Stage 2 embed

Nav **Gilil Supply** embeds Stage 2 server on port **8797** (JWT RU↔CN chat, storage isolation).
See [docs/SUPPLY-STAGE2.md](docs/SUPPLY-STAGE2.md). Do not confuse with production Supply **8787**.

