# JOURNAL-ACL — «Журнал» только для general_admin

Дата: 2026-10-31 (Asia/Hong_Kong)

## Было

| Слой | Поведение |
|------|-----------|
| UI `shell-v2` | Пункт «Журнал» (`data-section="activity"`) виден всем демо-ролям (Админ / Директор / RU / CN). Страница грузит `GET /api/activity`. |
| ACL `canSeeActivity` | `isDirectorLike` → `general_admin` **или** `director` **или** `manager`. |
| API | `GET /api/activity`, `/api/activity/sessions`, `/api/activity/summary` — 403 только для `employee`; директор/менеджер видели журнал (менеджер — по подчинённым через `visibleUserIds`). |
| `POST /api/activity/heartbeat` | Для всех авторизованных (запись своей активности) — без изменений по смыслу. |

Итог: раздел и данные журнала были доступны не только владельцу (general_admin / gililllight@gmail.com), но и Директору / менеджерам RU·CN.

## Стало

| Слой | Поведение |
|------|-----------|
| UI | Нав «Журнал» (`#pill-activity`) скрыт, если демо-роль ≠ `admin` (JWT `general_admin`). Прямой переход на секцию уводит на «Личное». |
| ACL `canSeeActivity` | Только `isGeneralAdmin` (`role === 'general_admin'`). |
| API read | Те же три GET → **403** `activity_forbidden`, если JWT role ≠ `general_admin`. |
| Heartbeat | Без смены: любой авторизованный пишет свою активность (журнала не читает). |

## Файлы

- `server/src/acl.js` — `canSeeActivity`
- `server/src/activity.js` — комментарий к маршрутам
- `server/public/shell-v2.html` — `id="pill-activity"`, подпись
- `server/public/shell-v2.js` — `isActivityJournalRole` / `applyActivityRoleUI`
- `server/scripts/smoke.js` — director 403, admin 200
- `server/README.md` — строка про `/api/activity`

Exe **не** пересобирался.
