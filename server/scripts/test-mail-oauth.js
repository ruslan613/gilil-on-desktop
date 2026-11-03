'use strict';
// Offline tests for src/mail.js (Gmail API via OAuth2). Stubs global fetch; no network.
const assert = require('assert');

for (const k of ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN', 'GMAIL_USER',
  'GMAIL_APP_PASSWORD', 'GMAIL_PASS', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM', 'AUTH_OTP_MOCK']) delete process.env[k];

const mail = require('../src/mail');
const b64urlDecode = (s) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
const decodeWord = (s) => s.replace(/=\?UTF-8\?B\?([^?]+)\?=/g, (_, b) => Buffer.from(b, 'base64').toString('utf8'));
let passed = 0;
const ok = (name) => { passed += 1; console.log('  ✓', name); };

(async () => {
  // 1. base64url
  const bin = Buffer.from([0xfb, 0xff, 0xfe, 0x3e, 0x3f]);
  const u = mail.base64url(bin);
  assert(!/[+/=]/.test(u)); assert.strictEqual(u, '-__-Pj8');
  assert.deepStrictEqual(Buffer.from(u, 'base64url'), bin);
  ok('base64url без +/= и обратимо');

  // 2. header encoding
  assert.strictEqual(mail.encodeHeader('Hello'), 'Hello');
  assert.strictEqual(decodeWord(mail.encodeHeader('Gilil On — код входа')), 'Gilil On — код входа');
  ok('Subject → =?UTF-8?B?…?=');

  // 3. MIME text/plain
  const m1 = mail.buildMimeMessage({ from: 'a@b.c', to: 'x@y.z', subject: 'Тема\r\nBcc: evil@x', text: 'Привет, код 123456' });
  const [h1, b1] = m1.split('\r\n\r\n');
  assert(/^From: a@b\.c$/m.test(h1)); assert(/^To: x@y\.z$/m.test(h1));
  assert(!/^Bcc:/m.test(h1), 'header injection blocked');
  assert(/Content-Type: text\/plain; charset=UTF-8/.test(h1)); assert(/Content-Transfer-Encoding: base64/.test(h1));
  assert.strictEqual(Buffer.from(b1, 'base64').toString('utf8'), 'Привет, код 123456');
  ok('MIME text/plain UTF-8 base64, CRLF, без header-injection');

  // 4. mode / mock with empty env
  assert.strictEqual(mail.mailMode(), 'mock'); assert.strictEqual(mail.isMockMail(), true);
  const r0 = await mail.sendMail({ to: 'x@y.z', subject: 's', text: 'Ваш код входа в Gilil On: 111111' });
  assert.strictEqual(r0.mock, true);
  ok('пустой env → mode=mock, лог-fallback');

  // 5. Gmail API with stubbed fetch
  process.env.GMAIL_CLIENT_ID = 'cid.apps.googleusercontent.com';
  process.env.GMAIL_CLIENT_SECRET = 'csecret';
  process.env.GMAIL_REFRESH_TOKEN = 'rtoken';
  process.env.GMAIL_USER = 'gililllight@gmail.com';
  process.env.SMTP_FROM = 'Гилиль Он <gililllight@gmail.com>';
  assert.strictEqual(mail.mailMode(), 'gmail-api'); assert.strictEqual(mail.isMockMail(), false);
  const calls = [];
  const json = (status, obj) => ({ ok: status < 300, status, statusText: String(status), json: async () => obj });
  global.fetch = async (url, opts) => {
    calls.push({ url, opts });
    if (url === 'https://oauth2.googleapis.com/token') return json(200, { access_token: 'AT1', expires_in: 3599 });
    if (url === 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send') return json(200, { id: 'msg123' });
    throw new Error('unexpected url ' + url);
  };
  const subject = 'Gilil On — код входа';
  const text = 'Ваш код входа в Gilil On: 654321\n\nКод действует 10 мин.';
  const html = '<p>Ваш код: <b>654321</b></p>';
  const r1 = await mail.sendMail({ to: 'user@example.com', subject, text, html });
  assert.deepStrictEqual(r1, { mock: false, mode: 'gmail-api', messageId: 'msg123' });
  assert.strictEqual(calls.length, 2);
  const tok = new URLSearchParams(calls[0].opts.body);
  assert.strictEqual(calls[0].opts.method, 'POST');
  assert.strictEqual(calls[0].opts.headers['Content-Type'], 'application/x-www-form-urlencoded');
  assert.deepStrictEqual(Object.fromEntries(tok), { grant_type: 'refresh_token', client_id: 'cid.apps.googleusercontent.com', client_secret: 'csecret', refresh_token: 'rtoken' });
  ok('token call: POST oauth2.googleapis.com/token, grant_type=refresh_token + id/secret/refresh');
  assert.strictEqual(calls[1].opts.headers.Authorization, 'Bearer AT1');
  const payload = JSON.parse(calls[1].opts.body);
  assert.deepStrictEqual(Object.keys(payload), ['raw']); assert(!/[+/=]/.test(payload.raw));
  const raw = b64urlDecode(payload.raw);
  const [hdr, ...rest] = raw.split('\r\n\r\n');
  assert(/^To: user@example\.com$/m.test(hdr));
  assert.strictEqual(decodeWord(hdr.match(/^Subject: (.*)$/m)[1]), subject);
  assert.strictEqual(decodeWord(hdr.match(/^From: (.*)$/m)[1]), 'Гилиль Он <gililllight@gmail.com>');
  const boundary = hdr.match(/boundary="([^"]+)"/)[1];
  const parts = rest.join('\r\n\r\n').split(`--${boundary}`).slice(1, 3).map((p) => {
    const [ph, pb] = p.replace(/^\r\n/, '').split('\r\n\r\n');
    return { ph, body: Buffer.from(pb.replace(/\r\n/g, ''), 'base64').toString('utf8') };
  });
  assert(/text\/plain; charset=UTF-8/.test(parts[0].ph)); assert.strictEqual(parts[0].body, text);
  assert(/text\/html; charset=UTF-8/.test(parts[1].ph)); assert.strictEqual(parts[1].body, html);
  ok('send call: Bearer, {raw}; decoded To/From/Subject/body (кириллица) совпадают');

  // 6. token cache
  await mail.sendMail({ to: 'user@example.com', subject: 's', text: 't' });
  assert.strictEqual(calls.length, 3); assert.strictEqual(calls[2].url, 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send');
  ok('access_token кэшируется (второй send без token-запроса)');

  // 7. API error, no SMTP → log fallback, no throw
  mail.resetTokenCache();
  global.fetch = async (url) => (url.includes('/token')
    ? json(400, { error: 'invalid_grant', error_description: 'Token has been expired or revoked.' })
    : json(500, {}));
  const r2 = await mail.sendMail({ to: 'user@example.com', subject, text });
  assert.strictEqual(r2.mock, true); assert(/invalid_grant/.test(r2.reason));
  ok('ошибка API без SMTP → лог-fallback с кодом, без исключения');

  // 8. API error with SMTP configured → SMTP path is attempted
  process.env.GMAIL_APP_PASSWORD = 'dummy';
  const nm = require('nodemailer'); const orig = nm.createTransport; let smtpUsed = null;
  nm.createTransport = (cfg) => ({ sendMail: async (m) => { smtpUsed = { cfg, m }; return { messageId: 'smtp1' }; } });
  const r3 = await mail.sendMail({ to: 'user@example.com', subject, text });
  nm.createTransport = orig;
  assert.strictEqual(r3.messageId, 'smtp1'); assert.strictEqual(smtpUsed.cfg.service, 'gmail');
  ok('ошибка API + GMAIL_APP_PASSWORD → fallback на SMTP');

  // 9. priority: only app password → smtp-gmail; AUTH_OTP_MOCK=1 overrides
  delete process.env.GMAIL_REFRESH_TOKEN;
  assert.strictEqual(mail.mailMode(), 'smtp-gmail');
  process.env.AUTH_OTP_MOCK = '1'; assert.strictEqual(mail.mailMode(), 'mock');
  ok('приоритет: oauth > app password > smtp > mock; AUTH_OTP_MOCK=1 форсит mock');

  console.log(`\nALL PASSED (${passed})`);
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
