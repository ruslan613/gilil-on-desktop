'use strict';

/**
 * Voice messages: upload → STT → translate → store under chat bubble metadata.
 *
 * Env (optional real STT):
 *   OPENAI_API_KEY / WHISPER_API_KEY  → OpenAI Whisper
 *   WHISPER_API_URL                  → override (default https://api.openai.com/v1/audio/transcriptions)
 *   GOOGLE_SPEECH_API_KEY            → Google Speech-to-Text v1
 *   STT_MOCK=1                       → force mock even if keys set
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { getDb } = require('./db');
const { encrypt } = require('./crypto');
const { isMember, decryptMessage, sendToUser } = require('./chat');
const { logActivity } = require('./activity');
const { translateText, normalizeLang, detectLang } = require('./translate');

const UPLOAD_DIR = path.join(__dirname, '..', 'data', 'uploads', 'voice');
const MAX_AUDIO_BYTES = 12 * 1024 * 1024;

const MOCK_TRANSCRIPTS = [
  'Добрый день, КП по Альфа Лайт готово, отправлю до пятнадцати часов.',
  'Нужен статус по образцам для ЖК Фрунзенский, клиент ждёт завтра.',
  'Спецификация после КП загружена в shared RU, проверьте пожалуйста.',
  'Счёт на согласовании у директора, Reminder на завтра в одиннадцать.',
  'Пришлите трек-номер в общую папку, фото упаковки уже в чате.',
];

function ensureUploadDir() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function extForMime(mime) {
  const m = String(mime || '').toLowerCase();
  if (m.includes('ogg')) return '.ogg';
  if (m.includes('mp4') || m.includes('m4a') || m.includes('aac')) return '.m4a';
  if (m.includes('mpeg') || m.includes('mp3')) return '.mp3';
  if (m.includes('wav')) return '.wav';
  return '.webm';
}

/**
 * Minimal multipart/form-data parser (fields + one file).
 * Avoids adding multer dependency.
 */
function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const ctype = String(req.headers['content-type'] || '');
    const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(ctype);
    if (!m) {
      reject(Object.assign(new Error('multipart_required'), { status: 400 }));
      return;
    }
    const boundary = m[1] || m[2];
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_AUDIO_BYTES + 256 * 1024) {
        reject(Object.assign(new Error('file_too_large'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('error', reject);
    req.on('end', () => {
      try {
        const buf = Buffer.concat(chunks);
        const result = { fields: {}, file: null };
        const sep = Buffer.from('--' + boundary);
        let start = buf.indexOf(sep);
        while (start !== -1) {
          let next = buf.indexOf(sep, start + sep.length);
          let part = buf.slice(start + sep.length, next === -1 ? buf.length : next);
          if (part.slice(0, 2).equals(Buffer.from('--'))) break;
          if (part.slice(0, 2).equals(Buffer.from('\r\n'))) part = part.slice(2);
          if (part.slice(-2).equals(Buffer.from('\r\n'))) part = part.slice(0, -2);
          const headerEnd = part.indexOf('\r\n\r\n');
          if (headerEnd === -1) {
            start = next;
            continue;
          }
          const header = part.slice(0, headerEnd).toString('utf8');
          let body = part.slice(headerEnd + 4);
          if (body.slice(-2).equals(Buffer.from('\r\n'))) body = body.slice(0, -2);
          const nameMatch = /name="([^"]+)"/i.exec(header);
          const fileMatch = /filename="([^"]*)"/i.exec(header);
          const name = nameMatch ? nameMatch[1] : null;
          if (!name) {
            start = next;
            continue;
          }
          if (fileMatch) {
            const ct = /Content-Type:\s*([^\r\n]+)/i.exec(header);
            result.file = {
              field: name,
              filename: fileMatch[1] || 'voice.webm',
              mime: ct ? ct[1].trim() : 'application/octet-stream',
              buffer: body,
            };
          } else {
            result.fields[name] = body.toString('utf8');
          }
          start = next;
        }
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
  });
}

function pickMockTranscript(durationMs, byteLength) {
  const idx =
    Math.abs(
      (Number(durationMs) || 0) + (Number(byteLength) || 0) * 13
    ) % MOCK_TRANSCRIPTS.length;
  return MOCK_TRANSCRIPTS[idx];
}

async function whisperTranscribe(buffer, mime, filename) {
  const key = process.env.OPENAI_API_KEY || process.env.WHISPER_API_KEY;
  if (!key || process.env.STT_MOCK === '1') return null;
  const url =
    process.env.WHISPER_API_URL ||
    'https://api.openai.com/v1/audio/transcriptions';
  const boundary = '----gilil' + crypto.randomBytes(8).toString('hex');
  const parts = [];
  function addField(name, value) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`
      )
    );
  }
  addField('model', process.env.WHISPER_MODEL || 'whisper-1');
  addField('language', 'ru');
  const fname = filename || 'voice.webm';
  const ct = mime || 'audio/webm';
  parts.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fname}"\r\nContent-Type: ${ct}\r\n\r\n`
    )
  );
  parts.push(buffer);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));
  const body = Buffer.concat(parts);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 45000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + key,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body,
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      console.warn('[stt] whisper http', res.status, t.slice(0, 200));
      return null;
    }
    const data = await res.json();
    const text = data && (data.text || data.transcript);
    return text && String(text).trim() ? String(text).trim() : null;
  } catch (e) {
    console.warn('[stt] whisper error', e.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function googleSpeechTranscribe(buffer, mime) {
  const key = process.env.GOOGLE_SPEECH_API_KEY;
  if (!key || process.env.STT_MOCK === '1') return null;
  const encoding = String(mime || '').includes('ogg')
    ? 'OGG_OPUS'
    : String(mime || '').includes('wav')
      ? 'LINEAR16'
      : 'WEBM_OPUS';
  const url =
    'https://speech.googleapis.com/v1/speech:recognize?key=' +
    encodeURIComponent(key);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 45000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctrl.signal,
      body: JSON.stringify({
        config: {
          encoding,
          languageCode: 'ru-RU',
          alternativeLanguageCodes: ['zh-CN', 'en-US'],
          enableAutomaticPunctuation: true,
        },
        audio: { content: buffer.toString('base64') },
      }),
    });
    if (!res.ok) {
      console.warn('[stt] google http', res.status);
      return null;
    }
    const data = await res.json();
    const alt =
      data.results &&
      data.results[0] &&
      data.results[0].alternatives &&
      data.results[0].alternatives[0];
    const text = alt && alt.transcript;
    return text && String(text).trim() ? String(text).trim() : null;
  } catch (e) {
    console.warn('[stt] google error', e.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @returns {Promise<{ text: string, provider: string, lang: string }>}
 */
async function speechToText(buffer, { mime, filename, durationMs, clientTranscript } = {}) {
  const client = String(clientTranscript || '').trim();
  if (client) {
    return { text: client, provider: 'client', lang: detectLang(client) || 'ru' };
  }
  const whisper = await whisperTranscribe(buffer, mime, filename);
  if (whisper) {
    return { text: whisper, provider: 'whisper', lang: detectLang(whisper) || 'ru' };
  }
  const google = await googleSpeechTranscribe(buffer, mime);
  if (google) {
    return { text: google, provider: 'google', lang: detectLang(google) || 'ru' };
  }
  const mock = pickMockTranscript(durationMs, buffer && buffer.length);
  return { text: mock, provider: 'mock', lang: 'ru' };
}

function encodeVoicePayload(meta) {
  return JSON.stringify({
    __gilil_voice: 1,
    kind: 'voice',
    transcript: meta.transcript || '',
    media_url: meta.media_url || '',
    duration_ms: meta.duration_ms || 0,
    translation_zh: meta.translation_zh || null,
    translation: meta.translation || null,
    stt_provider: meta.stt_provider || null,
  });
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

function enrichMessage(msg) {
  if (!msg || !msg.text) return msg;
  const voice = tryParseVoicePayload(msg.text);
  if (!voice) return msg;
  return {
    ...msg,
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

async function translateTranscript(transcript, targetLang, sourceLang) {
  const src = String(transcript || '').trim();
  if (!src) return null;
  const from = normalizeLang(sourceLang) || detectLang(src) || 'ru';
  let to = normalizeLang(targetLang);
  if (!to) to = 'zh';
  if (from === to) {
    // Still offer peer-facing ZH for RU voice when viewer lang matches source
    if (from === 'ru' && to === 'ru') to = 'zh';
    else return null;
  }
  const result = await translateText(src, to, from);
  if (!result || !result.text || result.text === src) return null;
  return {
    text: result.text,
    from: result.from,
    to: result.to,
    provider: result.provider,
  };
}

function createVoiceMessage(user, chatId, meta) {
  if (!isMember(chatId, user.id)) {
    const err = new Error('not_a_member');
    err.status = 403;
    throw err;
  }
  const payload = encodeVoicePayload(meta);
  const parts = encrypt(payload);
  const info = getDb()
    .prepare(
      `INSERT INTO messages (chat_id, sender_id, ciphertext, iv, tag) VALUES (?, ?, ?, ?, ?)`
    )
    .run(chatId, user.id, parts.ciphertext, parts.iv, parts.tag);
  const row = getDb().prepare('SELECT * FROM messages WHERE id = ?').get(info.lastInsertRowid);
  const msg = enrichMessage(decryptMessage(row));
  logActivity(user.id, {
    action: 'chat_voice',
    entityType: 'chat',
    entityId: chatId,
    detail: `msg:${msg.id};stt:${meta.stt_provider || 'n/a'}`,
  });
  const members = getDb()
    .prepare('SELECT user_id FROM chat_members WHERE chat_id = ?')
    .all(chatId);
  for (const m of members) {
    sendToUser(m.user_id, { type: 'message', message: msg });
  }
  return msg;
}

function listConversations(user) {
  const db = getDb();
  const chats = db
    .prepare(
      `SELECT c.* FROM chats c
       JOIN chat_members m ON m.chat_id = c.id
       WHERE m.user_id = ?
       ORDER BY c.id DESC`
    )
    .all(user.id);
  return chats.map((c) => ({
    id: c.id,
    title: c.title,
    kind: c.kind,
    region: c.region,
    created_at: c.created_at,
  }));
}

function createConversation(user, body) {
  const title = String((body && body.title) || '').trim() || 'Chat';
  const usernames = Array.isArray(body.memberUsernames)
    ? body.memberUsernames.map(String)
    : [];
  const memberIds = Array.isArray(body.member_ids)
    ? body.member_ids.map(Number).filter((n) => Number.isFinite(n))
    : [];
  const db = getDb();
  for (const un of usernames) {
    const row = db.prepare('SELECT id FROM users WHERE username = ?').get(un);
    if (row) memberIds.push(row.id);
  }
  const ids = [...new Set([user.id, ...memberIds])];
  const info = db
    .prepare(`INSERT INTO chats (title, kind, region) VALUES (?, ?, ?)`)
    .run(title, (body && body.kind) || 'direct', (body && body.region) || user.region);
  const chatId = Number(info.lastInsertRowid);
  const mem = db.prepare(`INSERT INTO chat_members (chat_id, user_id) VALUES (?, ?)`);
  ids.forEach((uid) => {
    const u = db.prepare('SELECT id FROM users WHERE id = ?').get(uid);
    if (u) mem.run(chatId, uid);
  });
  return { id: chatId, title };
}

function mountVoiceRoutes(app, authMiddleware) {
  ensureUploadDir();

  // Alias: shell-v2 / app-v2 expect /api/conversations
  app.get('/api/conversations', authMiddleware, (req, res) => {
    res.json({ conversations: listConversations(req.user) });
  });

  app.post('/api/conversations', authMiddleware, (req, res) => {
    try {
      const conversation = createConversation(req.user, req.body || {});
      res.status(201).json({ conversation });
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message });
    }
  });

  app.get('/api/conversations/:id/messages', authMiddleware, (req, res) => {
    const chatId = Number(req.params.id);
    if (!isMember(chatId, req.user.id)) {
      return res.status(403).json({ error: 'not_a_member' });
    }
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
    const rows = getDb()
      .prepare(`SELECT * FROM messages WHERE chat_id = ? ORDER BY id DESC LIMIT ?`)
      .all(chatId, limit)
      .reverse();
    res.json({
      messages: rows.map((r) => enrichMessage(decryptMessage(r))),
    });
  });

  app.get('/api/media/voice/:name', authMiddleware, (req, res) => {
    const name = path.basename(String(req.params.name || ''));
    if (!name || name.startsWith('.')) return res.status(400).json({ error: 'bad_name' });
    const file = path.join(UPLOAD_DIR, name);
    if (!file.startsWith(UPLOAD_DIR) || !fs.existsSync(file)) {
      return res.status(404).json({ error: 'not_found' });
    }
    const ext = path.extname(name).toLowerCase();
    const mime =
      ext === '.ogg'
        ? 'audio/ogg'
        : ext === '.mp3'
          ? 'audio/mpeg'
          : ext === '.m4a'
            ? 'audio/mp4'
            : ext === '.wav'
              ? 'audio/wav'
              : 'audio/webm';
    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    fs.createReadStream(file).pipe(res);
  });

  async function handleVoiceUpload(req, res) {
    try {
      const chatId = Number(req.params.id);
      if (!Number.isFinite(chatId)) {
        return res.status(400).json({ error: 'bad_chat_id' });
      }
      if (!isMember(chatId, req.user.id)) {
        return res.status(403).json({ error: 'not_a_member' });
      }

      const parsed = await parseMultipart(req);
      const file = parsed.file;
      if (!file || !file.buffer || !file.buffer.length) {
        return res.status(400).json({ error: 'audio_required' });
      }
      if (file.buffer.length > MAX_AUDIO_BYTES) {
        return res.status(413).json({ error: 'file_too_large' });
      }

      const durationMs = Number(parsed.fields.duration_ms) || 0;
      const targetLang =
        normalizeLang(parsed.fields.target_lang || parsed.fields.lang) ||
        normalizeLang(req.user.locale) ||
        'zh';

      const stt = await speechToText(file.buffer, {
        mime: file.mime,
        filename: file.filename,
        durationMs,
        clientTranscript: parsed.fields.transcript,
      });

      const translation = await translateTranscript(stt.text, targetLang, stt.lang);
      const translationZh =
        translation && translation.to === 'zh'
          ? translation.text
          : stt.lang === 'ru' && targetLang !== 'zh'
            ? ((await translateTranscript(stt.text, 'zh', 'ru')) || {}).text || null
            : translation && translation.to === 'zh'
              ? translation.text
              : null;
      // Prefer explicit ZH line for existing UI; also keep generic translation
      let zhLine = translationZh;
      if (!zhLine && translation && translation.to === 'zh') zhLine = translation.text;
      if (!zhLine && (targetLang === 'zh' || !targetLang)) {
        const tzh = await translateTranscript(stt.text, 'zh', stt.lang || 'ru');
        if (tzh) zhLine = tzh.text;
      }

      ensureUploadDir();
      const id = crypto.randomBytes(12).toString('hex');
      const ext = extForMime(file.mime);
      const fname = `${Date.now()}-${id}${ext}`;
      const abs = path.join(UPLOAD_DIR, fname);
      fs.writeFileSync(abs, file.buffer);
      const mediaUrl = `/api/media/voice/${fname}`;

      const msg = createVoiceMessage(req.user, chatId, {
        transcript: stt.text,
        media_url: mediaUrl,
        duration_ms: durationMs,
        translation_zh: zhLine || (translation && translation.to === 'zh' ? translation.text : null),
        translation: translation || (zhLine ? { text: zhLine, from: stt.lang || 'ru', to: 'zh', provider: 'derived' } : null),
        stt_provider: stt.provider,
      });

      console.log(
        `[voice] chat=${chatId} msg=${msg.id} stt=${stt.provider} bytes=${file.buffer.length} target=${targetLang}`
      );
      res.status(201).json({ message: msg });
    } catch (e) {
      console.error('[voice] upload failed', e.message);
      res.status(e.status || 500).json({ error: e.message || 'voice_failed' });
    }
  }

  app.post('/api/conversations/:id/voice', authMiddleware, handleVoiceUpload);
  app.post('/api/chats/:id/voice', authMiddleware, handleVoiceUpload);

  // Standalone STT (optional; used if client wants re-transcribe)
  app.post('/api/voice/transcribe', authMiddleware, async (req, res) => {
    try {
      const parsed = await parseMultipart(req);
      const file = parsed.file;
      if (!file || !file.buffer) return res.status(400).json({ error: 'audio_required' });
      const durationMs = Number(parsed.fields.duration_ms) || 0;
      const targetLang =
        normalizeLang(parsed.fields.target_lang) ||
        normalizeLang(req.user.locale) ||
        'zh';
      const stt = await speechToText(file.buffer, {
        mime: file.mime,
        filename: file.filename,
        durationMs,
        clientTranscript: parsed.fields.transcript,
      });
      const translation = await translateTranscript(stt.text, targetLang, stt.lang);
      res.json({
        transcript: stt.text,
        stt_provider: stt.provider,
        lang: stt.lang,
        translation,
        translation_zh:
          translation && translation.to === 'zh'
            ? translation.text
            : (await translateTranscript(stt.text, 'zh', stt.lang || 'ru') || {}).text || null,
      });
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message || 'stt_failed' });
    }
  });
}

module.exports = {
  mountVoiceRoutes,
  speechToText,
  enrichMessage,
  tryParseVoicePayload,
  parseMultipart,
};
