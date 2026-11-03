'use strict';

const { getDb } = require('./db');

const STAGE_ORDER = ['found', 'in_work', 'application', 'won', 'lost'];
const STAGE_LABELS = {
  found: 'Найдены',
  in_work: 'В работе',
  application: 'Заявки',
  won: 'Выиграны',
  lost: 'Проиграны',
};

function formatMoney(amount, currency) {
  const n = Number(amount) || 0;
  const cur = currency || 'RUB';
  try {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: cur === 'CNY' ? 'CNY' : cur === 'USD' ? 'USD' : 'RUB',
      maximumFractionDigits: 0,
    }).format(n);
  } catch (_) {
    return n.toLocaleString('ru-RU') + ' ' + cur;
  }
}

function buildTvPayload() {
  const db = getDb();
  const tenders = db
    .prepare(
      `SELECT t.id, t.tender_no, t.title, t.platform, t.nmck, t.currency,
              t.deadline, t.status, t.region, t.progress, t.notes, t.owner_id,
              u.display_name AS owner_name, u.username AS owner_username
       FROM tenders t
       LEFT JOIN users u ON u.id = t.owner_id
       ORDER BY
         CASE t.status
           WHEN 'application' THEN 1
           WHEN 'in_work' THEN 2
           WHEN 'found' THEN 3
           WHEN 'won' THEN 4
           WHEN 'lost' THEN 5
           ELSE 6 END,
         COALESCE(t.deadline, '9999-12-31') ASC,
         t.id ASC`
    )
    .all();

  const tasks = db
    .prepare(
      `SELECT tt.id, tt.tender_id, tt.title, tt.progress, tt.status,
              tt.assignee_id,
              u.display_name AS assignee_name, u.username AS assignee_username,
              t.tender_no, t.title AS tender_title, t.status AS tender_status
       FROM tender_tasks tt
       JOIN users u ON u.id = tt.assignee_id
       JOIN tenders t ON t.id = tt.tender_id
       WHERE tt.status = 'open'
       ORDER BY tt.progress DESC, tt.id ASC
       LIMIT 40`
    )
    .all();

  const stages = STAGE_ORDER.map((key) => {
    const items = tenders
      .filter((t) => t.status === key)
      .map((t) => ({
        id: t.id,
        tender_no: t.tender_no,
        title: t.title,
        platform: t.platform,
        sum: t.nmck,
        sum_label: formatMoney(t.nmck, t.currency),
        currency: t.currency,
        deadline: t.deadline,
        status: t.status,
        status_label: STAGE_LABELS[t.status] || t.status,
        region: t.region,
        progress: t.progress,
        notes: t.notes,
        owner: t.owner_id
          ? { id: t.owner_id, display_name: t.owner_name, username: t.owner_username }
          : null,
      }));
    const sum = items.reduce((a, b) => a + (Number(b.sum) || 0), 0);
    return {
      key,
      label: STAGE_LABELS[key],
      count: items.length,
      sum,
      sum_label: formatMoney(sum, 'RUB'),
      items,
    };
  });

  const counts = Object.fromEntries(stages.map((s) => [s.key, s.count]));

  return {
    ok: true,
    updated_at: new Date().toISOString(),
    stages,
    counts,
    totals: {
      tenders: tenders.length,
      open_tasks: tasks.length,
      pipeline_sum: tenders
        .filter((t) => t.status !== 'lost')
        .reduce((a, b) => a + (Number(b.nmck) || 0), 0),
    },
    employee_tasks: tasks.map((tt) => ({
      id: tt.id,
      title: tt.title,
      progress: tt.progress,
      status: tt.status,
      assignee: {
        id: tt.assignee_id,
        display_name: tt.assignee_name,
        username: tt.assignee_username,
      },
      tender: {
        id: tt.tender_id,
        tender_no: tt.tender_no,
        title: tt.tender_title,
        status: tt.tender_status,
        status_label: STAGE_LABELS[tt.tender_status] || tt.tender_status,
      },
    })),
    labels: STAGE_LABELS,
  };
}

/**
 * Public SRM TV feed for big-screen crm-tv.html (no auth — office display).
 * GET /api/tv  and  GET /api/tenders/tv
 */
function mountTvRoutes(app) {
  const handler = (_req, res) => {
    try {
      res.json(buildTvPayload());
    } catch (err) {
      console.error('[tv] failed', err.message);
      res.status(500).json({ ok: false, error: 'tv_unavailable', message: err.message });
    }
  };
  app.get('/api/tv', handler);
  app.get('/api/tenders/tv', handler);
}

module.exports = { mountTvRoutes, buildTvPayload, STAGE_ORDER, STAGE_LABELS };
