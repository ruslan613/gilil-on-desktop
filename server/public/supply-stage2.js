/**
 * Gilil On Desktop — Gilil Supply Stage 2 embed (port 8797).
 * Does not replace desktop chats/WS on 8788. Loads Stage 2 UI in iframe.
 */
(function () {
  'use strict';

  var DEFAULT_BASE = 'http://127.0.0.1:8797';
  var LS_KEY = 'gilil_supply_stage2_url';

  function baseUrl() {
    try {
      if (window.GILIL_SUPPLY_STAGE2_URL) return String(window.GILIL_SUPPLY_STAGE2_URL).replace(/\/$/, '');
      var saved = localStorage.getItem(LS_KEY);
      if (saved) return saved.replace(/\/$/, '');
    } catch (_) {}
    return DEFAULT_BASE;
  }

  function applyFrame() {
    var input = document.getElementById('supply-base-url');
    var frame = document.getElementById('supply-frame');
    var openBtn = document.getElementById('btn-supply-open');
    var base = (input && input.value.trim()) || baseUrl();
    base = base.replace(/\/$/, '') || DEFAULT_BASE;
    try {
      localStorage.setItem(LS_KEY, base);
    } catch (_) {}
    window.GILIL_SUPPLY_STAGE2_URL = base;
    if (frame) frame.src = base + '/';
    if (openBtn) openBtn.href = base + '/';
    if (input && !input.value) input.value = base;
  }

  function ensureSupplyPanel() {
    applyFrame();
  }

  function boot() {
    var input = document.getElementById('supply-base-url');
    if (input) input.value = baseUrl();
    var reload = document.getElementById('btn-supply-reload');
    if (reload) reload.addEventListener('click', applyFrame);
    if (input) {
      input.addEventListener('change', applyFrame);
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          applyFrame();
        }
      });
    }
    applyFrame();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Hook setSection when shell defines it
  function patchSetSection() {
    if (typeof window.setSection !== 'function' && typeof setSection !== 'function') {
      // shell-v2 keeps setSection in closure — observe section activation instead
      var sec = document.getElementById('sec-supply');
      if (!sec || sec._supplyObs) return;
      sec._supplyObs = true;
      var obs = new MutationObserver(function () {
        if (sec.classList.contains('active')) ensureSupplyPanel();
      });
      obs.observe(sec, { attributes: true, attributeFilter: ['class'] });
      return;
    }
  }
  setTimeout(patchSetSection, 0);
  setTimeout(patchSetSection, 500);

  window.GililSupplyStage2 = {
    baseUrl: baseUrl,
    reload: applyFrame,
    ensure: ensureSupplyPanel,
  };
})();
