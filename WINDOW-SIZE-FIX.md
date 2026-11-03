# WINDOW-SIZE-FIX + two-tier menu — Gilil On 1.1.0

Дата: 2026-10-31 (Asia/Hong_Kong)

## Причина (окно «огромное»)

На `ready-to-show` вызывался `mainWindow.maximize()` → окно сразу на весь монитор.
Даже при расчёте ~85–92% `workArea` maximize делал его «огромным».

## Окно (`main.js`)

- `getDisplayNearestPoint(cursor).workArea`, ~85% + ~4% inset, center
- **Нет `maximize()` на старте** — `setBounds` + `show`; maximize только кнопкой
- min ~900×600 (clamp к workArea)

## Двухэтажное меню (`shell-v2`)

- Этаж 1: Команда RU / CN / Проекты / Личная / CRM / Медиа / Почта / Ещё (одна строка, overflow-x + wheel)
- Этаж 2: подкатегории выбранного раздела (секции)
- `appbar` max-height ~96px — не давит на чат
- wheel: horizontal scroll + stopPropagation

## ТВ / тема / таймеры

- `crm-tv.html`: early `data-theme`, `themes.css`, sync postMessage/`gilil:tv-ready`
- Dark B2B = `gilil_theme=dark`
- TV deadline countdown live; funnel step ⏱ from `started_at`

## Скриншоты

`screenshots/menu-two-tier.png`, `window-workarea.png`, `theme-tv-chat-news.png`, `fab-tasks.png`, `menu-wheel-scroll.png`

## Сборка

`npm run dist` → `dist/GililOn-1.1.0-win.exe`
