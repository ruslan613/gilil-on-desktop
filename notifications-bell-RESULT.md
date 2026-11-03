# Notifications bell — RESULT (P0 items 1–2)

**Date:** 2026-10-31 (Asia/Hong_Kong)  
**Brand:** Gilil On · Руслан Гилиль  
**Scope:** shell-v2 UI + SQLite/API/WS + Electron tray/toast

## Done

### shell-v2 UI
- Bell button after theme gear ⚙ and before userchip (order: pills | lang | role | gear | **🔔** | userchip).
- Style matches `.theme-gear` (34×34, radius 10); open state teal active; red pulsing unread badge (`99+`, hidden at 0).
- Dropdown ~360px: «Уведомления» + «Прочитать все»; tabs Все / Сообщения / Задачи / Счета with unread counts.
- Cards by type (message teal, task orange, invoice blue, lead purple, mail slate); relative time; unread teal dot.
- Click → mark read + navigate (`chats` / `personal` / `crm` / `leads` / `mail`).
- Empty state «Пока тихо».
- Soft chime; mute via `localStorage` key `notif.sound` = `on`|`off` (toggles in theme popover + Личная settings).
- i18n keys `notif.*` for zh / ru / en.

### Backend
- Table `notifications` (migrated on boot).
- Auth API: list, unread-counts, mark one, mark all (optional type filter), demo seed.
- WS push `{ type: 'notification', notification }` via existing `/ws?token=` + `sendToUser`.
- Wired sources: chat message/voice → other members; site leads → admin/director; mail inbound → manager; demo covers task/invoice.

### Electron (`gilil-on-desktop`)
- Tray icon + context: «Открыть Gilil On», «Прочитать все», «Выключить/Включить звук», «Выход».
- OS `Notification` toast when window minimized or unfocused; click → focus + `gilil:navigate` IPC.
- When focused: in-app only (no toast spam).
- Preload exposes `gililDesktop.notify / setTrayBadge / setNotifSound / onNavigate / onMarkAllRead / onToggleSound`.

## Files changed

| Path | Change |
|------|--------|
| `gilil-supply-server/src/notifications.js` | **new** module |
| `gilil-supply-server/src/db.js` | migrate notifications |
| `gilil-supply-server/src/chat.js` | `sendToUser` + notify on message/voice |
| `gilil-supply-server/src/index.js` | mount routes + pusher |
| `gilil-supply-server/src/leads.js` | unified lead notify |
| `gilil-supply-server/src/mail/notify.js` | bridge to unified bell |
| `gilil-supply-server/public/shell-v2.html` | bell markup + sound toggles |
| `gilil-supply-server/public/shell-v2.css` | bell/panel styles |
| `gilil-supply-server/public/shell-v2.js` | client logic + i18n |
| `gilil-supply-server/docs/NOTIFICATIONS.md` | **new** API notes |
| `gilil-supply-server/scripts/smoke-notifications.js` | **new** smoke |
| `gilil-on-desktop/main.js` | tray + toast + IPC |
| `gilil-on-desktop/preload.js` | desktop bridge |
| `gilil-on-desktop/tray-icon.png` | **new** tray asset |
| `gilil-on-desktop/package.json` | include tray-icon in build |
| `gilil-on-desktop/P0-backlog.md` | items 1–2 marked done |

## How to smoke-test

```bash
# Server (Node 20 — matches better-sqlite3 ABI on this box)
cd /workspace/artifacts/gilil-supply-server
# use Node 20 binary, e.g. /home/box/tools/node20/bin/node
node src/index.js

# API + WS
node scripts/smoke-notifications.js
# expect: SMOKE_OK and a ws notification line

# UI
# open http://127.0.0.1:8787/shell-v2.html → Enter demo (admin) →
# POST /api/notifications/demo (or use smoke) → bell badge + panel tabs + «Прочитать все»

# Electron (on Windows build for full toast)
cd /workspace/artifacts/gilil-on-desktop && npm start
# minimize window → trigger demo/WS notif → toast + tray menu
```

## Remains / partial

- Full Windows toast + tray badge overlay: implemented; verified for code paths on Linux; OS toast needs Windows runtime.
- Live `task` / `invoice` event emitters: demo seed + UI ready; personal/CRM workflows are still largely client-demo — hook the same `createNotification({ type:'task'|'invoice', ... })` when those server paths exist.
- shell-v2 chat UI is mostly local THREADS demo; live chat notify works for real `/api/conversations/.../messages` (verified ru1→cn1).
- Did not rebuild `dist/Gilil On 1.0.0.exe` (heavy); sources updated for next `npm run dist`.

## Safety

- Did not touch `/workspace/site/`.
- Auth, AES chat, pills, RU/CN/Проекты grouping, theme gear unchanged in behavior.
