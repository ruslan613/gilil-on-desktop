# Gilil On desktop — SMTP / OTP fix result

**Scope:** `/workspace/artifacts/gilil-on-desktop/` only (Supply / `/workspace/site/` untouched)  
**Server:** `127.0.0.1:8788`  
**Recheck / fix window:** 2026-11-02 **23:28–23:31** Asia/Hong_Kong (UTC+8)

---

## 1) Server status

| Item | Value |
|------|--------|
| Process | **ALIVE** — Node 20 `src/index.js`, pid listening on `127.0.0.1:8788` |
| Restart | **2026-11-02 23:30:31 Asia/Hong_Kong** after `.env` update |
| Log | `/tmp/gilil-on-8788.log` |
| **mail mode (post-restart)** | **`smtp-gmail`** (was `mock` before restart) |

---

## 2) What was written / changed

### `.env` (`server/.env`) — secrets redacted
| Key | Action |
|-----|--------|
| `AUTH_OTP_MOCK` | kept `0` |
| `SMTP_ALLOWLIST_ENFORCE` | kept `1` |
| `GMAIL_USER` | `gililllight@gmail.com` |
| `SMTP_FROM` | `Gilil On <gililllight@gmail.com>` (enabled) |
| `GMAIL_APP_PASSWORD` | **SET from on-disk** `/workspace/artifacts/gmail_app_password.txt` (len=16) — value not logged |
| `GMAIL_CLIENT_ID` | **SET from on-disk** `/workspace/artifacts/gmail_oauth_client.json` (len=72) |
| `GMAIL_CLIENT_SECRET` | **SET from same JSON** (len=35) |
| `GMAIL_REFRESH_TOKEN` | **EMPTY** — **no real refresh token found on disk**; not invented |

Backup of pre-fix `.env`: `server/.env.env.bak-pre-smtp-fix` (pre-secret state).

### DB users (choice documented)
| User | email | role | Notes |
|------|-------|------|--------|
| `admin` (id=1) | `gililllight@gmail.com` | general_admin | **Kept** — mailbox / Gmail login path unchanged |
| **`ruslan` (id=8)** | **`Ruslan@light-Industry.com`** | general_admin | **Inserted** so OTP to Industry address resolves to an active user |

Password hash for `ruslan` copied from seeded `admin` (dev parity). No allowlist rows changed.

### Allowlist (`smtp_senders_allowlist`) — unchanged, still active
| id | email | active |
|----|-------|--------|
| 1 | `gililllight@gmail.com` | 1 |
| 2 | `Ruslan@light-Industry.com` | 1 |

### Not changed
- No Supply / `/workspace/site/` edits  
- No invented OAuth refresh token  
- No credential commit to git

---

## 3) Disk secret search (refresh token)

Searched under `/workspace/artifacts` (incl. gilil-on-desktop + supply env/pending JSON), agent-data, bot store.

| Artifact | Result |
|----------|--------|
| `gmail_app_password.txt` | present → wired into `.env` |
| `gmail_oauth_client.json` | present (client id/secret) → wired |
| `GMAIL_REFRESH_TOKEN` anywhere non-empty | **NOT FOUND** (only empty env lines / test placeholder `rtoken` in unit script/diff) |
| Supply `gmail_oauth_pending.json` | auth URL pending only — **no refresh_token** |

---

## 4) OTP test results (after smtp-gmail restart)

| To | HTTP | Body | Delivered? |
|----|------|------|------------|
| `gililllight@gmail.com` | **502** | `{"error":"mail_send_failed"}` | **No** |
| `Ruslan@light-Industry.com` | **502** | `{"error":"mail_send_failed"}` | **No** |

**Log (exact):**
```text
[otp] sendMail failed Client network socket disconnected before secure TLS connection was established
```
(repeated for both addresses; ×4 in log after retries/parent checks)

- Mode is **not** mock anymore (`smtp-gmail`).  
- App Password **is** configured; nodemailer attempts live SMTP.  
- Failure is **TLS egress** to `smtp.gmail.com` on this box (TCP connects; secure handshake EOF / socket disconnect). DNS class `198.18.0.x` sink behaviour previously observed.

---

## 5) Root cause (current)

1. **Config gap closed for SMTP App Password path** — was mock due to missing creds; now `smtp-gmail`.  
2. **Delivery still blocked** by **SMTP TLS network restriction** on this host → App Password cannot complete handshake.  
3. **Preferred fix path = Gmail API (`gmail-api`)** over HTTPS, which needs **`GMAIL_REFRESH_TOKEN`**. Client id/secret already in `.env`; refresh token **still missing**.

Secondary (fixed): Ruslan Industry address was allowlisted but had **no** `users.email` → OTP returned `unknown_or_inactive_email`. Now bound to user `ruslan` id=8.

---

## 6) What remains for Ruslan

1. **Run once** (on a machine/browser he controls), from `server/`:
   ```bash
   node scripts/gmail-oauth-token.js
   ```
   Complete Google consent for `gililllight@gmail.com`, then put the printed  
   `GMAIL_REFRESH_TOKEN=...` into `server/.env` (do not invent/paste into chat if avoidable).
2. Restart Gilil On 8788; confirm log: **`mail mode=gmail-api`** (not `smtp-gmail` / `mock`).
3. Re-test `POST /api/auth/otp/request` for both:
   - `gililllight@gmail.com`
   - `Ruslan@light-Industry.com`  
   Expect HTTP 200 with `mock:false` and real inbox delivery.
4. Optional alternate: run the server on a network that can complete TLS to `smtp.gmail.com` — App Password path may then work without OAuth; on **this** box it currently cannot.

---

## 7) Fix status summary

| Goal | Status |
|------|--------|
| Leave mock | **Done** — now `smtp-gmail` |
| Wire on-disk App Password + OAuth client | **Done** |
| Bind `Ruslan@light-Industry.com` without wiping admin mailbox email | **Done** (`ruslan` id=8) |
| Live OTP delivery | **Blocked** — SMTP TLS; need **`GMAIL_REFRESH_TOKEN`** from Ruslan |
| Invent secrets | **Not done** (correctly refused) |

**Overall:** partial fix applied; **outbound OTP still fails until refresh token (gmail-api) or a network that allows Gmail SMTP TLS.**
