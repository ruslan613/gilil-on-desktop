# Gilil On — brand colors (shell-v2)

Applied: 2026-10-31 (Asia/Hong_Kong). Sources for brand hex: Gilil Lighting site
`/workspace/site/assets/css/style.css` and `gilil-app/src/theme.ts`
(warm charcoal + champagne brass). `gilil_lighting_from_pdf` has no palette CSS.

## Before → after (default / `data-theme="dark"`)

| Token | Before | After | Role |
|-------|--------|-------|------|
| `--bg` | `#0b0f14` | `#0c0a08` | page background (warm near-black) |
| `--bg-elev` | `#111827` | `#14110e` | header / elevated |
| `--bg-card` | `#151c27` | `#1a1612` | cards (≈ gold-stage `#1f1b18`) |
| `--bg-card-2` | `#1a2332` | `#221c17` | nested cards |
| `--line` / `--line-soft` | `#243044` / `#1e293b` | `#3a3228` / `#2a241c` | borders |
| `--ink` | `#e5e7eb` | `#f1e6d4` | primary text (cream) |
| `--muted` / `--muted-2` | `#94a3b8` / `#64748b` | `#b9ad9c` / `#8b7d6e` | secondary |
| `--accent` / `--teal` | `#14b8a6` | `#a8875a` | brass structure (tabs, links, marks) |
| `--accent-hot` | `#2dd4bf` | `#d9c39c` | brass light (active text) |
| `--teal-deep` | `#0f766e` | `#86683f` | brass dark |
| `--cta` / `--orange` | `#f59e0b` | `#a8875a` / `#c4a574` | CTA / warm brass |
| `--cta-hot` / `--orange-hot` | `#fb923c` | `#d9c39c` / `#e0c898` | CTA hover |

Brand reference (site light palette, used for `beige` theme):
`--bg #f7f3ed`, `--ink #2b2622`, `--brass #a8875a`, `--brass-d #86683f`, `--brass-l #d9c39c`.

## Files changed

- `server/public/shell-v2.css` — `:root` tokens; hardcoded teal/orange → `var(--*)` / `color-mix`; dark/amber/beige swatches
- `server/public/themes.css` — `dark` (default), `amber` (brighter gold on warm charcoal), `beige` (brand light)
- `BRAND-COLORS.md` — this note

Not changed: theme switcher IDs (`dark|beige|blue` only; legacy CSS may remain), `shell-v2.html` / JS, other theme presets (blue/green/teal/purple/mafia keep their looks). No exe rebuild.

## Contrast

Cream text `#f1e6d4` on `#0c0a08` / `#1a1612`; brass `#a8875a`–`#d9c39c` accents on dark cards; CTA ink `#1c1814` on brass buttons.
