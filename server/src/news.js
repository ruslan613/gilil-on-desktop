'use strict';

const { getDb } = require('./db');

/**
 * Public tender-news feed for shell «Новости» (news.html).
 * Same contract as gilil-supply-server: GET /api/public/tender-news
 */
function mountNewsRoutes(app) {
  app.get('/api/public/tender-news', (req, res) => {
    try {
      const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
      const kind = req.query.kind ? String(req.query.kind) : null;
      const db = getDb();
      let rows;
      if (kind) {
        rows = db
          .prepare(
            `SELECT id, kind, title, body, url, platform, tender_no, nmck,
                    published_at, created_at
             FROM tender_news
             WHERE kind = ?
             ORDER BY COALESCE(published_at, created_at) DESC, id DESC
             LIMIT ?`
          )
          .all(kind, limit);
      } else {
        rows = db
          .prepare(
            `SELECT id, kind, title, body, url, platform, tender_no, nmck,
                    published_at, created_at
             FROM tender_news
             ORDER BY COALESCE(published_at, created_at) DESC, id DESC
             LIMIT ?`
          )
          .all(limit);
      }
      // Stage-2 desktop has no tender_projects yet — project stub always null.
      const items = rows.map((r) => ({ ...r, project: null }));
      res.json({ ok: true, count: items.length, items });
    } catch (err) {
      console.error('[news] tender-news failed', err.message);
      res.status(500).json({ ok: false, error: 'news_unavailable', message: err.message });
    }
  });
}

module.exports = { mountNewsRoutes };
