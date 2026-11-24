'use strict';

/**
 * Date display and user-facing API errors for the selected UI language.
 * The browser's own date widget is not used: Chrome formats it from the OS locale.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.GililLocale = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function spec(lang) {
    if (lang === 'ru') return { order: 'dmy', sep: '.' };
    if (lang === 'zh') return { order: 'ymd', sep: '-' };
    return { order: 'mdy', sep: '/' };
  }

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function formatDate(iso, lang) {
    const p = String(iso || '').split('-');
    if (p.length !== 3) return '';
    const y = p[0];
    const m = p[1];
    const d = p[2];
    if (!/^\d{4}$/.test(y) || !/^\d{2}$/.test(m) || !/^\d{2}$/.test(d)) return '';
    const s = spec(lang);
    const parts = { y: y, m: m, d: d };
    return s.order.split('').map((ch) => parts[ch]).join(s.sep);
  }

  function parseDate(text, lang) {
    const raw = String(text || '').trim();
    if (!raw) return { empty: true, iso: '', invalid: false };
    const s = spec(lang);
    const bits = raw.split(/[^\d]+/).filter(Boolean);
    if (bits.length !== 3) return { empty: false, iso: '', invalid: true };
    let y;
    let m;
    let d;
    if (s.order === 'dmy') {
      d = bits[0]; m = bits[1]; y = bits[2];
    } else if (s.order === 'mdy') {
      m = bits[0]; d = bits[1]; y = bits[2];
    } else {
      y = bits[0]; m = bits[1]; d = bits[2];
    }
    if (y.length === 2) y = '20' + y;
    if (y.length !== 4) return { empty: false, iso: '', invalid: true };
    const yi = Number(y);
    const mi = Number(m);
    const di = Number(d);
    if (mi < 1 || mi > 12 || di < 1 || di > 31) return { empty: false, iso: '', invalid: true };
    const dt = new Date(yi, mi - 1, di);
    if (dt.getFullYear() !== yi || dt.getMonth() !== mi - 1 || dt.getDate() !== di) {
      return { empty: false, iso: '', invalid: true };
    }
    return { empty: false, iso: y + '-' + pad(mi) + '-' + pad(di), invalid: false };
  }

  function parseTime(text) {
    const raw = String(text || '').trim();
    if (!raw) return { empty: true, value: '', invalid: false };
    const m = raw.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return { empty: false, value: '', invalid: true };
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (h > 23 || min > 59) return { empty: false, value: '', invalid: true };
    return { empty: false, value: pad(h) + ':' + pad(min), invalid: false };
  }

  const ERR = {
    ru: {
      unauthorized: 'Нужен вход.',
      invalid_token: 'Сессия недействительна. Войдите снова.',
      invalid_token_type: 'Сессия недействительна. Войдите снова.',
      token_revoked: 'Сессия завершена. Войдите снова.',
      user_not_found: 'Пользователь не найден.',
      username_password_required: 'Введите имя и пароль.',
      invalid_credentials: 'Неверное имя или пароль.',
      rate_limited: 'Слишком много попыток. Подождите и повторите.',
      invalid_email: 'Укажите корректную почту.',
      resend_cooldown: 'Подождите перед повторной отправкой кода.',
      smtp_sender_not_allowed: 'Этот адрес не может отправлять письма.',
      mail_send_failed: 'Не удалось отправить письмо.',
      invalid_email_or_code: 'Почта или код не подходят.',
      invalid_code: 'Неверный код.',
      code_expired: 'Срок кода истёк.',
      too_many_attempts: 'Слишком много попыток. Запросите новый код.',
      login_failed: 'Не удалось войти.',
      otp_request_failed: 'Не удалось отправить код.',
      forbidden: 'Недостаточно прав.',
      not_a_member: 'Нет доступа к этому диалогу.',
      text_required: 'Введите текст.',
      contact_leak: 'Сообщение содержит контакт, который нельзя отправлять.',
      not_found: 'Запись не найдена.',
      name_required: 'Укажите название.',
      manager_ru_required: 'Выберите менеджера RU.',
      manager_cn_required: 'Выберите менеджера CN.',
      manager_ru_invalid: 'Менеджер RU не подходит.',
      manager_cn_invalid: 'Менеджер CN не подходит.',
      general_locked: 'Генерала нельзя убрать с проекта.',
      field_protected: 'Это поле нельзя изменить.',
      field_not_editable: 'Это поле нельзя изменить.',
      display_name_required: 'Укажите имя.',
      display_name_invalid: 'Имя не подходит.',
      profile_company_invalid: 'Название компании не подходит.',
      invalid_body: 'Проверьте введённые данные.',
      internal_error: 'Внутренняя ошибка. Повторите позже.',
      news_unavailable: 'Новости сейчас недоступны.',
      tv_unavailable: 'Экран SRM TV сейчас недоступен.',
      als_list_failed: 'Не удалось загрузить список студии.',
      als_save_failed: 'Не удалось сохранить запись студии.',
      invalid_als_token: 'Нужен вход в Gilil On.',
      network: 'Нет связи с сервером.',
      http: 'Запрос не выполнен.',
      unknown: 'Запрос не выполнен ({code}).',
    },
    en: {
      unauthorized: 'Sign-in required.',
      invalid_token: 'The session is not valid. Sign in again.',
      invalid_token_type: 'The session is not valid. Sign in again.',
      token_revoked: 'The session has ended. Sign in again.',
      user_not_found: 'User not found.',
      username_password_required: 'Enter a username and password.',
      invalid_credentials: 'The username or password is wrong.',
      rate_limited: 'Too many attempts. Wait and try again.',
      invalid_email: 'Enter a valid email address.',
      resend_cooldown: 'Wait before sending another code.',
      smtp_sender_not_allowed: 'This address cannot send mail.',
      mail_send_failed: 'The message could not be sent.',
      invalid_email_or_code: 'The email or code does not match.',
      invalid_code: 'The code is wrong.',
      code_expired: 'The code has expired.',
      too_many_attempts: 'Too many attempts. Request a new code.',
      login_failed: 'Sign-in failed.',
      otp_request_failed: 'The code could not be sent.',
      forbidden: 'You do not have permission.',
      not_a_member: 'You do not have access to this conversation.',
      text_required: 'Enter some text.',
      contact_leak: 'The message contains a contact that cannot be sent.',
      not_found: 'The record was not found.',
      name_required: 'Enter a name.',
      manager_ru_required: 'Choose an RU manager.',
      manager_cn_required: 'Choose a CN manager.',
      manager_ru_invalid: 'The RU manager is not valid.',
      manager_cn_invalid: 'The CN manager is not valid.',
      general_locked: 'The general cannot be removed from a project.',
      field_protected: 'This field cannot be changed.',
      field_not_editable: 'This field cannot be changed.',
      display_name_required: 'Enter a name.',
      display_name_invalid: 'The name is not valid.',
      profile_company_invalid: 'The company name is not valid.',
      invalid_body: 'Check the values you entered.',
      internal_error: 'Internal error. Try again later.',
      news_unavailable: 'News is unavailable right now.',
      tv_unavailable: 'The SRM TV screen is unavailable right now.',
      als_list_failed: 'The studio list could not be loaded.',
      als_save_failed: 'The studio entry could not be saved.',
      invalid_als_token: 'Sign in to Gilil On first.',
      network: 'The server could not be reached.',
      http: 'The request failed.',
      unknown: 'The request failed ({code}).',
    },
    zh: {
      unauthorized: '需要登录。',
      invalid_token: '会话无效，请重新登录。',
      invalid_token_type: '会话无效，请重新登录。',
      token_revoked: '会话已结束，请重新登录。',
      user_not_found: '未找到用户。',
      username_password_required: '请输入用户名和密码。',
      invalid_credentials: '用户名或密码不正确。',
      rate_limited: '尝试次数过多，请稍后再试。',
      invalid_email: '请输入有效的邮箱。',
      resend_cooldown: '请稍候再发送验证码。',
      smtp_sender_not_allowed: '此地址不能发送邮件。',
      mail_send_failed: '邮件未能发送。',
      invalid_email_or_code: '邮箱或验证码不正确。',
      invalid_code: '验证码不正确。',
      code_expired: '验证码已过期。',
      too_many_attempts: '尝试次数过多，请重新获取验证码。',
      login_failed: '登录失败。',
      otp_request_failed: '验证码未能发送。',
      forbidden: '权限不足。',
      not_a_member: '无权查看此对话。',
      text_required: '请输入文字。',
      contact_leak: '消息中含有不允许发送的联系方式。',
      not_found: '未找到记录。',
      name_required: '请填写名称。',
      manager_ru_required: '请选择俄方经理。',
      manager_cn_required: '请选择中方经理。',
      manager_ru_invalid: '俄方经理无效。',
      manager_cn_invalid: '中方经理无效。',
      general_locked: '不能把总经理从项目中移除。',
      field_protected: '此字段不能修改。',
      field_not_editable: '此字段不能修改。',
      display_name_required: '请填写姓名。',
      display_name_invalid: '姓名无效。',
      profile_company_invalid: '公司名称无效。',
      invalid_body: '请检查填写的内容。',
      internal_error: '内部错误，请稍后再试。',
      news_unavailable: '新闻暂时无法使用。',
      tv_unavailable: 'SRM TV 暂时无法使用。',
      als_list_failed: '无法加载工作室列表。',
      als_save_failed: '无法保存工作室记录。',
      invalid_als_token: '请先登录 Gilil On。',
      network: '无法连接服务器。',
      http: '请求失败。',
      unknown: '请求失败（{code}）。',
    },
  };

  function userError(code, lang) {
    const pack = ERR[lang] || ERR.en;
    const c = String(code || '').trim();
    if (c && pack[c]) return pack[c];
    if (/^[a-z0-9_]+$/.test(c)) return pack.unknown.replace('{code}', c);
    return pack.http;
  }

  return { spec: spec, formatDate: formatDate, parseDate: parseDate, parseTime: parseTime, userError: userError };
});
