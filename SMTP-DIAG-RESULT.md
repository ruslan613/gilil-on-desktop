# Gilil On desktop — SMTP / OTP diagnosis

**Scope:** `/workspace/artifacts/gilil-on-desktop/` only  
**Server:** `127.0.0.1:8788` (pid listening, Node 20, log `/tmp/gilil-on-8788.log`)  
**When (initial):** 2026-11-02 ~23:25 Asia/Hong_Kong (UTC+8)  
**Recheck:** 2026-11-02 **23:28** Asia/Hong_Kong (UTC+8) — live re-verify complete  
**User context:** Ruslan Gilil — OTP/password mail not arriving on old desktop after system update

---

## 1) SMTP status

### Mode / enforce
| Item | Value |
|------|--------|
| **mail mode** | **`mock`** (confirmed at process start + live `mailMode()`) |
| `AUTH_OTP_MOCK` | `0` (not forced mock) |
| `SMTP_ALLOWLIST_ENFORCE` | **`1`** (fail-closed) |
| `GMAIL_USER` | `gililllight@gmail.com` |
| `GMAIL_APP_PASSWORD` / `GMAIL_PASS` | **absent** (line commented empty in `.env`) |
| OAuth `GMAIL_CLIENT_ID` / `SECRET` / `REFRESH_TOKEN` | **empty / missing** |
| Generic `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | **not set** |
| `SMTP_FROM` | not set (commented) |

Same picture in `.env.bak-oauth`: App Password never populated in this tree; OAuth slots empty. No secrets rotated or pasted.

### Allowlist (`smtp_senders_allowlist`)
| id | email | label | active | created_at (UTC) |
|----|-------|-------|--------|------------------|
| 1 | `gililllight@gmail.com` | mailbox / system | **1** | 2026-11-02 15:12:32 |
| 2 | `Ruslan@light-Industry.com` | генерал / general_admin | **1** | 2026-11-02 15:12:32 |

- Required pair **present and active=1** (exact casing for Ruslan address with hyphen + capital **I** in Industry).
- **No** wrong variants (`lightindustry.com`, `lightdevindustry.com`) in table.
- Seed log line: `[db] smtp_senders_allowlist seeded (gililllight@gmail.com, Ruslan@light-Industry.com)`.

### Admin / OTP destination users
| username | email | role | active |
|----------|-------|------|--------|
| admin | `gililllight@gmail.com` | general_admin | 1 |
| (others) | `*.@gililon.local` | director/manager/employee | 1 |

**No user row has `Ruslan@light-Industry.com`.** OTP for that address is treated as unknown email (no code stored/sent).

---

## 2) Log findings (recent / last hours)

**Active stdout:** `/tmp/gilil-on-8788.log` (process fd 1/2). Started ~2026-11-02 15:13 UTC.

Findings:
1. Startup: `mail mode=mock`
2. Earlier in same log: `[otp] sendMail failed Получатель не в белом списке SMTP: emp.ru1@gililon.local` — allowlist enforce correctly blocks non-listed demo local addresses (HTTP would be 403 `smtp_sender_not_allowed`).
3. After test OTP to admin: mock send logged with reason *почта не настроена (нет GMAIL_CLIENT_ID/SECRET/REFRESH_TOKEN, GMAIL_APP_PASSWORD, SMTP_PASS)*; code only in log (`086810`).
4. Older logs (`/tmp/gilil-on-server.log`, `/tmp/gilil-desktop-8788.log`, `/tmp/gilil-server.log`, `/tmp/gilil-otp-smoke.log`): historical OTP always **`[mail:MOCK]`** — no live SMTP success recorded for Ruslan or gililllight in this environment.
5. No Gmail auth/TLS connection errors in app logs (stack never leaves mock because creds missing).

---

## 3) Test send results

### A) App OTP API `POST /api/auth/otp/request`

| To | HTTP | Result |
|----|------|--------|
| `gililllight@gmail.com` | **200** | `ok:true`, **`mock:true`**, code returned in JSON (dev mock). **Not live-delivered** — console `[mail:MOCK]` only. |
| `Ruslan@light-Industry.com` | **200** | `ok:true`, **`mock:true`**, **`hint":"unknown_or_inactive_email"`** — **no sendMail call** (no active user with that email). |
| `ruslan@light-industry.com` | **200** | same unknown-email behaviour. |

### B) Direct `sendMail` (same `mail.js` + allowlist guard, `{ kind: 'otp' }`)

| To | Result |
|----|--------|
| `Ruslan@light-Industry.com` | Allowlist **OK**; send **`mock:true`**, reason: mail not configured (no OAuth / App Password / SMTP_PASS). **Not delivered.** |
| `gililllight@gmail.com` | Allowlist **OK**; same **mock** — **not delivered.** |
| `ruslan@lightindustry.com` (wrong) | **`smtp_sender_not_allowed`** — blocked as expected. |

**Do not claim live delivery** — only mock succeeded.

---

## 4) Root cause

**Primary:** Outbound mail is **unconfigured**. With `AUTH_OTP_MOCK=0` but no OAuth trio and no `GMAIL_APP_PASSWORD`/`SMTP_*`, `mailMode()` is **`mock`**. OTP codes never leave the server log/JSON — that matches “пароль/код не приходит на почту” after updates that left `.env` without secrets.

**Secondary (Ruslan address):** `Ruslan@light-Industry.com` is on the SMTP allowlist but **not** `users.email` for any account. Requesting OTP to that address returns success-looking JSON with `unknown_or_inactive_email` and **never sends**.

**Tertiary (environment):**
- MX for `light-Industry.com` / `light-industry.com`: **`10 emx.mail.ru.`** (domain mail OK at DNS).
- TCP to `smtp.gmail.com:587/465` appears open but **TLS handshake fails** (peer EOF / no cert; DNS sinks to `198.18.0.1`). Known class of cloud SMTP TLS/greeting blocks.
- **HTTPS** to `oauth2.googleapis.com` / `gmail.googleapis.com` responds (400/401 without creds) — **Gmail API OAuth path is the viable egress** once tokens are set; plain SMTP App Password may still fail on this host even after credentials are added.

Allowlist itself is **healthy** and not the cause for the two target addresses.

---

## 5) Fix proposal (concrete)

1. **Provision real send credentials** into `server/.env` (do **not** commit secrets):
   - Prefer **Gmail API OAuth2**: set `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` via `node scripts/gmail-oauth-token.js` (publish OAuth app or refresh Testing tokens every 7 days).
   - Or set **`GMAIL_APP_PASSWORD`** for `gililllight@gmail.com` (SMTP). On this box, re-test SMTP; if TLS still fails, rely on OAuth/API.
2. Keep `SMTP_ALLOWLIST_ENFORCE=1`; leave the two active allowlist rows as-is.
3. **Link login email:** set admin (or the real general user) `users.email` to `Ruslan@light-Industry.com` **or** keep login on `gililllight@gmail.com` and tell Ruslan to request OTP only to the address that exists in DB. Until then OTP to the Industry address will never send.
4. Restart server on 8788 after `.env` change; confirm log shows `mail mode=gmail-api` or `smtp-gmail` (not `mock`); re-run OTP request and confirm `[mail:gmail-api] sent` / `[mail] sent` without MOCK.
5. Optional: add demo `@gililon.local` addresses to allowlist **only** if local smoke OTP must work under enforce=1.

---

## 6) What was changed

**Nothing** (initial or recheck). No env secrets added, no credential rotation, no Supply / `/workspace/site/` touches, no DB/user edits. Diagnosis + this report only.

Recheck at **23:28 Asia/Hong_Kong** confirmed the same live state; OTP/direct test sends repeated (codes/logs only).

---

## Recheck notes (2026-11-02 23:28 Asia/Hong_Kong)

Live re-verify of process `pid=893823` (`node src/index.js`, cwd=`.../gilil-on-desktop/server`, stdout→`/tmp/gilil-on-8788.log`).

| Check | Result |
|-------|--------|
| `mailMode()` | **`mock`** (`AUTH_OTP_MOCK=0`; OAuth empty; `GMAIL_APP_PASSWORD` absent; no `SMTP_*`) |
| `SMTP_ALLOWLIST_ENFORCE` | **`1`** |
| Allowlist `gililllight@gmail.com` | id=1, active=**1** |
| Allowlist `Ruslan@light-Industry.com` | id=2, active=**1** |
| `users.email` for Ruslan@… | **none** (only admin=`gililllight@gmail.com`) |
| OTP API → gililllight | 200 `mock:true` code=`644838` — **not delivered** (MOCK log) |
| OTP API → Ruslan@light-Industry.com | 200 `mock:true` `hint=unknown_or_inactive_email` — **no sendMail** |
| Direct `sendMail` both targets | allowlist OK → **`mock:true`** reason «почта не настроена…» |
| Wrong `ruslan@lightindustry.com` | `smtp_sender_not_allowed` (expected) |
| MX `light-Industry.com` | `10 emx.mail.ru.` (DoH) |
| TLS `smtp.gmail.com:465` | TCP open, **TLS EOF fail** (198.18 sink) |
| Config/DB changes this pass | **none** |

Prior root cause + fix proposal unchanged. No secrets written.

