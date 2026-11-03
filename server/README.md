# Gilil On — Stage 2 Server

Серверная часть этапа 2 для desktop-клиента `gilil-on-desktop`.

- Node.js + Express + **WebSocket** (`/ws`) — realtime чаты
- **AES-256-GCM** шифрование сообщений RU↔CN (`MESSAGE_KEY`)
- **JWT-роли**: `general_admin` / `director` / `manager` / `employee` (+ регион `RU|CN|ALL`)
- **SQLite** (better-sqlite3): users, chats, messages, tasks, invoices, projects, activity_log, reply_status, order_funnel, usefulness_scores, login_attempts, login_ips, notifications, hack_attempts

## Быстрый старт

```bash
cd /workspace/artifacts/gilil-on-desktop/server
cp .env.example .env   # уже есть .env для dev

# Node 20 рекомендуется (ABI better-sqlite3)
export PATH="/home/box/tools/node20/bin:$PATH"   # на этой машине
npm install
npm start
# → http://localhost:8788  ws://localhost:8788/ws
```

Smoke (сервер должен быть запущен):

```bash
npm run smoke
# ожидание: SMOKE_OK stage2
```

## Demo users (seed)

| username     | password  | role           | region |
|--------------|-----------|----------------|--------|
| admin        | admin123  | general_admin  | ALL    |
| director_ru  | dir123    | director       | RU     |
| director_cn  | dir123    | director       | CN     |
| manager_ru   | mgr123    | manager        | RU     |
| emp_ru1      | emp123    | employee       | RU     |
| emp_ru2      | emp123    | employee       | RU     |
| emp_cn1      | emp123    | employee       | CN     |

Подчинённость: `emp_ru*` → `manager_ru` → `director_ru` → `admin`; `emp_cn1` → `director_cn` → `admin`.

## Ключевые API

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/health` | health |
| POST | `/api/auth/login` | JWT + rate limit + IP tracking |
| GET | `/api/chats` | список чатов + badge reply_status |
| POST | `/api/chats/:id/messages` | отправка (AES-256 в БД) |
| WS | `/ws?token=` | realtime сообщения / reply_status / notifications |
| POST | `/api/tasks/from-chat` | P0: задача из `messageId` + `assignee_id` |
| GET | `/api/search?q=` | P0 ⌘K: chats/tasks/invoices/projects |
| PUT | `/api/reply-status` | пресеты read/replied/in_progress/done |
| GET/POST | `/api/funnels` | воронка заказа |
| PATCH | `/api/funnels/:id/steps/:step` | статус + assignee шага |
| GET | `/api/activity` | журнал (только general_admin) |
| GET | `/api/usefulness` | коэффициент полезности (не для employee) |
| POST | `/api/usefulness/:userId/override` | правка директора |
| GET | `/api/security/hack-attempts` | только general_admin |

## Env

См. `.env.example`: `PORT`, `JWT_SECRET`, `MESSAGE_KEY` (64 hex), `DATABASE_PATH`, `LOGIN_RATE_MAX`, `LOGIN_RATE_WINDOW_MIN`.

## Структура

```
server/
  package.json
  .env.example
  README.md
  scripts/smoke.js
  src/
    index.js          # HTTP + WS entry
    db.js             # schema + seed
    crypto.js         # AES-256-GCM
    acl.js            # роли / регионы
    auth.js           # JWT, rate limit, login_ips
    chat.js           # REST + WebSocket
    tasks.js          # задачи + from-chat
    search.js         # ⌘K aggregator
    replyStatus.js    # быстрые ответы директору
    funnel.js         # воронка заказа
    activity.js       # журнал / сессии
    usefulness.js     # коэффициент полезности
    notifications.js  # колокольчик + IP-change alerts
  data/               # SQLite (gitignore)
```
