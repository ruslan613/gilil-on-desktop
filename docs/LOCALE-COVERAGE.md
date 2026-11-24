# Locale coverage (isolated Chrome, not the installed Windows app)

Walked `shell-v2.html` and the standalone pages it opens. Languages: `?lang=ru|en|zh`, then a live switch on the shell. Demo chat sentences in `THREADS` were not rewritten. System notification titles are translated at display time; stored rows are not updated.

`delete supply` is still unresolved. Search of `*.js`, `*.html`, `*.css`, `*.json`, and `*.md` found no such control. Nothing was invented.

`server/public/tenders-dashboard.html` and `server/public/crm.html` are not in the repository. The shell and news links open `shell-v2.html?section=tenders` and `?section=crm` instead. Those two sections became active in the isolated browser for ru, en, and zh.

| Route | RU | EN | ZH | Evidence | Blocker |
|---|---|---|---|---|---|
| Shell · chats | rendered | rendered | rendered | Walk: «Выберите диалог слева», «Select a chat on the left», «请选择左侧对话» | Demo message bodies in a thread stay the stored fixture text |
| Shell · personal | rendered | rendered | rendered | «Личная» / «Personal» / «个人» | Demo company «Гелин» and person names stay as names |
| Shell · tasks-plans | rendered | rendered | rendered | «Задачи и планы» / «Tasks & plans» / «任务与计划» | — |
| Shell · calendar | rendered | rendered | rendered | «Ноябрь 2026» / «November 2026» / «十一月 2026». Date dialog `24.11.2026` | — |
| Shell · tenders | rendered | rendered | rendered | `?section=tenders` active. «Тендеры» / «Tenders» / «招标» | — |
| Shell · leads | rendered | rendered | rendered | Empty/error: «нужен вход» / «sign-in required» / «需登录» | No signed-in lead list in this run |
| Shell · mail | rendered | rendered | rendered | «Писем нет» path uses `mail.empty`. Chrome: «Почта» / «Mail» / «邮件» | No mailbox without a token |
| Shell · news | rendered | rendered | rendered | Embed bar «Новости» / «News» / «新闻» | The iframe is the news page below |
| Shell · storage | rendered | rendered | rendered | «Моё хранилище» / «My storage» / «我的存储» | Folder codes `client_order` stay as stored kinds |
| Shell · CRM | rendered | rendered | rendered | `?section=crm` active. «CRM» kept. Demo cards translated | — |
| Shell · Supply | rendered | rendered | rendered | «Gilil Supply» plus «Этап 2» / «Stage 2» / «第二阶段», «Обновить» / «Reload» / «刷新» | Frame `127.0.0.1:8797` is not this repo; the frame body was not a Gilil page |
| Shell · mail statistics | markup | markup | markup | DOM text «Статистика почты» / «Mail statistics» / «邮件统计» | Demo role is not admin/director, so opening redirects away |
| Shell · journal | markup | markup | markup | «Журнал» / «Activity log» / «活动日志» and «Нужен вход» / «Sign-in required» / «需要登录» | Demo role is not admin, so opening redirects away |
| Shell · funnel | rendered | rendered | rendered | Error «Нужен вход.» / «Sign-in required.» / «需要登录。» | No funnel rows without a token |
| Shell · usefulness | rendered | rendered | rendered | Same sign-in error, headings translated | — |
| Shell · director | rendered | rendered | rendered | «Директор · нагрузка сотрудников» / «Director · team workload» / «总监 · 员工负荷» | — |
| Shell · TV | rendered | rendered | rendered | «TV-экран CRM» / «CRM TV screen» / «CRM TV 大屏». SRM name kept on the TV page | Preview iframe needs the TV page |
| Shell · settings | rendered | rendered | rendered | «Студия освещения», «Lighting studio», «照明工作室». Badge «новое» / «new» / «新» | Mail statistics and journal stay hidden for this role |
| Shell · login gate | static | static | static | Same document, `data-i18n` on the form, `?lang=` applied before the shell is shown | No separate login screenshot in this walk |
| News page | rendered | rendered | rendered | «Новости» / «News» / «新闻» and the lead under the title | Feed request has no items here; status is the localized loading/empty line |
| SRM TV page | rendered | rendered | rendered | «воронка тендеров» / «tender funnel» / «招标漏斗». Clock follows the language (`11月24日周二`, `Tue, Nov 24`) | `/api/tv` is absent here, so the error is the localized unavailable line |
| AI Lighting Studio | rendered | rendered | rendered | Page title stays **AI Lighting Studio**. Lead is translated | List needs a token; the sign-in card is translated |
| Splash | static | static | static | `splash.sub` is in the dictionary and `applyLang` updates `[data-i18n]` | Splash is removed as soon as the shell is shown; not held on screen |

## Not product routes

`server/public/_diag-crm-tv.html` and `server/public/app-v2.js` are not linked from the shell. They were not treated as screens.

## Left unchanged on purpose

- Conversation text in `THREADS` and voice samples that stand in for something a person said.
- Person names, initials, and the demo company name.
- Product names Gilil On, Gilil Supply, and the page title AI Lighting Studio.
- Acronyms CRM and SRM.
- Notification rows already stored in a database. The client maps the known system titles «Новый IP входа», «Новая задача», «Новая задача из чата», and «Эскалация · пропуск плана» when it draws them. It does not rewrite those rows.
