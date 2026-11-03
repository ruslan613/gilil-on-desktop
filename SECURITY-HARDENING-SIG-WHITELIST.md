# Gilil On 1.1.0 — Signature check + domain whitelist hardening

**Дата:** 2026-10-31 (Asia/Hong_Kong, HKT)  
**Артефакт:** `/workspace/artifacts/gilil-on-desktop/dist/GililOn-1.1.0-win.exe`  
**Размер:** 94479216 байт (~90.1 MB)  
**SHA256:** `b4725b35409213d99fabc167cb11053197f8727a958e8f8f945803ae4d2a32a9`  
**Version (package.json):** 1.1.0  

---

## Что изменилось

| Файл | Изменение |
|------|-----------|
| `main.js` | Authenticode confirm-on-start + `webRequest` domain whitelist + `security.log` |
| `security-domains.json` | Bundled default allowlist (в asar) |
| `package.json` `build.files` | Добавлен `security-domains.json` |
| `SECURITY-HARDENING-SIG-WHITELIST.md` | Этот отчёт |

---

## 1) Authenticode при запуске (`main.js`)

1. После `app.whenReady()` вызывается `checkAuthenticodeSignature()`.
2. **Windows:** `powershell -NoProfile -NonInteractive -Command "(Get-AuthenticodeSignature -FilePath '<process.execPath>').Status"`.
3. Если `Status !== Valid` (в т.ч. `NotSigned`, `HashMismatch`, `UnknownError`): `dialog.showMessageBox` (RU) — «подпись отсутствует/невалидна, риск подмены»; кнопки **Продолжить** / **Выход**. Жёсткой блокировки нет.
4. **Non-Windows** (сборка/dev на Linux): skip + лог `signature_check_skipped_platform`.
5. Лог: console + `userData/gilil-on-data/security.log` (timestamp, status, path, user choice).

> Текущий portable exe **не подписан** (signAndEditExecutable: false) — на Windows пользователь увидит предупреждение при каждом старте, пока не появится Authenticode-подпись.

---

## 2) Whitelist доменов

- **Bundled:** `security-domains.json` рядом с `main.js` (в asar).
- **Override (опционально):** `userData/gilil-on-data/security-domains.json` — заменяет `allowHosts`.
- **Default allowHosts:** `127.0.0.1`, `localhost`, `::1`, `registry.npmjs.org`, `github.com`, `objects.githubusercontent.com`, `cdn.npmmirror.com`.
- IP-литералы: только loopback (`127.0.0.0/8`, `::1`); остальные IP — block.
- Electron: `session.defaultSession.webRequest.onBeforeRequest` для `http/https/ws/wss` — cancel + `request_blocked` в `security.log`, если host не в whitelist.

### Документация сети

- Runtime UI/API: только **localhost:8788** (`http://127.0.0.1:PORT/shell-v2.html` + WS) — не ломается.
- npm / github / npmmirror — запас под будущие update/download hooks.
- Stage2-сервер в этой сборке **не ходит наружу**.

---

## Проверка упаковки

`app.asar` содержит `/main.js` и `/security-domains.json`.
