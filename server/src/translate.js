'use strict';

/**
 * Chat / general MT gateway (EN ↔ CN ↔ RU).
 *
 * 1) LibreTranslate when TRANSLATE_URL is set (optional TRANSLATE_API_KEY)
 * 2) Else built-in phrase mock + lighting glossary from tenders pipeline
 * 3) Re-exports translateAndReconcile for product rows when available
 *
 * Env:
 *   TRANSLATE_URL=https://libretranslate.example  (no trailing slash)
 *   TRANSLATE_API_KEY=
 *   TRANSLATE_MOCK=1  force mock even if URL set
 */

const SUPPORTED = new Set(['ru', 'zh', 'en']);

function normalizeLang(lang) {
  const s = String(lang || '').toLowerCase().trim();
  if (s === 'cn' || s === 'zh-cn' || s === 'zh_cn' || s === 'chinese') return 'zh';
  if (s === 'ru-ru' || s === 'russian') return 'ru';
  if (s === 'en-us' || s === 'en-gb' || s === 'english') return 'en';
  if (SUPPORTED.has(s)) return s;
  return null;
}

/** Detect dominant script/language of free text. */
function detectLang(text) {
  const t = String(text || '').trim();
  if (!t) return null;
  const han = (t.match(/[\u4e00-\u9fff]/g) || []).length;
  const cyr = (t.match(/[А-Яа-яЁё]/g) || []).length;
  const lat = (t.match(/[A-Za-z]/g) || []).length;
  if (han >= 2 && han >= cyr && han >= lat * 0.4) return 'zh';
  if (cyr >= 3 && cyr >= lat) return 'ru';
  if (lat >= 3 && lat > cyr && han === 0) return 'en';
  if (han > 0) return 'zh';
  if (cyr > 0) return 'ru';
  if (lat > 0) return 'en';
  return null;
}

/** Phrase dictionary for demo + common chat (bidirectional via inverse build). */
const PHRASES = [
  // RU ↔ ZH
  ['Да, финальное КП в хранилище. Отправлю сегодня до 15:00.', '是的，最终报价在存储里。今天15:00前发出。', 'Yes, final quote is in storage. I will send by 15:00 today.'],
  ['Алексей, КП по Альфа Лайт готово к отправке?', '阿列克谢，Alfa Light 报价可以发了吗？', 'Alexey, is the Alfa Light quote ready to send?'],
  ['Клиентская цена RU: 890 000 ₽. Не дублируй CN-цифры в чат.', '俄侧客户价 890 000 ₽。不要在聊天里重复中国价格。', 'RU client price: 890 000 ₽. Do not paste CN figures in chat.'],
  ['Ок, добавь в план галочку — директору уйдёт.', '好的，在计划里打勾——会发给总监。', 'OK, tick it in the plan — it will go to the director.'],
  ['Нужен расчёт по чертежу LI-2910S, стекло бронза', '需要图纸 LI-2910S 核算，青铜玻璃', 'Need a calculation for drawing LI-2910S, bronze glass'],
  ['Нужен расчёт по чертежу', '需要图纸核算', 'Need a calculation from the drawing'],
  ['Готово к отправке', '可以发货了', 'Ready to ship'],
  ['Отправлю сегодня', '今天会发送', 'I will send it today'],
  ['Клиентская цена', '客户价格', 'Client price'],
  ['Не дублируй CN-цифры в чат', '不要在聊天里重复中国价格', 'Do not paste CN figures in chat'],
  ['Ок, добавь в план галочку', '好的，在计划里打勾', 'OK, tick it in the plan'],
  ['директору уйдёт', '会发给总监', 'will go to the director'],
  ['Фото витрины с образцами', '样品展柜照片', 'Photo of the sample display'],
  ['Клиент ЖК Фрунзенский ждёт образцы', '弗龙泽住宅客户在等样品', 'Frunzensky client is waiting for samples'],
  ['Напоминание на завтра', '明天的提醒', 'Reminder for tomorrow'],
  ['уже в задачах', '已在任务里', 'already in tasks'],
  ['Нужен статус', '需要状态', 'Need status'],
  ['Спецификация после КП загружена', '报价后的规格已上传', 'Spec after quote uploaded'],
  ['Принял', '收到了', 'Got it'],
  ['Задача на напоминание про образцы', '样品提醒任务', 'Sample reminder task'],
  ['Сумма сделки', '成交金额', 'Deal amount'],
  ['Фото макета лобби', '大堂模型照片', 'Lobby mockup photo'],
  ['Нужна финальная спецификация до пятницы', '周五前需要最终规格', 'Need final spec by Friday'],
  ['Черновик в хранилище', '草稿在存储里', 'Draft is in storage'],
  ['Старт ритейл-пакета', '零售套餐启动', 'Retail package kickoff'],
  ['Ритейл-цена для сети', '连锁零售价', 'Retail price for the chain'],
  ['переторжка в папке', '二次报价在文件夹里', 'rebid is in the folder'],
  ['сводка по просроченным задачам', '逾期任务汇总', 'overdue tasks summary'],
  ['Две просрочки закрываю', '两件逾期我会关掉', 'Closing two overdue items'],
  ['Счёт Альфа Лайт на согласовании', 'Alfa Light 账单审批中', 'Alfa Light invoice pending approval'],
  ['Цены CN в отчёте мне не дублируй', '报告里别给我重复中国价格', 'Do not duplicate CN prices in the report for me'],
  ['смотрю в CRM', '我在 CRM 里看', 'I check in CRM'],
  ['Нужен статус по счёту', '需要账单状态', 'Need invoice status'],
  ['ожидает меня', '等我处理', 'waiting for me'],
  ['Начните переписку…', '开始对话…', 'Start the conversation…'],
  ['Образцы готовы', '样品已就绪', 'Samples are ready'],
  ['明天可以发货', '明天可以发货', 'Can ship tomorrow'],
  ['请发追踪号到 RU 共享文件夹', '请发追踪号到 RU 共享文件夹', 'Please send tracking to the RU shared folder'],
  ['工厂报价', '工厂报价', 'Factory quote'],
  ['不要在这里贴俄罗斯零售价', '不要在这里贴俄罗斯零售价', 'Do not paste RU retail here'],
  ['好的，追踪 PDF 放在账单/招标文件夹', '好的，追踪 PDF 放在账单/招标文件夹', 'OK, put tracking PDF under invoice / tender folder'],
  ['包装线照片', '包装线照片', 'Photo of packing line'],
  ['需要俄罗斯招标编号', '需要俄罗斯招标编号', 'Need RU tender number'],
  ['下周产线空闲', '下周产线空闲', 'Line free next week'],
  // EN ↔ RU / ZH (CN team often writes EN in demo)
  ['Samples for Frunzensky ready for ship tomorrow.', 'Образцы для Фрунзенского готовы к отгрузке завтра.', '弗龙泽样品明天可发货。'],
  ['Great. Send tracking to RU shared folder.', 'Отлично. Пришлите трек в общую папку RU.', '很好。请把运单发到 RU 共享文件夹。'],
  ['Factory quote CNY 198000 for batch. Do not paste RU retail here.', 'Заводская цена CNY 198000 за партию. Не вставляйте RU-розницу сюда.', '工厂报价 CNY 198000。不要在这里贴俄罗斯零售价。'],
  ['OK, put tracking PDF under счет / tender folder.', 'Ок, положите PDF трека в папку счёт / tender.', '好的，把运单 PDF 放到账单/招标文件夹。'],
  ['Photo of packing line.', 'Фото упаковочной линии.', '包装线照片。'],
  ['CN-Phase 2 street lights: need RU tender number.', 'CN-Phase 2 уличные светильники: нужен номер RU-тендера.', 'CN-Phase 2 路灯：需要俄罗斯招标编号。'],
  ['Zhongshan line free next week for LED Platform.', 'Линия в Чжуншане свободна на следующей неделе под LED Platform.', '中山产线下周空闲，可用于 LED Platform。'],
  ['Street lights BOM attached.', 'BOM уличных светильников во вложении.', '路灯 BOM 已附上。'],
  ['IoT hub firmware photo from lab.', 'Фото прошивки IoT-хаба из лаборатории.', '实验室 IoT 网关固件照片。'],
  ['Samples BOM confirmed', 'BOM образцов подтверждён', '样品 BOM 已确认'],
  ['New RFQ for 6W spot samples', 'Новый RFQ на образцы спотов 6W', '6W 射灯样品新询价'],
];

/** Build lookup: langPair → Map(normalizedSource → target) */
function buildPhraseMaps() {
  /** @type {Record<string, Map<string, string>>} */
  const maps = {};
  function key(a, b) {
    return `${a}>${b}`;
  }
  function add(from, to, src, dst) {
    const k = key(from, to);
    if (!maps[k]) maps[k] = new Map();
    maps[k].set(normKey(src), dst);
  }
  for (const row of PHRASES) {
    const [a, b, c] = row;
    // Heuristic column roles by script
    const langs = row.map((t) => detectLang(t) || 'en');
    for (let i = 0; i < row.length; i++) {
      for (let j = 0; j < row.length; j++) {
        if (i === j) continue;
        const fi = langs[i];
        const fj = langs[j];
        if (!fi || !fj || fi === fj) continue;
        add(fi, fj, row[i], row[j]);
      }
    }
    // Explicit triples when present: treat as ru, zh, en if detectable
    if (row.length >= 3) {
      const ru = row.find((t) => detectLang(t) === 'ru');
      const zh = row.find((t) => detectLang(t) === 'zh');
      const en = row.find((t) => detectLang(t) === 'en');
      if (ru && zh) {
        add('ru', 'zh', ru, zh);
        add('zh', 'ru', zh, ru);
      }
      if (ru && en) {
        add('ru', 'en', ru, en);
        add('en', 'ru', en, ru);
      }
      if (zh && en) {
        add('zh', 'en', zh, en);
        add('en', 'zh', en, zh);
      }
      // Also bind exact demo EN strings that detect as en
      if (a && b && c) {
        // first pass already covered
      }
    }
  }
  return maps;
}

function normKey(s) {
  return String(s || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

const PHRASE_MAPS = buildPhraseMaps();

let glossaryCache = null;
function loadGlossary() {
  if (glossaryCache) return glossaryCache;
  try {
    const pipe = require('../scripts/tenders/pipeline/translate');
    glossaryCache = {
      ruEn: pipe.GLOSSARY_RU_EN || {},
      ruCn: pipe.GLOSSARY_RU_CN || {},
      translateText: pipe.translateText,
      translateAndReconcile: pipe.translateAndReconcile,
    };
  } catch {
    glossaryCache = { ruEn: {}, ruCn: {}, translateText: null, translateAndReconcile: null };
  }
  return glossaryCache;
}

function applyMap(text, map) {
  let out = String(text || '');
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    const re = new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    out = out.replace(re, map[k]);
  }
  return out.replace(/\s+/g, ' ').trim();
}

function invertMap(map) {
  const out = {};
  for (const [k, v] of Object.entries(map)) {
    if (v && !out[v]) out[v] = k;
  }
  return out;
}

function mockTranslate(text, from, to) {
  const src = String(text || '').trim();
  if (!src) return '';
  if (from === to) return src;

  const pair = PHRASE_MAPS[`${from}>${to}`];
  if (pair) {
    const hit = pair.get(normKey(src));
    if (hit) return hit;
    // Partial only if phrase covers most of the message (avoid tiny fragment hits)
    let bestKey = '';
    let bestVal = null;
    const nk = normKey(src);
    for (const [k, v] of pair.entries()) {
      if (k.length >= 16 && nk.includes(k) && k.length > bestKey.length && k.length >= nk.length * 0.55) {
        bestKey = k;
        bestVal = v;
      }
    }
    if (bestVal) return bestVal;
  }

  const g = loadGlossary();
  function mostlyTranslated(out, srcLang) {
    if (!out || out === src) return false;
    if (srcLang === 'ru') {
      const cyr = (out.match(/[А-Яа-яЁё]/g) || []).length;
      return cyr < Math.max(3, (src.match(/[А-Яа-яЁё]/g) || []).length * 0.5);
    }
    if (srcLang === 'zh') {
      const han = (out.match(/[\u4e00-\u9fff]/g) || []).length;
      return han < Math.max(2, (src.match(/[\u4e00-\u9fff]/g) || []).length * 0.5);
    }
    return out !== src;
  }
  if (from === 'ru' && to === 'en' && g.ruEn) {
    const out = applyMap(src, g.ruEn);
    if (mostlyTranslated(out, 'ru')) return out;
  }
  if (from === 'ru' && to === 'zh' && g.ruCn) {
    const out = applyMap(src, g.ruCn);
    if (mostlyTranslated(out, 'ru')) return out;
  }
  if (from === 'en' && to === 'ru' && g.ruEn) {
    const out = applyMap(src, invertMap(g.ruEn));
    if (out && out !== src) return out;
  }
  if (from === 'zh' && to === 'ru' && g.ruCn) {
    const out = applyMap(src, invertMap(g.ruCn));
    if (out && out !== src && mostlyTranslated(out, 'zh')) return out;
  }
  if (from === 'en' && to === 'zh') return `[中] ${src}`;
  if (from === 'zh' && to === 'en') return `[EN] ${src}`;
  if (from === 'ru' && to === 'zh') return `[中] ${src}`;
  if (from === 'zh' && to === 'ru') return `[RU] ${src}`;
  if (from === 'ru' && to === 'en') return `[EN] ${src}`;
  if (from === 'en' && to === 'ru') return `[RU] ${src}`;
  return src;
}

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function libreTranslate(text, from, to) {
  const base = String(process.env.TRANSLATE_URL || '').replace(/\/$/, '');
  if (!base || process.env.TRANSLATE_MOCK === '1') return null;
  const body = {
    q: text,
    source: from === 'zh' ? 'zh' : from,
    target: to === 'zh' ? 'zh' : to,
    format: 'text',
  };
  if (process.env.TRANSLATE_API_KEY) body.api_key = process.env.TRANSLATE_API_KEY;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`${base}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    const out = data && (data.translatedText || data.translation || data.text);
    return out ? String(out) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Free MyMemory MT (no API key). langpair e.g. ru|zh-CN.
 * Returns null on any failure (quiet).
 */
async function myMemoryTranslate(text, from, to) {
  const src = String(text || '').trim();
  if (!src || process.env.TRANSLATE_MOCK === '1') return null;
  const srcLang = from === 'zh' ? 'zh-CN' : from;
  const tgtLang = to === 'zh' ? 'zh-CN' : to;
  const url =
    'https://api.mymemory.translated.net/get?q=' +
    encodeURIComponent(src.slice(0, 450)) +
    '&langpair=' +
    encodeURIComponent(srcLang + '|' + tgtLang);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || Number(data.responseStatus) !== 200) return null;
    const out = data.responseData && data.responseData.translatedText;
    if (!out) return null;
    const s = String(out).trim();
    if (!s || /MYMEMORY WARNING/i.test(s) || /QUERY LENGTH LIMIT/i.test(s)) return null;
    if (s === src) return null;
    return s;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * RU → simplified Chinese for voice transcripts.
 * LibreTranslate → MyMemory → phrase mock (non-tagged). Null on failure, never throws.
 */
async function translateRuToZhSafe(text) {
  const src = String(text || '').trim();
  if (!src) return null;
  try {
    const remote = await libreTranslate(src, 'ru', 'zh');
    if (remote && remote.trim() && remote.trim() !== src) return remote.trim();
    const mm = await myMemoryTranslate(src, 'ru', 'zh');
    if (mm) return mm;
    const mocked = mockTranslate(src, 'ru', 'zh');
    if (mocked && mocked !== src && !/^\[中\]\s/.test(mocked)) return mocked;
    return null;
  } catch {
    return null;
  }
}

/**
 * Translate free text between ru/zh/en.
 * @returns {Promise<{ text: string, from: string, to: string, provider: string }>}
 */
async function translateText(text, targetLang, sourceLang) {
  const to = normalizeLang(targetLang);
  const srcText = String(text || '');
  let from = normalizeLang(sourceLang) || detectLang(srcText);
  if (!to) {
    return { text: srcText, from: from || 'und', to: 'und', provider: 'none' };
  }
  if (!from) from = to;
  if (from === to) {
    return { text: srcText, from, to, provider: 'identity' };
  }

  const remote = await libreTranslate(srcText, from, to);
  if (remote) {
    return { text: remote, from, to, provider: 'libretranslate' };
  }

  const mm = await myMemoryTranslate(srcText, from, to);
  if (mm) {
    return { text: mm, from, to, provider: 'mymemory' };
  }

  const mocked = mockTranslate(srcText, from, to);
  // If mock only tagged with [中]/[EN]/[RU], try tenders glossary as second pass
  const tagged = /^\[(中|EN|RU)\]\s/.test(mocked);
  if (tagged) {
    const g = loadGlossary();
    if (g.translateText && from === 'ru' && (to === 'en' || to === 'zh')) {
      try {
        const via = await g.translateText(srcText, to === 'zh' ? 'cn' : 'en');
        if (via && via !== srcText && via !== mocked) {
          return { text: via, from, to, provider: 'glossary' };
        }
      } catch {
        /* keep mock */
      }
    }
  }
  return { text: mocked, from, to, provider: 'mock' };
}

/**
 * Target language for a chat bubble:
 * - own message → peer language
 * - peer message → my language
 */
function translationTarget({ isMine, myLang, peerLang }) {
  const me = normalizeLang(myLang);
  const peer = normalizeLang(peerLang);
  if (isMine) return peer || me;
  return me || peer;
}

/**
 * Build auto-translation payload for one message (or null if not needed).
 */
async function autoTranslateMessage(text, opts = {}) {
  const raw = String(text || '');
  const detected = detectLang(raw);
  const target = translationTarget(opts);
  if (!target || !detected || detected === target) {
    return null;
  }
  // Only supported pairs CN↔RU, CN↔EN, RU↔EN
  const pairOk =
    (detected === 'zh' && (target === 'ru' || target === 'en')) ||
    (detected === 'ru' && (target === 'zh' || target === 'en')) ||
    (detected === 'en' && (target === 'zh' || target === 'ru'));
  if (!pairOk) return null;

  const result = await translateText(raw, target, detected);
  if (!result.text || result.text === raw) return null;
  return {
    text: result.text,
    from: result.from,
    to: result.to,
    provider: result.provider,
  };
}

function peerLocaleFromMembers(members, viewerId) {
  const others = (members || []).filter((m) => m.id !== viewerId);
  if (!others.length) return null;
  // Prefer a locale different from viewer when present
  const locales = others.map((m) => normalizeLang(m.locale) || (m.role === 'cn' ? 'zh' : 'ru'));
  const zh = locales.find((l) => l === 'zh');
  const ru = locales.find((l) => l === 'ru');
  if (zh && ru) return zh; // bilingual room: default peer display zh for RU writer etc. — caller passes per-message
  return locales[0] || null;
}

async function translateAndReconcile(rows, opts) {
  const g = loadGlossary();
  if (g.translateAndReconcile) return g.translateAndReconcile(rows, opts);
  // Minimal fallback: glossary-only via mock
  const items = [];
  for (const row of rows || []) {
    const name_en = (await translateText(row.name, 'en', 'ru')).text;
    const name_cn = (await translateText(row.name, 'zh', 'ru')).text;
    const specs_en = (await translateText(row.specs, 'en', 'ru')).text;
    const specs_cn = (await translateText(row.specs, 'zh', 'ru')).text;
    items.push({
      ...row,
      name_ru: row.name,
      specs_ru: row.specs,
      name_en,
      name_cn,
      specs_en,
      specs_cn,
    });
  }
  return { status: 'ok', items, divergences: [], retries: 0 };
}

function mountTranslateRoutes(app, authMiddleware) {
  app.post('/api/translate', authMiddleware, async (req, res) => {
    try {
      const { text, target, source, myLang, peerLang, isMine } = req.body || {};
      if (typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ error: 'text_required' });
      }
      if (myLang || peerLang || typeof isMine === 'boolean') {
        const auto = await autoTranslateMessage(text, {
          isMine: Boolean(isMine),
          myLang: myLang || req.user.locale,
          peerLang: peerLang || (req.user.locale === 'zh' ? 'ru' : 'zh'),
        });
        return res.json({
          translation: auto,
          detected: detectLang(text),
        });
      }
      const to = normalizeLang(target);
      if (!to) return res.status(400).json({ error: 'target_required' });
      const result = await translateText(text, to, source);
      res.json({
        text: result.text,
        from: result.from,
        to: result.to,
        provider: result.provider,
        detected: detectLang(text),
      });
    } catch (e) {
      res.status(500).json({ error: e.message || 'translate_failed' });
    }
  });
}

module.exports = {
  detectLang,
  normalizeLang,
  translateText,
  translateRuToZhSafe,
  myMemoryTranslate,
  autoTranslateMessage,
  translationTarget,
  peerLocaleFromMembers,
  translateAndReconcile,
  mountTranslateRoutes,
  SUPPORTED: [...SUPPORTED],
};
