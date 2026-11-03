'use strict';

/**
 * Фильтр утечки контактов в свободном чате.
 * Телефоны, email, WeChat, Telegram — только через карточки / structured requests.
 */

const PHONE_PATTERNS = [
  /(?:\+?\s*7|8)[\s\-()]*(?:\d[\s\-()]*){9,11}/,
  /(?:\+?\s*86)[\s\-()]*(?:\d[\s\-()]*){8,13}/,
  /(?:\+?\s*\d{1,3})[\s\-()]*(?:\d[\s\-()]*){7,14}/,
  /(?:\d[\s\-.]*){10,}/,
];

const EMAIL_PATTERNS = [
  /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/,
];

const WECHAT_PATTERNS = [
  /we\s*-?\s*chat/i,
  /weixin/i,
  /в[еэ]йчат/i,
  /вичат/i,
  /\u5fae\u4fe1/,
  /wx\s*[=:]\s*[a-zA-Z][\w.-]{4,}/i,
  /wechat\s*(?:id)?\s*[=:]\s*[a-zA-Z0-9_.-]{5,}/i,
];

const TELEGRAM_PATTERNS = [
  /(?:^|[^\w])@[a-zA-Z][a-zA-Z0-9_]{4,}(?:$|[^\w])/,
  /t\.me\/[a-zA-Z0-9_]+/i,
  /telegram\s*(?:id|user|username)?\s*[=:]?\s*@?[a-zA-Z0-9_]{4,}/i,
  /телеграм(?:м)?\s*(?:id|юзер|ник)?\s*[=:]?\s*@?[a-zA-Z0-9_]{4,}/i,
];

const BYPASS_PHRASES = [
  /напиш(?:и|ите)\s+(?:мне\s+)?(?:в\s+)?(?:вотсап|whatsapp|телеграм|telegram|вайбер|viber)/i,
  /дай(?:те)?\s+(?:свой\s+)?(?:номер|телефон|wechat|вичат|вэчат|email|почту|мейл)/i,
  /скинь(?:те)?\s+(?:номер|телефон|wechat|вичат|email|почту)/i,
  /обмен(?:яемся|яться)?\s+(?:контакт|номер|телефон|wechat)/i,
  /свяж(?:емся|итесь)\s+(?:напрямую|вне\s+систем)/i,
  /outside\s+(?:the\s+)?(?:system|app|chat)/i,
  /add\s+me\s+on\s+wechat/i,
  /\u52a0\u6211\u5fae\u4fe1/,
  /\u79c1\u4e0b\u8054\u7cfb/,
  /\u76f4\u63a5\u8054\u7cfb/,
];

/**
 * @param {string} text
 * @returns {{ ok: true } | { ok: false, reason: string, matched: string }}
 */
function checkContactLeak(text) {
  const s = String(text || '');
  if (!s.trim()) {
    return { ok: false, reason: 'empty_message', matched: '' };
  }

  for (const re of PHONE_PATTERNS) {
    const m = s.match(re);
    if (m) {
      return { ok: false, reason: 'phone_pattern', matched: m[0].slice(0, 40) };
    }
  }

  for (const re of EMAIL_PATTERNS) {
    const m = s.match(re);
    if (m) {
      return { ok: false, reason: 'email_pattern', matched: m[0].slice(0, 60) };
    }
  }

  for (const re of WECHAT_PATTERNS) {
    const m = s.match(re);
    if (m) {
      return { ok: false, reason: 'wechat_pattern', matched: m[0].slice(0, 40) };
    }
  }

  for (const re of TELEGRAM_PATTERNS) {
    const m = s.match(re);
    if (m) {
      return { ok: false, reason: 'telegram_pattern', matched: m[0].slice(0, 40) };
    }
  }

  for (const re of BYPASS_PHRASES) {
    const m = s.match(re);
    if (m) {
      return { ok: false, reason: 'bypass_phrase', matched: m[0].slice(0, 60) };
    }
  }

  return { ok: true };
}

/** CN price / currency snippets — hide from RU (and non-admin/director). */
const CN_PRICE_PATTERNS = [
  /price_cn\s*[:=]\s*[^\s,;]+/gi,
  /(?:CNY|RMB|¥|￥)\s*[\d][\d\s.,]*/gi,
  /[\d][\d\s.,]*\s*(?:CNY|RMB|¥|￥|元)/gi,
  /китайск(?:ая|ой|ие)\s+цен[аыуе]\s*[:=]?\s*[\d][\d\s.,]*/gi,
];

/** RU price snippets — hide from CN. */
const RU_PRICE_PATTERNS = [
  /price_ru\s*[:=]\s*[^\s,;]+/gi,
  /(?:RUB|₽)\s*[\d][\d\s.,]*/gi,
  /[\d][\d\s.,]*\s*(?:RUB|₽|руб\.?)/gi,
  /российск(?:ая|ой|ие)\s+цен[аыуе]\s*[:=]?\s*[\d][\d\s.,]*/gi,
];

/**
 * Редактирует цены в тексте сообщения по роли зрителя.
 * admin/director видят всё; ru — без CN; cn — без RU.
 * @param {string} text
 * @param {string} role
 * @returns {string}
 */
function redactMessagePrices(text, role) {
  let s = String(text || '');
  const r = String(role || '').toLowerCase();
  if (r === 'admin' || r === 'director') return s;
  if (r === 'ru') {
    for (const re of CN_PRICE_PATTERNS) {
      s = s.replace(re, '[цена CN скрыта]');
    }
  } else if (r === 'cn') {
    for (const re of RU_PRICE_PATTERNS) {
      s = s.replace(re, '[цена RU скрыта]');
    }
  }
  return s;
}

module.exports = {
  checkContactLeak,
  redactMessagePrices,
  PHONE_PATTERNS,
  EMAIL_PATTERNS,
  WECHAT_PATTERNS,
  TELEGRAM_PATTERNS,
  BYPASS_PHRASES,
  CN_PRICE_PATTERNS,
  RU_PRICE_PATTERNS,
};
