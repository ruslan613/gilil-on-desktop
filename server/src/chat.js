'use strict';

const { WebSocket } = require('ws');
const jwt = require('jsonwebtoken');
const { getDb } = require('./db');
const { encrypt, decrypt } = require('./crypto');
const { jwtSecret, publicUser } = require('./auth');
const { logActivity } = require('./activity');
const { checkContactLeak } = require('./filter');

/** userId → Set<WebSocket> */
const socketsByUser = new Map();

function addSocket(userId, ws) {
  if (!socketsByUser.has(userId)) socketsByUser.set(userId, new Set());
  socketsByUser.get(userId).add(ws);
}

function removeSocket(userId, ws) {
  const set = socketsByUser.get(userId);
  if (!set) return;
  set.delete(ws);
  if (!set.size) socketsByUser.delete(userId);
}

function sendToUser(userId, payload) {
  const set = socketsByUser.get(userId);
  if (!set) return;
  const data = JSON.stringify(payload);
  for (const ws of set) {
    if (ws.readyState === WebSocket.OPEN) ws.send(data);
  }
}

function broadcastAll(payload) {
  const data = JSON.stringify(payload);
  for (const set of socketsByUser.values()) {
    for (const ws of set) {
      if (ws.readyState === WebSocket.OPEN) ws.send(data);
    }
  }
}

function isMember(chatId, userId) {
  return !!getDb()
    .prepare('SELECT 1 FROM chat_members WHERE chat_id = ? AND user_id = ?')
    .get(chatId, userId);
}


function contactLeakOrThrow(text) {
  const leak = checkContactLeak(text);
  if (!leak.ok) {
    const err = new Error('contact_leak');
    err.status = 400;
    err.code = 'contact_leak';
    err.details = {
      reason: leak.reason,
      matched: leak.matched,
      matches: leak.matched ? [leak.matched] : [],
    };
    throw err;
  }
}

function tryParseVoicePayload(text) {
  if (!text || typeof text !== 'string') return null;
  const t = text.trim();
  if (!t.startsWith('{') || t.indexOf('__gilil_voice') === -1) return null;
  try {
    const obj = JSON.parse(t);
    if (obj && obj.__gilil_voice && (obj.kind === 'voice' || obj.media === 'voice')) return obj;
  } catch (_) {}
  return null;
}

function decryptMessage(row) {
  let text = null;
  try {
    text = decrypt({ ciphertext: row.ciphertext, iv: row.iv, tag: row.tag });
  } catch (_) {
    text = '[decrypt_error]';
  }
  const sender = getDb()
    .prepare('SELECT id, username, role, display_name, region FROM users WHERE id = ?')
    .get(row.sender_id);
  const base = {
    id: row.id,
    chat_id: row.chat_id,
    sender_id: row.sender_id,
    sender: sender ? publicUser(sender) : null,
    text,
    created_at: row.created_at,
  };
  const voice = tryParseVoicePayload(text);
  if (!voice) return base;
  return {
    ...base,
    kind: 'voice',
    media: 'voice',
    text: voice.transcript || '',
    transcript: voice.transcript || '',
    media_url: voice.media_url || '',
    audioUrl: voice.media_url || '',
    duration_ms: voice.duration_ms || 0,
    translation_zh: voice.translation_zh || null,
    translation: voice.translation || null,
    stt_provider: voice.stt_provider || null,
  };
}

function listChats(user) {
  const db = getDb();
  const chats = db
    .prepare(
      `SELECT c.* FROM chats c
       JOIN chat_members m ON m.chat_id = c.id
       WHERE m.user_id = ?
       ORDER BY c.id DESC`
    )
    .all(user.id);

  // Attach reply_status badge for list
  return chats.map((c) => {
    let badge = null;
    if (user.role === 'general_admin' || user.role === 'director' || user.role === 'manager') {
      const rs = db
        .prepare(
          `SELECT r.*, u.display_name FROM reply_status r
           JOIN users u ON u.id = r.employee_user_id
           WHERE r.chat_id = ?
           ORDER BY r.updated_at DESC LIMIT 5`
        )
        .all(c.id);
      badge = rs.map((r) => ({
        status: r.status,
        employee_user_id: r.employee_user_id,
        employee_name: r.display_name,
        updated_at: r.updated_at,
      }));
    } else {
      const r = db
        .prepare('SELECT * FROM reply_status WHERE chat_id = ? AND employee_user_id = ?')
        .get(c.id, user.id);
      if (r) badge = [{ status: r.status, employee_user_id: r.employee_user_id, updated_at: r.updated_at }];
    }
    const last = db
      .prepare('SELECT * FROM messages WHERE chat_id = ? ORDER BY id DESC LIMIT 1')
      .get(c.id);
    return {
      id: c.id,
      title: c.title,
      kind: c.kind,
      region: c.region,
      created_at: c.created_at,
      reply_badges: badge || [],
      last_message: last ? decryptMessage(last) : null,
    };
  });
}

function createMessage(user, chatId, text) {
  contactLeakOrThrow(text);
  if (!isMember(chatId, user.id)) {
    const err = new Error('not_a_member');
    err.status = 403;
    throw err;
  }
  const parts = encrypt(text);
  const info = getDb()
    .prepare(
      `INSERT INTO messages (chat_id, sender_id, ciphertext, iv, tag) VALUES (?, ?, ?, ?, ?)`
    )
    .run(chatId, user.id, parts.ciphertext, parts.iv, parts.tag);
  const row = getDb().prepare('SELECT * FROM messages WHERE id = ?').get(info.lastInsertRowid);
  const msg = decryptMessage(row);
  logActivity(user.id, {
    action: 'chat_message',
    entityType: 'chat',
    entityId: chatId,
    detail: `msg:${msg.id}`,
  });

  // Fan-out to members
  const members = getDb()
    .prepare('SELECT user_id FROM chat_members WHERE chat_id = ?')
    .all(chatId);
  for (const m of members) {
    sendToUser(m.user_id, { type: 'message', message: msg });
  }
  return msg;
}

function mountChatRoutes(app, { authMiddleware }) {
  app.get('/api/chats', authMiddleware, (req, res) => {
    res.json({ chats: listChats(req.user) });
  });

  app.get('/api/chats/:id/messages', authMiddleware, (req, res) => {
    const chatId = Number(req.params.id);
    if (!isMember(chatId, req.user.id)) {
      return res.status(403).json({ error: 'not_a_member' });
    }
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
    const rows = getDb()
      .prepare(
        `SELECT * FROM messages WHERE chat_id = ? ORDER BY id DESC LIMIT ?`
      )
      .all(chatId, limit)
      .reverse();
    res.json({ messages: rows.map(decryptMessage) });
  });

  app.post('/api/chats/:id/messages', authMiddleware, (req, res) => {
    try {
      const text = String((req.body && req.body.text) || '').trim();
      if (!text) return res.status(400).json({ error: 'text_required' });
      const msg = createMessage(req.user, Number(req.params.id), text);
      res.status(201).json({ message: msg });
    } catch (e) {
      if (e.code === 'contact_leak' || e.message === 'contact_leak') {
        return res.status(400).json({
          error: 'contact_leak',
          reason: e.details && e.details.reason,
          matched: e.details && e.details.matched,
          matches: (e.details && e.details.matches) || [],
        });
      }
      res.status(e.status || 500).json({ error: e.message });
    }
  });

  app.post('/api/chats', authMiddleware, (req, res) => {
    const title = String((req.body && req.body.title) || '').trim() || 'Chat';
    const memberIds = Array.isArray(req.body.member_ids) ? req.body.member_ids.map(Number) : [];
    const ids = [...new Set([req.user.id, ...memberIds.filter((n) => Number.isFinite(n))])];
    const db = getDb();
    const info = db
      .prepare(`INSERT INTO chats (title, kind, region) VALUES (?, ?, ?)`)
      .run(title, req.body.kind || 'direct', req.body.region || req.user.region);
    const chatId = Number(info.lastInsertRowid);
    const mem = db.prepare(`INSERT INTO chat_members (chat_id, user_id) VALUES (?, ?)`);
    ids.forEach((uid) => {
      const u = db.prepare('SELECT id FROM users WHERE id = ?').get(uid);
      if (u) mem.run(chatId, uid);
    });
    res.status(201).json({ chat: { id: chatId, title } });
  });
}

function attachWebSocket(wss) {
  wss.on('connection', (ws, req) => {
    let user = null;
    const url = new URL(req.url || '', 'http://localhost');
    const token = url.searchParams.get('token');

    function authed(u) {
      user = u;
      ws.userId = u.id;
      addSocket(u.id, ws);
      ws.send(JSON.stringify({ type: 'hello', user: publicUser(u) }));
    }

    if (token) {
      try {
        const payload = jwt.verify(token, jwtSecret());
        const row = getDb().prepare('SELECT * FROM users WHERE id = ? AND active = 1').get(payload.sub);
        if (row) authed(row);
      } catch (_) {}
    }

    ws.on('message', (raw) => {
      let data;
      try {
        data = JSON.parse(String(raw));
      } catch (_) {
        return;
      }
      if (data.type === 'auth' && data.token) {
        try {
          const payload = jwt.verify(data.token, jwtSecret());
          const row = getDb().prepare('SELECT * FROM users WHERE id = ? AND active = 1').get(payload.sub);
          if (row) authed(row);
          else ws.send(JSON.stringify({ type: 'error', error: 'auth_failed' }));
        } catch (e) {
          ws.send(JSON.stringify({ type: 'error', error: 'auth_failed' }));
        }
        return;
      }
      if (!user) {
        ws.send(JSON.stringify({ type: 'error', error: 'unauthorized' }));
        return;
      }
      if (data.type === 'message' && data.chat_id != null) {
        try {
          const msg = createMessage(publicUser(user), Number(data.chat_id), String(data.text || ''));
          // createMessage already fans out; ack to sender
          ws.send(JSON.stringify({ type: 'message_ack', message: msg }));
        } catch (e) {
          if (e.code === 'contact_leak' || e.message === 'contact_leak') {
            ws.send(
              JSON.stringify({
                type: 'error',
                error: 'contact_leak',
                reason: e.details && e.details.reason,
                matched: e.details && e.details.matched,
                matches: (e.details && e.details.matches) || [],
              })
            );
          } else {
            ws.send(JSON.stringify({ type: 'error', error: e.message }));
          }
        }
      }
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    });

    ws.on('close', () => {
      if (user) removeSocket(user.id, ws);
    });
  });
}

module.exports = {
  mountChatRoutes,
  attachWebSocket,
  sendToUser,
  broadcastAll,
  isMember,
  decryptMessage,
  checkContactLeak,
  contactLeakOrThrow,
};
