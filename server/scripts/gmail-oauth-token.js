#!/usr/bin/env node
'use strict';

/**
 * Get GMAIL_REFRESH_TOKEN for Gmail API sending (dependency-free, Node 18+).
 *
 * Usage:
 *   node scripts/gmail-oauth-token.js path/to/client_secret_XXXX.json
 *   node scripts/gmail-oauth-token.js --client-id=ID --client-secret=SECRET [--port=53682]
 *
 * The OAuth client must be of type "Desktop app" (JSON has an "installed" key).
 * A local server on http://127.0.0.1:<port> receives the redirect (loopback is
 * allowed for Desktop clients). Prints GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET /
 * GMAIL_REFRESH_TOKEN lines for server/.env.
 */

const fs = require('fs');
const http = require('http');
const crypto = require('crypto');

const SCOPE = 'https://www.googleapis.com/auth/gmail.send';
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

function parseArgs(argv) {
  const out = { file: null, clientId: null, clientSecret: null, port: 0 };
  for (const a of argv) {
    const m = a.match(/^--([a-z-]+)=(.*)$/);
    if (m) {
      if (m[1] === 'client-id') out.clientId = m[2];
      else if (m[1] === 'client-secret') out.clientSecret = m[2];
      else if (m[1] === 'port') out.port = Number(m[2]) || 0;
    } else if (a === '-h' || a === '--help') {
      out.help = true;
    } else {
      out.file = a;
    }
  }
  return out;
}

function loadClient(args) {
  let clientId = args.clientId || process.env.GMAIL_CLIENT_ID;
  let clientSecret = args.clientSecret || process.env.GMAIL_CLIENT_SECRET;
  if (args.file) {
    const json = JSON.parse(fs.readFileSync(args.file, 'utf8'));
    const c = json.installed || json.web;
    if (!c) throw new Error('В JSON нет ключа "installed" — нужен OAuth client типа "Desktop app".');
    if (!json.installed) console.warn('[!] Это клиент типа "web", а не "Desktop app" — loopback redirect может не сработать.');
    clientId = c.client_id;
    clientSecret = c.client_secret;
  }
  if (!clientId || !clientSecret) {
    throw new Error('Нужны client id и secret: путь к client_secret.json или --client-id=… --client-secret=…');
  }
  return { clientId, clientSecret };
}

async function exchangeCode({ clientId, clientSecret, code, redirectUri, verifier }) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    }).toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`token exchange ${res.status}: ${data.error || ''} ${data.error_description || ''}`);
  return data;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log('node scripts/gmail-oauth-token.js <client_secret.json> | --client-id=… --client-secret=… [--port=N]');
    return;
  }
  const { clientId, clientSecret } = loadClient(args);
  const state = crypto.randomBytes(16).toString('hex');
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (url.pathname !== '/') { res.writeHead(404); res.end(); return; }
    const reply = (code, msg) => {
      res.writeHead(code, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<html><body style="font-family:sans-serif"><h3>${msg}</h3></body></html>`);
    };
    if (url.searchParams.get('error')) {
      reply(400, `Ошибка: ${url.searchParams.get('error')}`);
      console.error('Авторизация отклонена:', url.searchParams.get('error'));
      server.close(); process.exitCode = 1; return;
    }
    if (url.searchParams.get('state') !== state) { reply(400, 'Неверный state'); return; }
    const code = url.searchParams.get('code');
    if (!code) { reply(400, 'Нет code'); return; }
    try {
      const tokens = await exchangeCode({ clientId, clientSecret, code, redirectUri, verifier });
      if (!tokens.refresh_token) {
        throw new Error('Google не вернул refresh_token. Удалите доступ приложения в https://myaccount.google.com/permissions и повторите.');
      }
      reply(200, 'Готово. Можно закрыть вкладку и вернуться в терминал.');
      console.log('\nДобавьте в server/.env:\n');
      console.log(`GMAIL_CLIENT_ID=${clientId}`);
      console.log(`GMAIL_CLIENT_SECRET=${clientSecret}`);
      console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
      console.log('\n(scope:', tokens.scope, ')');
    } catch (e) {
      reply(500, 'Ошибка обмена кода — см. терминал');
      console.error(e.message);
      process.exitCode = 1;
    } finally {
      server.close();
    }
  });

  let redirectUri;
  server.listen(args.port, '127.0.0.1', () => {
    redirectUri = `http://127.0.0.1:${server.address().port}`;
    const authUrl = `${AUTH_URL}?${new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPE,
      access_type: 'offline',
      prompt: 'consent',
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    })}`;
    console.log('Откройте в браузере (войдите под ящиком-отправителем):\n');
    console.log(authUrl);
    console.log(`\nОжидаю редирект на ${redirectUri} …`);
  });
}

try {
  main();
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
