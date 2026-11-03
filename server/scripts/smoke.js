'use strict';

/**
 * Smoke: health + login + search + create-task-from-chat
 * Usage: node scripts/smoke.js   (server must be running on PORT)
 */

const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const PORT = Number(process.env.PORT) || 8788;
const BASE = `http://127.0.0.1:${PORT}`;

function req(method, urlPath, { token, body } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlPath, BASE);
    const data = body != null ? JSON.stringify(body) : null;
    const opts = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method,
      headers: {
        Accept: 'application/json',
        ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
    };
    const r = http.request(opts, (res) => {
      let buf = '';
      res.on('data', (c) => (buf += c));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(buf);
        } catch (_) {
          json = { raw: buf };
        }
        resolve({ status: res.statusCode, json });
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

async function main() {
  const fails = [];
  function ok(name, cond, detail) {
    if (cond) console.log('  ✅', name);
    else {
      console.log('  ❌', name, detail || '');
      fails.push(name);
    }
  }

  console.log('SMOKE gilil-on-desktop-server @', BASE);

  const health = await req('GET', '/api/health');
  ok('health', health.status === 200 && health.json.ok === true, health.json);

  // OTP mock flow
  const otpReq = await req('POST', '/api/auth/otp/request', {
    body: { email: 'gililllight@gmail.com' },
  });
  ok('otp request', otpReq.status === 200 && otpReq.json.ok === true && otpReq.json.mock === true && otpReq.json.code, otpReq.json);
  const otpCode = otpReq.json.code;
  const otpVer = await req('POST', '/api/auth/otp/verify', {
    body: { email: 'gililllight@gmail.com', code: otpCode },
  });
  ok('otp verify', otpVer.status === 200 && (otpVer.json.token || otpVer.json.access_token) && otpVer.json.user && otpVer.json.user.username === 'admin', otpVer.json);

  const login = await req('POST', '/api/auth/login', {
    body: { username: 'emp_ru1', password: 'emp123' },
  });
  ok('login', login.status === 200 && (login.json.token || login.json.access_token), login.json);
  const token = login.json.token || login.json.access_token;

  const loginAdmin = await req('POST', '/api/auth/login', {
    body: { username: 'admin', password: 'admin123' },
  });
  ok('login admin', loginAdmin.status === 200 && loginAdmin.json.user.role === 'general_admin');

  const search = await req('GET', '/api/search?q=фрунзен', { token });
  ok(
    'search',
    search.status === 200 && Array.isArray(search.json.results) && search.json.results.length > 0,
    search.json
  );

  // Need a message to create task from — post one first
  const chats = await req('GET', '/api/chats', { token });
  ok('list chats', chats.status === 200 && chats.json.chats && chats.json.chats.length > 0, chats.json);
  const chatId = chats.json.chats[0].id;

  const msg = await req('POST', `/api/chats/${chatId}/messages`, {
    token,
    body: { text: 'Smoke: уточнить спецификацию светильников для ⌘K теста' },
  });
  ok('send encrypted message', msg.status === 201 && msg.json.message && msg.json.message.id, msg.json);
  const messageId = msg.json.message && msg.json.message.id;

  const leak = await req('POST', `/api/chats/${chatId}/messages`, {
    token,
    body: { text: 'Напиши мне в WeChat: steelpro_cn или +86-755-88001001' },
  });
  ok(
    'block contact leak',
    leak.status === 400 && leak.json.error === 'contact_leak' && Array.isArray(leak.json.matches),
    leak.json
  );

  const okMsg2 = await req('POST', `/api/chats/${chatId}/messages`, {
    token,
    body: { text: 'Обычное сообщение без контактов — фильтр пропускает' },
  });
  ok(
    'accept normal message after filter',
    okMsg2.status === 201 && okMsg2.json.message && okMsg2.json.message.id,
    okMsg2.json
  );

  const task = await req('POST', '/api/tasks/from-chat', {
    token,
    body: { messageId, assignee_id: login.json.user.id, notify: false },
  });
  ok(
    'create-task-from-chat',
    task.status === 201 && task.json.task && task.json.task.type === 'from_chat',
    task.json
  );

  // Extra stage-2 checks
  const reply = await req('PUT', '/api/reply-status', {
    token,
    body: { chat_id: chatId, status: 'read' },
  });
  ok('reply-status preset', reply.status === 200 && reply.json.item.status === 'read', reply.json);

  const funnels = await req('GET', '/api/funnels', { token });
  ok('order funnel list', funnels.status === 200 && Array.isArray(funnels.json.items), funnels.json);

  const usefulnessEmp = await req('GET', '/api/usefulness', { token });
  ok('usefulness forbidden for employee', usefulnessEmp.status === 403, usefulnessEmp.json);

  const dirLogin = await req('POST', '/api/auth/login', {
    body: { username: 'director_ru', password: 'dir123' },
  });
  const dirToken = dirLogin.json.token || dirLogin.json.access_token;
  const usefulnessDir = await req('GET', '/api/usefulness', { token: dirToken });
  ok(
    'usefulness panel for director',
    usefulnessDir.status === 200 && Array.isArray(usefulnessDir.json.items),
    usefulnessDir.json
  );

  const activityDir = await req('GET', '/api/activity', { token: dirToken });
  ok('activity forbidden for director', activityDir.status === 403, activityDir.json);

  const adminToken = loginAdmin.json.token || loginAdmin.json.access_token;
  const activityAdmin = await req('GET', '/api/activity', { token: adminToken });
  ok('activity journal for general_admin', activityAdmin.status === 200, activityAdmin.json);

  const activitySess = await req('GET', '/api/activity/sessions', { token: dirToken });
  ok('activity sessions forbidden for director', activitySess.status === 403, activitySess.json);

  const activitySum = await req('GET', '/api/activity/summary', { token: dirToken });
  ok('activity summary forbidden for director', activitySum.status === 403, activitySum.json);


  // Voice STT + translate (mock when no Whisper/Google keys)
  const fs = require('fs');
  const voicePath = '/tmp/smoke-voice.webm';
  fs.writeFileSync(voicePath, Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.alloc(800)]));
  const voiceBoundary = '----smokeboundary';
  const voiceParts = [];
  function vp(name, val, filename, mime) {
    let head = `--${voiceBoundary}\r\nContent-Disposition: form-data; name="${name}"`;
    if (filename) head += `; filename="${filename}"\r\nContent-Type: ${mime || 'application/octet-stream'}`;
    head += `\r\n\r\n`;
    voiceParts.push(Buffer.from(head));
    voiceParts.push(Buffer.isBuffer(val) ? val : Buffer.from(String(val)));
    voiceParts.push(Buffer.from('\r\n'));
  }
  vp('duration_ms', '3500');
  vp('target_lang', 'zh');
  vp('audio', fs.readFileSync(voicePath), 'voice.webm', 'audio/webm');
  voiceParts.push(Buffer.from(`--${voiceBoundary}--\r\n`));
  const voiceBody = Buffer.concat(voiceParts);
  const voiceRes = await new Promise((resolve, reject) => {
    const r = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path: `/api/conversations/${chatId}/voice`,
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': `multipart/form-data; boundary=${voiceBoundary}`,
          'Content-Length': voiceBody.length,
        },
      },
      (res) => {
        let buf = '';
        res.on('data', (c) => (buf += c));
        res.on('end', () => {
          let json = null;
          try { json = JSON.parse(buf); } catch (_) { json = { raw: buf }; }
          resolve({ status: res.statusCode, json });
        });
      }
    );
    r.on('error', reject);
    r.write(voiceBody);
    r.end();
  });
  ok(
    'voice upload mock stt',
    voiceRes.status === 201 &&
      voiceRes.json.message &&
      voiceRes.json.message.kind === 'voice' &&
      voiceRes.json.message.transcript &&
      (voiceRes.json.message.translation_zh || (voiceRes.json.message.translation && voiceRes.json.message.translation.text)),
    voiceRes.json
  );

  if (fails.length) {

    console.error('SMOKE_FAIL', fails.join(', '));
    process.exit(1);
  }
  console.log('SMOKE_OK stage2');
}

main().catch((e) => {
  console.error('SMOKE_ERROR', e);
  process.exit(1);
});
