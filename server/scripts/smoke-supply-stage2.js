'use strict';

/**
 * Smoke: Gilil On Desktop embeds Stage 2 Supply (8797) + isolation checks.
 * Does not stop 8788 / 8787.
 */
const http = require('http');
const fs = require('path');
const { WebSocket } = require('ws');

const DESKTOP = process.env.DESKTOP_BASE || 'http://127.0.0.1:8788';
const SUPPLY = process.env.SUPPLY_STAGE2_URL || 'http://127.0.0.1:8797';
const WS_URL = SUPPLY.replace(/^http/, 'ws') + '/ws';

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('FAIL:', msg);
  } else console.log('OK:', msg);
}

function get(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let b = '';
        res.on('data', (c) => (b += c));
        res.on('end', () => resolve({ status: res.statusCode, body: b }));
      })
      .on('error', reject);
  });
}

async function req(base, p, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = 'Bearer ' + token;
  const res = await fetch(base + p, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

(async () => {
  console.log('desktop', DESKTOP, 'supply', SUPPLY);

  // Desktop still healthy
  try {
    const h = await req(DESKTOP, '/api/health');
    assert(h.status === 200 && h.data.ok, 'desktop health 8788');
  } catch (e) {
    assert(false, 'desktop health: ' + e.message);
  }

  // Shell has Supply section assets
  const shell = await get(DESKTOP + '/shell-v2.html');
  assert(shell.status === 200 && shell.body.includes('sec-supply'), 'shell has sec-supply');
  assert(shell.body.includes('supply-stage2.js'), 'shell loads supply-stage2.js');
  assert(shell.body.includes('data-section="supply"'), 'shell has Supply nav pill');

  const bridge = await get(DESKTOP + '/supply-stage2.js');
  assert(bridge.status === 200 && bridge.body.includes('8797'), 'supply-stage2.js served');

  // Stage 2 server
  const sh = await req(SUPPLY, '/api/health');
  assert(sh.status === 200 && sh.data.port === 8797, 'stage2 health 8797');

  const tokens = {};
  for (const [u, p, role] of [
    ['admin', 'admin123', 'admin'],
    ['ru1', 'ru123', 'ru'],
    ['cn1', 'cn123', 'cn'],
  ]) {
    const r = await req(SUPPLY, '/api/auth/login', { method: 'POST', body: { username: u, password: p } });
    assert(r.status === 200 && r.data.user.role === role, `supply login ${u}`);
    tokens[u] = r.data.token;
  }

  const ruP = await req(SUPPLY, '/api/projects', { token: tokens.ru1 });
  const cnP = await req(SUPPLY, '/api/projects', { token: tokens.cn1 });
  const adP = await req(SUPPLY, '/api/projects', { token: tokens.admin });
  assert(!(ruP.data.projects || []).some((x) => /CN Storage/i.test(x.title)), 'RU isolation projects');
  assert(!(cnP.data.projects || []).some((x) => /RU Storage/i.test(x.title)), 'CN isolation projects');
  assert(
    (adP.data.projects || []).some((x) => /RU Storage/i.test(x.title)) &&
      (adP.data.projects || []).some((x) => /CN Storage/i.test(x.title)),
    'admin sees all projects'
  );

  const ruS = await req(SUPPLY, '/api/storage', { token: tokens.ru1 });
  const cnS = await req(SUPPLY, '/api/storage', { token: tokens.cn1 });
  assert(!(ruS.data.items || []).some((x) => /CN note/i.test(x.title)), 'RU isolation storage');
  assert(!(cnS.data.items || []).some((x) => /RU note/i.test(x.title)), 'CN isolation storage');

  // Shared WS chat path exists
  const shared = (adP.data.projects || []).find((x) => /Shared/i.test(x.title));
  assert(!!shared, 'shared project exists');
  const convs = await req(SUPPLY, '/api/conversations', { token: tokens.ru1 });
  const cid = ((convs.data.conversations || []).find((c) => c.project_id === shared.id) || {}).id;
  assert(!!cid, 'shared conversation id');

  await new Promise((resolve) => {
    const ws = new WebSocket(WS_URL);
    const t = setTimeout(() => {
      try { ws.close(); } catch (_) {}
      assert(false, 'WS auth timeout');
      resolve();
    }, 4000);
    ws.on('open', () => ws.send(JSON.stringify({ type: 'auth', token: tokens.ru1 })));
    ws.on('message', (buf) => {
      const msg = JSON.parse(String(buf));
      if (msg.type === 'auth_ok') {
        ws.send(JSON.stringify({ type: 'join', conversation_id: cid }));
      } else if (msg.type === 'joined') {
        clearTimeout(t);
        assert(true, 'WS join shared project chat');
        ws.close();
        resolve();
      } else if (msg.type === 'error') {
        clearTimeout(t);
        assert(false, 'WS error ' + msg.error);
        ws.close();
        resolve();
      }
    });
    ws.on('error', (e) => {
      clearTimeout(t);
      assert(false, 'WS ' + e.message);
      resolve();
    });
  });

  if (failed) {
    console.error(`\nSMOKE SUPPLY FAILED: ${failed}`);
    process.exit(1);
  }
  console.log('\nSMOKE SUPPLY PASSED');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
