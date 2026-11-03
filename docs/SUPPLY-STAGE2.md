# Gilil On Desktop ↔ Gilil Supply Stage 2

Connects the Electron/desktop shell (**8788**) to the Stage 2 Supply server (**8797**) without touching live Supply **8787** or ALS.

## How to run both

```bash
export PATH="/home/box/.local/node-v20.19.5-linux-x64/bin:$PATH"

# 1) Stage 2 Supply (JWT / WS / AES / isolation / UI)
cd /workspace/artifacts/gilil_supply_stage2_server
npm start
# http://127.0.0.1:8797  ws://127.0.0.1:8797/ws

# 2) Gilil On Desktop server (existing features: bell, tray shell-v2, …)
cd /workspace/artifacts/gilil-on-desktop/server
npm start
# http://127.0.0.1:8788
```

Open shell → nav pill **Gilil Supply**. The section embeds `http://127.0.0.1:8797/` (change URL in the bar if needed; saved in `localStorage`).

Demo Supply logins: `admin/admin123`, `director/dir123`, `ru1/ru123`, `cn1/cn123`.

## What was added (desktop)

| File | Purpose |
|------|---------|
| `server/public/shell-v2.html` | Nav pill + `#sec-supply` iframe section |
| `server/public/shell-v2.js` | `setSection('supply')` hook + i18n keys |
| `server/public/shell-v2.css` | Embed layout |
| `server/public/supply-stage2.js` | Base URL helper / reload |
| `server/scripts/smoke-supply-stage2.js` | Desktop embed + isolation smoke |
| `docs/SUPPLY-STAGE2.md` | This doc |

Existing notifications bell, tray, shell-v2 chats on **8788** are unchanged. Desktop WS remains `/ws` on 8788; Supply realtime chat uses **8797** `/ws` inside the embed.

## Smoke

```bash
# Stage 2 only
cd /workspace/artifacts/gilil_supply_stage2_server && npm run smoke

# Desktop embed + Supply isolation (both servers up)
cd /workspace/artifacts/gilil-on-desktop/server && npm run smoke:supply
```

## Isolation (Supply)

- RU sees only RU + shared(member) projects/storage; no CN prices.
- CN sees only CN + shared; no RU prices.
- Admin/director see all (director == admin for Stage 2 ops visibility).
