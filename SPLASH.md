# Gilil On — Splash screen

## Themes (splash map)
Только **dark | bitrix | cyan**. Legacy: `beige`→bitrix, `blue`→cyan; иное → **dark**.

| theme | bg | accent |
|-------|-----|--------|
| dark | `#0c0a08` | brass `#a8875a` / `#d9c39c` |
| bitrix | `#F8FAFB` | `#006AC4` / `#1A8AD4` / deep `#004E91` |
| cyan | `#0F172A` | `#2FC6F6` / `#0891b2` / ink `#042f3a` |

Labels: «Битрикс24 · светлая», «Мобильная · Cyan».

## Files
- `server/public/splash.css` + `splash.js`
- `server/public/themes.css` — `dark` / `bitrix` / `cyan` (+ legacy beige/blue)
- `splash-electron.html` + `main.js` (`createSplashWindow`)
- `mobile-iphone.html` / `mobile-android.html`

## Check
```bash
cd server && node src/index.js
# http://127.0.0.1:8788/shell-v2.html?theme=bitrix
# http://127.0.0.1:8788/shell-v2.html?theme=cyan
# ?nosplash=1
npm start   # Electron native splash → main
```
