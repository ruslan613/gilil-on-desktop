# NEWS-CHANNEL — диагностика канала «Новости» (Gilil On Desktop)

**Дата:** 2026-10-31 (Asia/Hong_Kong)  
**Репозиторий:** `/workspace/artifacts/gilil-on-desktop/`

## Как устроено

| Слой | Что |
|------|-----|
| UI shell | `server/public/shell-v2.html` → секция `#sec-news` |
| Загрузка UI | `<iframe src="/news.html?embed=1">` (+ ссылка «открыть news.html») |
| Страница | `server/public/news.html` — карточки, фильтры kind |
| API | `GET /api/public/tender-news?limit=20&kind=` (без auth) |
| Данные | SQLite таблица `tender_news` |
| Модуль | `server/src/news.js` → монтируется в `src/index.js` |
| Не RSS | Внешнего RSS нет; лента = парсер тендеров (`tenders:fetch` в supply-server) |

Эталон рабочей реализации: `gilil-supply-server` (порт **8787**), те же `news.html` + `/api/public/tender-news`.

## Что было сломано

1. **В desktop-сервере отсутствовал `public/news.html`** (есть только shell-v2 / app-v2).  
   iframe и ссылка указывали на `/news.html` → **HTTP 404**.
2. **Не было эндпоинта** `/api/public/tender-news` и таблицы `tender_news` в Stage 2 DB.  
   Даже при наличии HTML fetch падал бы.
3. CORS / ключ / таймаут **не** были причиной: CORS уже `app.use(cors())` → `Access-Control-Allow-Origin: *`; ключа API нет (public endpoint).

### Что видел пользователь

- Вкладка «Новости»: **пустой iframe** (страница 404 Express: `Cannot GET /news.html`).
- Если бы HTML был, а API нет: в `#status` текст **`Ошибка загрузки: …`** (из `news.html` catch), либо Failed to fetch.
- Пустая БД при живом API: **`Пока нет новостей — запустите npm run tenders:fetch`** / «Нет записей».

### Проверка источника (curl)

До фикса (desktop 8788): `/news.html` — нет сервера / 404; API — отсутствует.  
Эталон (supply 8787): `/news.html` **200**, `/api/public/tender-news?limit=3` **200** `ok:true`, items есть.

После фикса (desktop **8788**):

```text
GET /news.html                     → 200 (8494 bytes)
GET /news.html?embed=1             → 200
GET /api/public/tender-news?limit=10 → 200 {"ok":true,"count":4,...}
Access-Control-Allow-Origin: *
```

## Что исправлено

1. Скопирован `news.html` → `server/public/` (+ dist unpack).
2. Добавлены `server/src/news.js` + `mountNewsRoutes(app)` в `index.js`.
3. В `db.js`: таблица `tender_news` + `seedNews()` (4 демо-карточки, если таблица пуста).
4. iframe: `/news.html?embed=1` (скрывает лишний chrome во вложении).
5. Синхронизированы файлы в `dist/win-unpacked/resources/server/`.

## Следующий шаг (не в этом фиксе)

- Подтянуть **живой** поток: скрипт `tenders:fetch` / общая БД с `gilil-supply-server`, либо прокси desktop → supply `/api/public/tender-news`.
- Опционально: `tender_projects` + поле `project` в ответе (сейчас всегда `null`).
- Пересобрать Windows portable (`npm run dist`), чтобы артефакт exe включил новые файлы (сейчас правки в source + win-unpacked resources).

## Файлы

- `server/public/news.html`
- `server/src/news.js`
- `server/src/db.js` (migrate + seedNews)
- `server/src/index.js` (mount)
- `server/public/shell-v2.html` (iframe embed)
