'use strict';

/** Language for pages embedded in the shell. Reads the same key as shell-v2. */
(function (root) {
  const KEY = 'gilil_shell_v2_lang';

  function lang() {
    try {
      const v = localStorage.getItem(KEY);
      if (v === 'zh' || v === 'en' || v === 'ru') return v;
    } catch (_) {}
    return 'zh';
  }

  function bind(dict, onChange) {
    function tr(key) {
      const pack = dict[lang()] || dict.en || {};
      if (pack[key] != null) return pack[key];
      if (dict.en && dict.en[key] != null) return dict.en[key];
      return key;
    }
    function paint(fromStorage) {
      const code = lang();
      document.documentElement.lang = code === 'zh' ? 'zh-CN' : code;
      document.querySelectorAll('[data-i18n]').forEach((el) => {
        el.textContent = tr(el.getAttribute('data-i18n'));
      });
      document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
        el.setAttribute('placeholder', tr(el.getAttribute('data-i18n-placeholder')));
      });
      if (dict[code] && dict[code].title) document.title = dict[code].title;
      if (fromStorage && typeof onChange === 'function') onChange(tr);
    }
    paint(false);
    window.addEventListener('storage', (e) => {
      if (!e.key || e.key === KEY) paint(true);
    });
    window.addEventListener('message', (e) => {
      if (!e.data || e.data.type !== 'gilil:lang') return;
      if (e.origin && e.origin !== window.location.origin) return;
      try { localStorage.setItem(KEY, e.data.lang); } catch (_) {}
      paint(true);
    });
    root.GililPageLang = { lang: lang, tr: tr, paint: paint };
    return tr;
  }

  root.GililPageLang = { bind: bind, lang: lang };
})(typeof window !== 'undefined' ? window : globalThis);
