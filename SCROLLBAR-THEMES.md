# Gilil On — 3 UI themes

Switcher offers **exactly 3**: `dark` | `bitrix` | `cyan`.  
Unknown / legacy ids (`beige`, `blue`, green, amber, …) migrate or fall back: **beige→bitrix**, **blue→cyan**, else **dark**.

Tokens live in `server/public/themes.css` (`html[data-theme="…"]`).

| Theme | Role | bg / elev | accent | scrollbar thumb / track |
|-------|------|-----------|--------|-------------------------|
| **dark** | brand brass | `#0c0a08` / `#14110e` | `#a8875a` / hot `#d9c39c` | brass / charcoal |
| **bitrix** | Bitrix24 light | `#F8FAFB` / `#FFFFFF` | `#006AC4` / hot `#1A8AD4` | `#006AC4` / `#EDEEF0` |
| **cyan** | mobile-iphone | `#0F172A` / `#111827` | `#2FC6F6` / hot `#67e8f9` | cyan / slate `#0F172A` |

## Why cyan (not blue)

`mobile-iphone.html` is the product mobile mock: slate surfaces + brand GililOn cyan **`#2FC6F6`** (icons too). Old UI `blue` (`#3b82f6`) was a generic Bitrix-ish accent and did not match the phone mock. Cyan replaces blue in the switcher; CSS may keep a dead `blue` alias → cyan.

## Why bitrix (not beige)

Light mode is the corporate Bitrix24 look (white/grey plate, accent `#006AC4`, muted `#525C69`) — not warm beige/brass. Legacy `beige` migrates to `bitrix`.

## Shots

`scrollbar-theme-shots/shell-ui/`:

- `shell-ui-dark.png`
- `shell-ui-bitrix.png`
- `shell-ui-cyan.png`
- `shell-ui-mobile-iphone.png` (optional mock)

Retired PNGs: `_archive/` (`beige`, `blue`, …).

## Check

```bash
cd server && node src/index.js
# http://127.0.0.1:8788/shell-v2.html?theme=dark
# http://127.0.0.1:8788/shell-v2.html?theme=bitrix
# http://127.0.0.1:8788/shell-v2.html?theme=cyan
# ?nosplash=1 to skip overlay
```
