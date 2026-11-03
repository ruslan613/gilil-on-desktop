# Отчёт: серверная часть этапа 2 Gilil On

**Путь:** `/workspace/artifacts/gilil-on-desktop/server/`  
**Дата:** 2026-10-31 (Asia/Hong_Kong)  
**Smoke:** `SMOKE_OK stage2` (health + login + search + create-task-from-chat + reply/funnel/usefulness/activity)

## Запуск

```bash
cd /workspace/artifacts/gilil-on-desktop/server
export PATH="/home/box/tools/node20/bin:$PATH"
npm install && npm start
# http://localhost:8788  ws://localhost:8788/ws
npm run smoke
```

Demo: `admin/admin123`, `director_ru|cn/dir123`, `manager_ru/mgr123`, `emp_ru1|emp_ru2|emp_cn1/emp123`

## Файлы

| Файл | Назначение |
|------|------------|
| `package.json` | зависимости Express/ws/better-sqlite3/jwt/bcrypt |
| `.env.example` / `.env` | PORT=8788, JWT_SECRET, MESSAGE_KEY |
| `README.md` | как запустить + API |
| `scripts/smoke.js` | smoke health/login/search/from-chat |
| `src/index.js` | HTTP + WebSocket entry |
| `src/db.js` | схема SQLite + seed |
| `src/crypto.js` | AES-256-GCM |
| `src/acl.js` | роли / регионы / видимость |
| `src/auth.js` | JWT, rate limit, login_ips, hack_attempts |
| `src/chat.js` | REST чаты + WS realtime |
| `src/tasks.js` | задачи + POST /api/tasks/from-chat |
| `src/search.js` | GET /api/search (⌘K) |
| `src/replyStatus.js` | пресеты ответов директору |
| `src/funnel.js` | воронка заказа |
| `src/activity.js` | журнал / сессии |
| `src/usefulness.js` | коэффициент полезности |
| `src/notifications.js` | уведомления + IP-change |

## Статус по 12 пунктам

| # | Требование | Статус | Как |
|---|------------|--------|-----|
| 1 | Node.js + WebSocket realtime чаты | ✅ | `src/chat.js` + `ws` на `/ws` |
| 2 | AES-256 сообщений RU↔CN (MESSAGE_KEY) | ✅ | `src/crypto.js` AES-256-GCM; в БД только ciphertext/iv/tag |
| 3 | JWT-роли general_admin / director\|manager / employee | ✅ | `acl.js` + JWT claims role+region; менеджеры — подчинённые + цены своего региона |
| 4 | SQLite: users, chats, messages, tasks, invoices, projects, activity_log, reply_status, order_funnel, usefulness, login_attempts, login_ips | ✅ | `db.js` migrate + seed |
| 5 | P0 задача из чата (messageId + assignee) | ✅ | `POST /api/tasks/from-chat` и `POST /api/tasks` с `messageId` |
| 6 | P0 ⌘K GET /api/search?q= | ✅ | chats/tasks/invoices/projects, ACL по ролям/региону |
| 7 | Быстрые ответы директору + badge в list chats | ✅ | пресеты read/replied/in_progress/done; badge в `GET /api/chats` |
| 8 | Воронка заказа 5 шагов + status/assignee | ✅ | read→suppliers→spec→price_compare→sent_client |
| 9 | Журнал активности (этап/сессии/действия) | ✅ | director/general_admin; managers — subordinates; employee — 403 |
| 10 | Коэффициент полезности (auto + override + alerts) | ✅ | панель `/api/usefulness`; employees 403 |
| 11 | Security: ACL каждый запрос, rate limit входа, hack log | ✅ | middleware + login_attempts + hack_attempts |
| 12 | Смена IP входа → notify admins | ✅ | `login_ips` + `notifications` type `login_ip_change` |

## Что работает

- Сервер слушает **8788** (8790 занят sand-egress на этой машине).
- Smoke полный зелёный.
- Seed-данные: чаты RU↔CN, проект «ЖК Фрунзенский», воронка ORD-2026-001, счета RU/CN.

## Что осталось / вне scope

- UI desktop/shell не трогался (только server/).
- Geo IP — заглушка через опциональное поле `geo` в login body (без внешнего geo-API).
- Не интегрирован как drop-in замена `gilil-supply-server` (отдельный чистый Stage 2 сервер с новой ролевой моделью).
