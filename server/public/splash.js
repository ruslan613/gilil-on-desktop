/**
 * Gilil On — CSS/JS splash overlay for shell-v2 / PWA / mobile web.
 * Skips when Electron already showed a native splash (window.gililDesktop.isDesktop).
 * Duration ~1.4s then fade; does not block login-gate / demo enter.
 */
(function () {
  'use strict';

  var MIN_MS = 1450;
  var FADE_MS = 450;
  var el = document.getElementById('gilil-splash');
  if (!el) return;
  try {
    var okMap = { dark: 1, bitrix: 1, cyan: 1 };
    var st = document.documentElement.getAttribute('data-theme') || 'dark';
    if (st === 'blue') st = 'cyan';
    if (st === 'beige') st = 'bitrix';
    if (!okMap[st]) st = 'dark';
    el.setAttribute('data-splash-theme', st);
  } catch (_) {}


  // Electron: native BrowserWindow splash covers cold start
  try {
    if (window.gililDesktop && window.gililDesktop.isDesktop) {
      el.parentNode && el.parentNode.removeChild(el);
      return;
    }
  } catch (_) {}

  // Skip if URL asks (?nosplash=1)
  try {
    if (new URLSearchParams(location.search).get('nosplash') === '1') {
      el.parentNode && el.parentNode.removeChild(el);
      return;
    }
  } catch (_) {}

  var started = Date.now();
  var done = false;

  function dismiss() {
    if (done) return;
    done = true;
    var wait = Math.max(0, MIN_MS - (Date.now() - started));
    setTimeout(function () {
      el.classList.add('gilil-splash--hide');
      el.setAttribute('aria-hidden', 'true');
      setTimeout(function () {
        if (el && el.parentNode) el.parentNode.removeChild(el);
      }, FADE_MS + 30);
    }, wait);
  }

  // Persist theme hint for Electron next launch (if bridge present)
  try {
    var ok = { dark: 1, bitrix: 1, cyan: 1 };
    var theme = document.documentElement.getAttribute('data-theme') || 'dark';
    if (theme === 'blue') theme = 'cyan';
    if (theme === 'beige') theme = 'bitrix';
    if (!ok[theme]) theme = 'dark';
    if (window.gililDesktop && typeof window.gililDesktop.setTheme === 'function') {
      window.gililDesktop.setTheme(theme);
    }
  } catch (_) {}

  if (document.readyState === 'complete') {
    dismiss();
  } else {
    window.addEventListener('load', dismiss);
    // Safety: never stick forever
    setTimeout(dismiss, MIN_MS + 2500);
  }
})();
