# Gilil On 1.1.0 — Windows portable build

**Дата:** 2026-10-31 (Asia/Hong_Kong)
**Артефакт:** `/workspace/artifacts/gilil-on-desktop/dist/GililOn-1.1.0-win.exe`
**Размер:** 94481444 байт (90.1 MB)
**Версия package.json:** 1.1.0
**Иконка:** `icons/gilil-on-windows.ico`
**Порт сервера:** 8788
**UI:** shell-v2.html (stage2 server/public/)


## Security hardening (2026-10-31 HKT)

См. **`SECURITY-1.1.0.md`**.

- Пересборка после Electron permission / navigation hardening + bind server `127.0.0.1`
- **SHA256:** `5763dbad0b06600c7f9143e07565715c23c7faf0646caf7fdeea592dc1829733`
- **Размер:** 94481444 байт
- ClamAV infected: **0** (main.cvd 63 / daily.cvd 28169)
- PE: UNSIGNED (cert table size 0)

## Состав portable

- Electron shell (main.js / preload.js) — окно + трей + Notification при свёрнутом
- Embedded Node: resources/node/node.exe (vendor/node-win-x64)
- Stage 2 сервер: resources/server/ (Express + WS /ws + SQLite better-sqlite3 win x64)
- Static UI: resources/server/public/shell-v2.html|css|js + themes.css
- БД при запуске: Electron userData/gilil-on-data/ (не в asar)

## Проверка (на Linux box)

| Проверка | Результат |
|----------|-----------|
| Файл GililOn-1.1.0-win.exe существует | OK |
| win-unpacked/resources/node/node.exe | OK |
| win-unpacked/resources/server/ + public/shell-v2.html | OK |
| better_sqlite3.node в сборке = Windows PE (MZ) | OK |
| Health из копии packaged server (linux native swap) на :8788 | OK stage:2 |
| Static /shell-v2.html | OK 200 |
| API login/chats/funnels/usefulness/activity/notifications | OK |
| Запуск GUI .exe на Linux | нет (Wine недоступен) |

## Демо-логины (stage2 seed)

- admin / admin123 (general_admin)
- director_ru / dir123
- manager_ru / mgr123
- director_cn / dir123
- emp_ru1 / emp123

## Оговорки

- Полный запуск portable .exe (Electron GUI + spawn node.exe) нужно подтвердить на Windows.
- Разделы mail/leads/tenders/TV в UI остаются демо-заглушками (нет stage2 API); воронка / журнал / полезность / чаты / задачи / поиск / reply-status / колокольчик ходят в stage2.
