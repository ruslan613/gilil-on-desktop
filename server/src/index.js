'use strict';

const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { initDb, DB_PATH } = require('./db');
const { resolveKey } = require('./crypto');
const { mountAuthRoutes, authMiddleware } = require('./auth');
const { mountChatRoutes, attachWebSocket, sendToUser } = require('./chat');
const { mountTaskRoutes } = require('./tasks');
const { mountSearchRoutes } = require('./search');
const { mountReplyStatusRoutes } = require('./replyStatus');
const { mountFunnelRoutes } = require('./funnel');
const { mountActivityRoutes } = require('./activity');
const { mountUsefulnessRoutes } = require('./usefulness');
const {
  mountNotificationRoutes,
  setNotificationPusher,
} = require('./notifications');
const { mountNewsRoutes } = require('./news');
const { mountTvRoutes } = require('./tv');
const { mountTranslateRoutes } = require('./translate');
const { mountVoiceRoutes } = require('./voice');
const { mountProjectRoutes } = require('./projects');
const { mountDirectorRoutes } = require('./director');
const { mountSmtpAllowlistRoutes } = require('./smtpAllowlist');
const { mountAlsRoutes } = require('./alsBridge');

const PORT = Number(process.env.PORT) || 8788;

if (!process.env.JWT_SECRET) {
  console.error('[gilil-on] FATAL: JWT_SECRET must be set in .env');
  process.exit(1);
}
if (!process.env.MESSAGE_KEY) {
  console.error('[gilil-on] FATAL: MESSAGE_KEY must be set in .env');
  process.exit(1);
}
try {
  resolveKey();
} catch (e) {
  console.error('[gilil-on] FATAL: MESSAGE_KEY invalid:', e.message);
  process.exit(1);
}

initDb();

const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));
app.get(['/', '/shell-v2.html'], (_req, res) => {
  res.sendFile(path.join(publicDir, 'shell-v2.html'));
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'gilil-on-desktop-server',
    stage: 2,
    db: DB_PATH,
  });
});

mountAuthRoutes(app);
mountSmtpAllowlistRoutes(app, { authMiddleware });
mountChatRoutes(app, { authMiddleware });
mountTaskRoutes(app, { authMiddleware });
mountSearchRoutes(app, { authMiddleware });
mountReplyStatusRoutes(app, { authMiddleware });
mountFunnelRoutes(app, { authMiddleware });
mountActivityRoutes(app, { authMiddleware });
mountUsefulnessRoutes(app, { authMiddleware });
mountNotificationRoutes(app, { authMiddleware });
mountNewsRoutes(app);
mountTvRoutes(app);
mountTranslateRoutes(app, authMiddleware);
mountVoiceRoutes(app, authMiddleware);
mountProjectRoutes(app, { authMiddleware });
mountAlsRoutes(app, { authMiddleware });
mountDirectorRoutes(app, {
  authMiddleware,
  notifyUser: (userId, n) => {
    try {
      const { createNotification } = require('./notifications');
      const row = createNotification({
        userId,
        type: (n && n.type) || 'escalation',
        title: (n && n.title) || 'Эскалация',
        body: (n && n.body) || '',
        meta: {
          entity_type: n && n.entity_type,
          entity_id: n && n.entity_id,
          actor_name: n && n.actor_name,
        },
      });
      sendToUser(userId, { type: 'notification', notification: row || n });
    } catch (e) {
      try { sendToUser(userId, { type: 'notification', notification: n }); } catch (_) {}
    }
  },
});

setNotificationPusher((userId, payload) => {
  try {
    sendToUser(userId, payload);
  } catch (e) {
    console.warn('[ws] notification push failed', e.message);
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'internal_error' });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });
attachWebSocket(wss);

// Bind loopback only — desktop shell must not expose the API on LAN.
server.listen(PORT, '127.0.0.1', () => {
  console.log(`[gilil-on] http://127.0.0.1:${PORT}  ws://127.0.0.1:${PORT}/ws`);
  console.log(`[gilil-on] db=${DB_PATH}`);
  console.log(`[gilil-on] mail mode=${require('./mail').mailMode()}`);
});
