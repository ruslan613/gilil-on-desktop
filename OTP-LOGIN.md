# Gilil On — Email OTP login

## What was added

### Backend (`server/src`)
- `mail.js` — SMTP/Gmail via nodemailer, or **MOCK** (console log) when no `GMAIL_*` / `SMTP_*`
- `auth.js` — `POST /api/auth/otp/request` · `POST /api/auth/otp/verify` (JWT same as password login)
- `db.js` — `users.email` column + `otp_codes` table; demo emails seeded (admin → `gililllight@gmail.com`)

### UI (`server/public/shell-v2.*`)
- Login gate: email → «Отправить код» → 6-digit code → «Войти» + 60s resend timer
- Demo enter kept as small secondary button

### Screenshot
`scrollbar-theme-shots/shell-ui/otp-login.png`

## Config (`.env`)
```
AUTH_OTP_MOCK=1
NODE_ENV=development
OTP_TTL_MIN=10
OTP_MAX_ATTEMPTS=5
OTP_RESEND_SEC=60
# Real mail (optional):
# GMAIL_USER=gililllight@gmail.com
# GMAIL_APP_PASSWORD=xxxx
```

## How to test (mock)

```bash
cd server && npm start   # needs Node 20 if better-sqlite3 was built for it

# 1) Request code — code is in JSON (dev/mock) and server console
curl -s -X POST http://127.0.0.1:8788/api/auth/otp/request \
  -H 'Content-Type: application/json' \
  -d '{"email":"gililllight@gmail.com"}'
# → {"ok":true,"mock":true,"code":"123456", ...}
# Server log: [otp:MOCK] gililllight@gmail.com → 123456

# 2) Verify → JWT
curl -s -X POST http://127.0.0.1:8788/api/auth/otp/verify \
  -H 'Content-Type: application/json' \
  -d '{"email":"gililllight@gmail.com","code":"123456"}'
# → { token, access_token, refresh_token, user }

# Other seeded emails: manager.ru@gililon.local, emp.ru1@gililon.local, …
```

Open UI: http://127.0.0.1:8788/shell-v2.html?lang=ru
