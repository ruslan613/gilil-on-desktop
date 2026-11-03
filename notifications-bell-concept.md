# Единый колокольчик уведомлений — Gilil On

Дизайн-концепт для shell-v2 (макет 2): тёмная B2B-тема, pill-навигация сверху, чаты слева.

**Артефакты:** `notifications-bell-mockup.html` (1920×1200) · `notifications-bell-mockup.png`

---

## 1. Куда ставить колокольчик

**Точное место в appbar (справа), порядок элементов:**

`… pills | lang-switch | role-switch | theme-gear ⚙ | **🔔 bell** | userchip`

- **После** кнопки темы (`#btn-theme-gear` / `.theme-popover-wrap`).
- **Перед** `.userchip` (аватар + имя).
- **Не** внутри `.pills` — pills уже заняты секциями и бейджами (задачи/лиды/почта); колокольчик — глобальный inbox, не пункт навигации.
- Стиль кнопки как у `.theme-gear`: 34×34, radius 10, border `--line`; при открытой панели — teal active (`--teal-dim` / border `--teal`), как у активного gear.
- Красный бейдж (`--red`, pulse) в правом верхнем углу кнопки; число = сумма unread; `99+` при переполнении; скрывать при 0.

Вставка в разметку (концепт, не патч production):

```html
<div class="notif-wrap" id="notif-wrap">
  <button type="button" class="bell-btn" aria-expanded="false" aria-haspopup="true" title="Уведомления">
    <!-- SVG bell -->
    <span class="bell-badge" hidden>0</span>
  </button>
  <div class="notif-panel hidden" role="dialog" aria-label="Уведомления">…</div>
</div>
```

---

## 2. Выпадающая панель

| Параметр | Значение |
|----------|----------|
| Ширина | ~360px |
| Позиция | `absolute`, `top: calc(100% + 10px)`, `right: 0` относительно `.notif-wrap` |
| Фон | `--bg-elev`, border `--line`, radius 16, shadow как theme-popover |
| Заголовок | «Уведомления» + действие «Прочитать все» |
| Фильтры-табы | Все · Сообщения · Задачи · Счета (счётчики unread на табах) |
| Карточка | аватар/иконка типа · кто · что (1 строка) · relative time · unread-точка |
| Клик по пункту | открыть целевой раздел (чат / задача / CRM-счёт / лид / письмо) + отметить прочитанным |
| Пусто | иконка колокольчика + «Пока тихо» + короткий подзаголовок |

Типы иконок/акцентов: message → teal; task → orange; invoice → blue; lead → purple; mail → slate.

---

## 3. Поведение

### Electron / Windows
- При окне в фокусе — только in-app бейдж + панель (без системного шума).
- Когда окно **свёрнуто** или **не в фокусе**: system tray icon (badge на иконке трея) + **Windows toast** (Notification API / Electron `Notification`) с кратким текстом «кто · что»; клик по toast → фокус окна + переход к сущности.
- Трей: ПКМ — «Открыть Gilil On», «Прочитать все», «Выключить звук».

### Звук
- Короткий soft chime на новое unread (не на каждое сообщение в уже открытом чате).
- Mute в настройках (тема/шестерёнка или Личная): `notif.sound = on|off`, хранить в `localStorage` / user prefs.

### Группировка
- По типу: `message` | `task` | `invoice` (+ опционально `lead`, `mail` в «Все»).
- Фильтр-табы режут список; бейдж на колокольчике всегда = сумма unread всех типов.

### Прочитано
- Клик по карточке → `read` + навигация.
- «Прочитать все» → все visible (с учётом фильтра) → `read`; бейдж пересчитывается.
- Unread-точка (teal) слева от времени; без точки = прочитано.

### Источники (кратко)
| Источник | Тип | Куда ведёт клик |
|----------|-----|-----------------|
| Чаты (RU / CN / проекты) | message | секция Чаты → диалог |
| Задачи / согласование счетов | task | Личная → задача / workflow |
| Счета / PI от CN | invoice | CRM → карточка / вложение |
| Заявки с сайта | lead | Заявки / CRM |
| Почта | mail | Почта → тред |

---

## 4. Вне скоупа этого концепта

- Не менять production `shell-v2.js` / `shell-v2.html` / `shell-v2.css` — только артефакты в `gilil-on-desktop/`.
- Реализация API/WebSocket и Electron tray — отдельный тикет после утверждения UI.

---

## 5. Визуальные токены (из shell-v2)

`--bg #0b0f14` · `--bg-elev #111827` · `--bg-card #151c27` · `--teal #14b8a6` · `--orange #f59e0b` · `--red #ef4444` · radius 12–16 · font Segoe UI / Inter.
