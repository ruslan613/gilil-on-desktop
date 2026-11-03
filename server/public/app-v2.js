/* Gilil On Unified Client v2 */
'use strict';
(() => {
  const LS_API = 'gilil_v2_api';
  const LS_TOKEN = 'gilil_v2_token';
  const LS_REFRESH = 'gilil_v2_refresh';
  const LS_USER = 'gilil_v2_user';
  const LS_ROOMS = 'gilil_v2_rooms';
  const LS_LOCALE = 'gilil_v2_locale';

  const SAMPLE_ITEMS = [
    { name: 'Корпус нержавейка 1.4мм, вертикальная шлифовка + TiN', keywords: 'металл,нержавейка,1.4мм,TiN', qty: 1, kind: 'purchase' },
    { name: 'Стекло бронза 2000×115×8', keywords: 'стекло,бронза,8мм', qty: 1, kind: 'purchase' },
    { name: 'LED спот 6W 3000K IP54', keywords: 'LED,6W,3000K,IP54', qty: 2, kind: 'purchase' },
    { name: 'Драйвер 36V 6W IP54', keywords: 'драйвер,36V,6W,IP54', qty: 2, kind: 'purchase' },
    { name: 'Магнит Ø16', keywords: 'магнит,Ø16', qty: 3, kind: 'purchase' },
    { name: 'Отверстие под кабель Ø20', keywords: 'кабель,Ø20,отверстие', qty: 2, kind: 'purchase' },
    { name: 'Крепление 10×6', keywords: 'крепление,монтаж', qty: 1, kind: 'purchase' },
    { name: 'Винт под стекло', keywords: 'винт,стекло', qty: 1, kind: 'purchase' },
    { name: 'Отверстие Ø15.6', keywords: 'отверстие,Ø15.6', qty: 1, kind: 'purchase' },
    { name: 'Крышка скрытого крепления', keywords: 'крышка,крепление', qty: 1, kind: 'purchase' },
    { name: 'Нижняя заглушка', keywords: 'заглушка', qty: 1, kind: 'purchase' },
    { name: 'Направляющие пазы', keywords: 'пазы,направляющие', qty: 1, kind: 'purchase' },
    { name: 'Гибка корпуса', keywords: 'гибка,корпус', qty: 1, kind: 'service' },
    { name: 'ПВД / TiN покрытие', keywords: 'ПВД,нитрид титана,покрытие', qty: 1, kind: 'service' },
    { name: 'Сборка', keywords: 'сборка,монтаж,QC', qty: 1, kind: 'service' }
  ];

  const SAMPLE_TEXT = [
    'Артикул LI-2910S',
    'Корпус нержавейка 1.4мм вертикальная шлифовка + TiN',
    'Стекло бронза 2000×115×8',
    'LED спот 6W 3000K IP54 ×2',
    'Драйвер 36V 6W IP54 ×2',
    'Магнит Ø16 ×3',
    'Отверстие под кабель Ø20 ×2',
    'Крепление 10×6, винт под стекло, отверстие Ø15.6',
    'Крышка скрытого крепления, нижняя заглушка, направляющие пазы',
    'Услуги: гибка корпуса, ПВД / TiN покрытие, сборка QC'
  ].join('\n');

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const escAttr = esc;

  const state = {
    apiBase: localStorage.getItem(LS_API) || (location.origin.includes('8787') ? location.origin : 'http://127.0.0.1:8787'),
    token: localStorage.getItem(LS_TOKEN) || null,
    refreshToken: localStorage.getItem(LS_REFRESH) || null,
    user: null,
    suppliers: [],
    priceRequests: [],
    conversationId: null,
    ws: null,
    answerId: null,
    tempToken: null,
    refreshing: null,
    drawingId: null,
    matches: null,
    items: [],
    fileBase64: null,
    fileName: null,
    fileMime: null,
    locale: localStorage.getItem(LS_LOCALE) || 'ru',
    currentRoom: null,
    rooms: [],
    sheets: [],
    currentSheet: null,
    sheetItems: [],
    sheetCosts: [],
    calcResult: null,
    calcSub: 'items',
    tnvedDict: null,
    tnvedRules: []
  };
  try { state.user = JSON.parse(localStorage.getItem(LS_USER) || 'null'); } catch (_) {}
  try { state.rooms = JSON.parse(localStorage.getItem(LS_ROOMS) || '[]') || []; } catch (_) { state.rooms = []; }

  function flash(msg, kind) {
    const el = $('flash');
    if (!el) return;
    if (!msg) { el.className = 'hidden'; el.textContent = ''; return; }
    el.className = kind || 'ok';
    el.textContent = msg;
    clearTimeout(flash._t);
    flash._t = setTimeout(() => { el.className = 'hidden'; }, 5000);
  }

  function apiUrl(path) {
    const base = (state.apiBase || '').replace(/\/$/, '');
    if (!path.startsWith('/')) path = '/' + path;
    // same-origin relative when base matches current origin
    if (base && location.origin && base === location.origin) return path;
    return base + path;
  }

  function setSession(user, token, refresh) {
    state.user = user || null;
    state.token = token || null;
    if (refresh !== undefined) state.refreshToken = refresh || null;
    if (token) localStorage.setItem(LS_TOKEN, token); else localStorage.removeItem(LS_TOKEN);
    if (state.refreshToken) localStorage.setItem(LS_REFRESH, state.refreshToken);
    else localStorage.removeItem(LS_REFRESH);
    if (user) localStorage.setItem(LS_USER, JSON.stringify(user));
    else localStorage.removeItem(LS_USER);
  }

  async function tryRefresh() {
    if (!state.refreshToken) return false;
    if (state.refreshing) return state.refreshing;
    state.refreshing = (async () => {
      try {
        const res = await fetch(apiUrl('/api/auth/refresh'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: state.refreshToken })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return false;
        setSession(data.user || state.user, data.token || data.access_token, data.refresh_token);
        return true;
      } catch { return false; }
      finally { state.refreshing = null; }
    })();
    return state.refreshing;
  }

  async function api(path, opts) {
    opts = opts || {};
    const retried = !!opts._retried;
    const fetchOpts = Object.assign({}, opts);
    delete fetchOpts._retried;
    const headers = Object.assign({ 'Content-Type': 'application/json' }, fetchOpts.headers || {});
    if (state.token) headers.Authorization = 'Bearer ' + state.token;
    let res = await fetch(apiUrl(path), Object.assign({}, fetchOpts, { headers }));
    let text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
    if (
      res.status === 401 && state.refreshToken && !retried &&
      !path.includes('/auth/login') && !path.includes('/auth/refresh') && !path.includes('/auth/2fa/verify')
    ) {
      const ok = await tryRefresh();
      if (ok) return api(path, Object.assign({}, fetchOpts, { _retried: true }));
    }
    if (!res.ok) {
      const err = new Error((data && (data.error || data.message)) || ('HTTP ' + res.status));
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  function roleLabel(role) {
    if (role === 'ru') return 'RU';
    if (role === 'cn') return 'CN';
    if (role === 'admin') return 'ADMIN';
    return (role || '').toUpperCase();
  }

  function showLogin() {
    $('loginView').classList.remove('hidden');
    $('appView').classList.add('hidden');
    $('appbar').classList.add('hidden');
    $('banner2fa').classList.add('hidden');
    $('loginStepPass').classList.remove('hidden');
    $('loginStep2fa').classList.add('hidden');
    state.tempToken = null;
    $('apiBase').value = state.apiBase;
  }

  function showApp() {
    $('loginView').classList.add('hidden');
    $('appView').classList.remove('hidden');
    $('appbar').classList.remove('hidden');
    const u = state.user;
    const badge = $('userBadge');
    badge.textContent = (u.display_name || u.username) + ' · ' + roleLabel(u.role);
    badge.className = 'badge ' + (u.role || '');
    $('apiHint').textContent = state.apiBase;
    $('apiBaseSettings').value = state.apiBase;
    $('prToRoleWrap').classList.toggle('hidden', u.role !== 'admin');
    const subTnved = $('subtabTnved');
    if (subTnved) subTnved.classList.toggle('hidden', u.role !== 'admin');
    if (!state.items.length) loadSample(false);
    loadSuppliers();
    loadPriceRequests();
    loadConversations();
    renderRooms();
    refreshExportPreview();
    check2faBanner();
  }

  async function check2faBanner() {
    try {
      const me = await api('/api/auth/me');
      if (me && me['2fa_required']) $('banner2fa').classList.remove('hidden');
      else $('banner2fa').classList.add('hidden');
      if (me && me.user) {
        state.user = me.user;
        localStorage.setItem(LS_USER, JSON.stringify(me.user));
      }
    } catch (_) {}
  }

  // Tabs
  document.querySelectorAll('#tabs button').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#tabs button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      ['suppliers', 'drawing', 'prices', 'calc', 'chat', 'calls', 'export', 'settings'].forEach((t) => {
        const sec = $('tab-' + t);
        if (sec) sec.classList.toggle('hidden', t !== btn.dataset.tab);
      });
      if (btn.dataset.tab === 'export') refreshExportPreview();
      if (btn.dataset.tab === 'prices') loadPriceRequests();
      if (btn.dataset.tab === 'suppliers') loadSuppliers();
      if (btn.dataset.tab === 'chat') loadConversations();
      if (btn.dataset.tab === 'calls') renderRooms();
      if (btn.dataset.tab === 'calc') loadSheets();
    });
  });

  function switchTab(name) {
    const btn = document.querySelector('#tabs button[data-tab="' + name + '"]');
    if (btn) btn.click();
  }

  // Login
  $('apiBase').value = state.apiBase;
  $('btnLogin').addEventListener('click', doLogin);
  document.querySelectorAll('.quick-logins button').forEach((b) => {
    b.addEventListener('click', () => {
      $('username').value = b.dataset.u;
      $('password').value = b.dataset.p;
      doLogin();
    });
  });
  $('btnLogout').addEventListener('click', async () => {
    try {
      if (state.token) {
        await api('/api/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refresh_token: state.refreshToken || undefined })
        }).catch(() => {});
      }
    } finally {
      if (state.ws) { try { state.ws.close(); } catch (_) {} state.ws = null; }
      setSession(null, null, null);
      showLogin();
    }
  });

  async function doLogin() {
    $('loginErr').textContent = '';
    const base = ($('apiBase').value || '').trim() || 'http://127.0.0.1:8787';
    state.apiBase = base;
    localStorage.setItem(LS_API, base);
    try {
      const data = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: $('username').value.trim(),
          password: $('password').value
        })
      });
      if (data.needs_2fa) {
        state.tempToken = data.temp_token;
        $('loginStepPass').classList.add('hidden');
        $('loginStep2fa').classList.remove('hidden');
        $('totpCode').focus();
        return;
      }
      setSession(data.user, data.token || data.access_token, data.refresh_token);
      showApp();
      flash('Добро пожаловать, ' + data.user.username + ' (' + roleLabel(data.user.role) + ')', 'ok');
    } catch (e) {
      let msg = e.message || String(e);
      if (e.name === 'TypeError') msg = 'Сеть: проверьте API base. ' + msg;
      if (e.data && e.data.retry_after_sec) msg += ' (retry ' + e.data.retry_after_sec + 's)';
      $('loginErr').textContent = msg;
    }
  }

  $('btn2faVerify').addEventListener('click', async () => {
    $('loginErr').textContent = '';
    try {
      const data = await api('/api/auth/2fa/verify', {
        method: 'POST',
        body: JSON.stringify({ temp_token: state.tempToken, code: $('totpCode').value.trim() })
      });
      setSession(data.user, data.token || data.access_token, data.refresh_token);
      state.tempToken = null;
      showApp();
      flash('2FA OK · ' + data.user.username, 'ok');
    } catch (e) {
      $('loginErr').textContent = e.message || String(e);
    }
  });
  $('btn2faCancel').addEventListener('click', () => {
    state.tempToken = null;
    $('loginStep2fa').classList.add('hidden');
    $('loginStepPass').classList.remove('hidden');
  });

  // Soft refresh every 10 min
  setInterval(() => { if (state.refreshToken) tryRefresh(); }, 10 * 60 * 1000);

  // ——— Suppliers ———
  async function loadSuppliers() {
    const q = ($('supQ').value || '').trim();
    const type = $('supType').value || '';
    const region = $('supRegion').value || '';
    const qs = new URLSearchParams();
    if (q) qs.set('q', q);
    if (type) qs.set('type', type);
    if (region) qs.set('region', region);
    try {
      const data = await api('/api/suppliers?' + qs.toString());
      state.suppliers = data.suppliers || [];
      renderSuppliers();
      fillPrSuppliers();
    } catch (e) {
      flash('Поставщики: ' + e.message, 'err');
    }
  }

  function renderSuppliers() {
    const proc = $('colProcurement');
    const svc = $('colService');
    proc.innerHTML = '';
    svc.innerHTML = '';
    let nP = 0, nS = 0;
    state.suppliers.forEach((s) => {
      const card = supplierCard(s);
      const t = (s.type || '').toLowerCase();
      if (t === 'service') { svc.appendChild(card); nS++; }
      else if (t === 'both') { proc.appendChild(card.cloneNode(true)); svc.appendChild(card); nP++; nS++; }
      else { proc.appendChild(card); nP++; }
    });
    if (!nP) proc.innerHTML = '<p class="muted">Нет записей</p>';
    if (!nS) svc.innerHTML = '<p class="muted">Нет записей</p>';
  }

  function supplierCard(s) {
    const el = document.createElement('div');
    el.className = 'card';
    const tags = [];
    tags.push('<span class="tag ' + (s.region === 'china' ? 'cn' : 'ru') + '">' + esc(s.region || '') + '</span>');
    tags.push('<span class="tag ' + (s.type === 'service' ? 'svc' : 'buy') + '">' + esc(s.type || '') + '</span>');
    if (s.contacts_hidden) tags.push('<span class="tag hide">контакты скрыты</span>');
    let prices = '';
    if (s.price_ru != null) prices += '<div class="meta">price_ru: ' + esc(s.price_ru) + '</div>';
    if (s.price_cn != null) prices += '<div class="meta">price_cn: ' + esc(s.price_cn) + '</div>';
    let contacts = '';
    if (!s.contacts_hidden) {
      if (s.phone) contacts += '<div class="meta">☎ ' + esc(s.phone) + '</div>';
      if (s.wechat_id) contacts += '<div class="meta">WeChat: ' + esc(s.wechat_id) + '</div>';
      if (s.address) contacts += '<div class="meta">' + esc(s.address) + '</div>';
    }
    el.innerHTML =
      '<div class="name">' + esc(s.name_ru || s.name_cn || ('#' + s.id)) +
      (s.name_cn && s.name_ru ? ' <span class="muted">· ' + esc(s.name_cn) + '</span>' : '') + '</div>' +
      '<div class="meta">' + tags.join(' ') + '</div>' +
      (s.notes ? '<div class="meta">' + esc(s.notes) + '</div>' : '') +
      (s.keywords ? '<div class="kw">' + esc(s.keywords) + '</div>' : '') +
      prices + contacts +
      '<div class="flex-gap mt-8">' +
      '<button type="button" class="btn sm" data-pr="' + s.id + '">Запрос цены</button>' +
      '</div>';
    el.querySelector('[data-pr]').addEventListener('click', () => {
      switchTab('prices');
      $('prSupplier').value = String(s.id);
      $('prBody').value = 'RFQ по чертежу ' + (($('dwTitle') && $('dwTitle').value) || 'LI-2910S') + ' → ' + (s.name_ru || s.name_cn);
      $('prBody').focus();
    });
    return el;
  }

  $('btnSupSearch').addEventListener('click', loadSuppliers);
  $('btnSupReload').addEventListener('click', () => {
    $('supQ').value = ''; $('supType').value = ''; $('supRegion').value = '';
    loadSuppliers();
  });
  $('supQ').addEventListener('keydown', (e) => { if (e.key === 'Enter') loadSuppliers(); });

  // ——— BOM / Drawing ———
  function loadSample(announce) {
    $('dwTitle').value = 'LI-2910S';
    $('dwText').value = SAMPLE_TEXT;
    state.items = SAMPLE_ITEMS.map((x) => Object.assign({}, x));
    state.fileBase64 = null; state.fileName = 'LI-2910S.pdf'; state.fileMime = 'application/pdf';
    renderBom();
    if (announce !== false) flash('Образец LI-2910S загружен (15 позиций)', 'ok');
  }
  $('btnLoadSample').addEventListener('click', () => loadSample(true));

  function renderBom() {
    const tb = $('bomBody');
    tb.innerHTML = '';
    state.items.forEach((it, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td class="n">' + (i + 1) + '</td>' +
        '<td><input data-i="' + i + '" data-f="name" value="' + escAttr(it.name) + '" /></td>' +
        '<td><input data-i="' + i + '" data-f="keywords" value="' + escAttr(it.keywords) + '" /></td>' +
        '<td><input data-i="' + i + '" data-f="qty" type="number" min="1" value="' + (it.qty || 1) + '" /></td>' +
        '<td><select data-i="' + i + '" data-f="kind">' +
          '<option value="purchase"' + (it.kind === 'purchase' ? ' selected' : '') + '>purchase</option>' +
          '<option value="service"' + (it.kind === 'service' ? ' selected' : '') + '>service</option>' +
        '</select></td>' +
        '<td><button type="button" class="btn ghost sm" data-del="' + i + '">×</button></td>';
      tb.appendChild(tr);
    });
    $('bomCount').textContent = state.items.length + ' поз.';
    tb.querySelectorAll('input,select').forEach((inp) => {
      inp.addEventListener('change', () => {
        const i = +inp.dataset.i; const f = inp.dataset.f;
        if (!state.items[i]) return;
        state.items[i][f] = f === 'qty' ? (+inp.value || 1) : inp.value;
      });
    });
    tb.querySelectorAll('[data-del]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.items.splice(+btn.dataset.del, 1);
        renderBom();
      });
    });
  }

  $('btnAddItem').addEventListener('click', () => {
    state.items.push({ name: '', keywords: '', qty: 1, kind: 'purchase' });
    renderBom();
  });

  $('dwFile').addEventListener('change', async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    state.fileName = f.name;
    state.fileMime = f.type || 'application/octet-stream';
    const buf = await f.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    state.fileBase64 = btoa(bin);
    if (f.type.startsWith('text/') || /\.(txt|csv)$/i.test(f.name)) {
      $('dwText').value = new TextDecoder().decode(bytes);
    }
    flash('Файл: ' + f.name, 'info');
  });

  async function saveDrawingNow() {
    const body = {
      title: $('dwTitle').value.trim() || 'LI-2910S',
      original_filename: state.fileName || 'LI-2910S.pdf',
      mime_type: state.fileMime || 'application/pdf',
      extracted_text: $('dwText').value || '',
      parsed_items: state.items.map((it) => ({
        name: it.name, keywords: it.keywords, qty: it.qty || 1, kind: it.kind || 'purchase'
      })),
      meta: { article: $('dwTitle').value.trim() || 'LI-2910S', source: 'unified-app-v2' },
      file_base64: state.fileBase64 || null
    };
    const data = await api('/api/drawings', { method: 'POST', body: JSON.stringify(body) });
    state.drawingId = data.drawing && data.drawing.id;
    $('dwId').value = state.drawingId || '';
    return state.drawingId;
  }

  $('btnSaveDrawing').addEventListener('click', async () => {
    try {
      await saveDrawingNow();
      flash('Чертёж сохранён #' + state.drawingId, 'ok');
    } catch (e) {
      flash('Сохранение: ' + e.message, 'err');
    }
  });


  $('btnMatch').addEventListener('click', async () => {
    try {
      if (!state.drawingId) await saveDrawingNow();
      const data = await api('/api/drawings/' + state.drawingId + '/match', { method: 'POST', body: '{}' });
      state.matches = data;
      renderMatches(data);
      flash('Подбор готов', 'ok');
    } catch (e) {
      flash('Match: ' + e.message, 'err');
    }
  });

  function renderMatches(data) {
    const root = $('matchOut');
    const matches = (data && data.matches) || [];
    if (!matches.length) { root.innerHTML = '<p class="muted">Нет совпадений</p>'; return; }
    root.innerHTML = '';
    matches.forEach((m) => {
      const box = document.createElement('div');
      box.className = 'match-item';
      const sugs = m.suggestions || [];
      let html = '<h4>' + esc(m.item && m.item.name) +
        ' <span class="muted">' + esc(m.item && m.item.keywords) + '</span></h4>';
      if (!sugs.length) html += '<p class="muted">нет предложений</p>';
      sugs.slice(0, 5).forEach((sg) => {
        const s = sg.supplier || {};
        html += '<div class="sug">' +
          '<div><span class="score">★ ' + esc(sg.score) + '</span> ' +
          esc(s.name_ru || s.name_cn) +
          ' <span class="tag ' + (s.region === 'china' ? 'cn' : 'ru') + '">' + esc(s.region) + '</span>' +
          '<div class="muted">' + esc((sg.matched_keywords || []).join(', ')) + '</div></div>' +
          '<button type="button" class="btn sm" data-sid="' + s.id + '" data-sname="' + escAttr(s.name_ru || s.name_cn || '') + '">Запрос цены</button>' +
          '</div>';
      });
      box.innerHTML = html;
      box.querySelectorAll('[data-sid]').forEach((btn) => {
        btn.addEventListener('click', () => {
          createPriceRequest(+btn.dataset.sid, 'RFQ LI-2910S → ' + btn.dataset.sname + ': котировка по чертежу');
        });
      });
      root.appendChild(box);
    });
  }

  // ——— Price requests ———
  function fillPrSuppliers() {
    const sel = $('prSupplier');
    const cur = sel.value;
    sel.innerHTML = state.suppliers.map((s) =>
      '<option value="' + s.id + '">' + esc(s.name_ru || s.name_cn) + ' [' + esc(s.region) + ']</option>'
    ).join('');
    if (cur) sel.value = cur;
  }

  async function loadPriceRequests() {
    try {
      const data = await api('/api/price-requests');
      state.priceRequests = data.requests || data.price_requests || [];
      // normalize
      if (!state.priceRequests.length && Array.isArray(data)) state.priceRequests = data;
      renderPriceRequests();
      refreshExportPreview();
    } catch (e) {
      flash('Запросы цены: ' + e.message, 'err');
    }
  }

  function renderPriceRequests() {
    const root = $('prList');
    if (!state.priceRequests.length) {
      root.innerHTML = '<p class="muted">Пока нет запросов</p>';
      return;
    }
    root.innerHTML = '';
    state.priceRequests.forEach((r) => {
      const el = document.createElement('div');
      el.className = 'card';
      const st = r.status === 'answered' ? 'status-answered' : 'status-open';
      let priceLine = '';
      if (r.answer_price != null) priceLine = '<div class="meta"><strong>Цена:</strong> ' + esc(r.answer_price) + '</div>';
      else if (r.answer_price_redacted) priceLine = '<div class="meta"><em>цена скрыта для вашей роли</em></div>';
      el.innerHTML =
        '<div class="name">#' + r.id + ' · ' + esc(r.supplier_name || '') +
        ' <span class="pill ' + st + '">' + esc(r.status) + '</span></div>' +
        '<div class="meta">' + esc(r.from_username || '') + ' → ' + esc(r.to_role || '') +
        ' · ' + esc(r.supplier_region || '') + '</div>' +
        '<div class="mt-8">' + esc(r.body) + '</div>' +
        (r.answer_body ? '<div class="meta mt-8"><strong>Ответ:</strong> ' + esc(r.answer_body) + '</div>' : '') +
        priceLine +
        (r.status === 'open' ? '<div class="flex-gap mt-8"><button type="button" class="btn sm" data-ans="' + r.id + '">Ответить</button></div>' : '');
      const b = el.querySelector('[data-ans]');
      if (b) b.addEventListener('click', () => {
        state.answerId = r.id;
        $('prAnswerId').textContent = r.id;
        $('prAnswerBody').value = '';
        $('prAnswerPrice').value = '';
        $('prAnswerPanel').classList.remove('hidden');
      });
      root.appendChild(el);
    });
  }

  async function createPriceRequest(supplierId, bodyText) {
    try {
      const payload = { supplier_id: supplierId, body: bodyText };
      if (state.user && state.user.role === 'admin' && $('prToRole').value) {
        payload.to_role = $('prToRole').value;
      }
      await api('/api/price-requests', { method: 'POST', body: JSON.stringify(payload) });
      flash('Запрос цены создан', 'ok');
      switchTab('prices');
      await loadPriceRequests();
    } catch (e) {
      flash('RFQ: ' + e.message, 'err');
    }
  }

  $('btnPrCreate').addEventListener('click', async () => {
    const sid = +$('prSupplier').value;
    const body = $('prBody').value.trim() || ('RFQ по чертежу ' + ($('dwTitle').value || 'LI-2910S'));
    if (!sid) { flash('Выберите поставщика', 'err'); return; }
    await createPriceRequest(sid, body);
    $('prBody').value = '';
  });
  $('btnPrReload').addEventListener('click', loadPriceRequests);
  $('btnPrAnswerCancel').addEventListener('click', () => {
    $('prAnswerPanel').classList.add('hidden');
    state.answerId = null;
  });
  $('btnPrAnswer').addEventListener('click', async () => {
    const id = state.answerId;
    if (!id) return;
    try {
      await api('/api/price-requests/' + id + '/answer', {
        method: 'POST',
        body: JSON.stringify({
          answer_body: $('prAnswerBody').value.trim(),
          answer_price: $('prAnswerPrice').value.trim() || null
        })
      });
      flash('Ответ на #' + id + ' сохранён', 'ok');
      $('prAnswerPanel').classList.add('hidden');
      state.answerId = null;
      await loadPriceRequests();
    } catch (e) {
      flash('Ответ: ' + e.message, 'err');
    }
  });

  // ——— Chat ———
  async function loadConversations() {
    try {
      const data = await api('/api/conversations');
      const list = data.conversations || [];
      const root = $('convList');
      if (!list.length) { root.innerHTML = '<p class="muted">Нет диалогов</p>'; return; }
      root.innerHTML = '';
      list.forEach((c) => {
        const el = document.createElement('div');
        el.className = 'conv-item' + (state.conversationId === c.id ? ' active' : '');
        el.innerHTML = '<strong>#' + c.id + '</strong> ' + esc(c.title || 'без названия') +
          '<div class="muted">' + esc(c.created_at || '') + '</div>';
        el.addEventListener('click', () => openConversation(c.id));
        root.appendChild(el);
      });
    } catch (e) {
      flash('Диалоги: ' + e.message, 'err');
    }
  }

  async function openConversation(id) {
    state.conversationId = id;
    $('cidLabel').textContent = '#' + id;
    loadConversations();
    try {
      const data = await api('/api/conversations/' + id + '/messages');
      renderMessages(data.messages || []);
      if (state.ws && state.ws.readyState === 1) {
        state.ws.send(JSON.stringify({ type: 'join', conversationId: id }));
      }
    } catch (e) {
      flash('Сообщения: ' + e.message, 'err');
    }
  }

  function renderMessages(msgs) {
    const log = $('chatLog');
    if (!msgs.length) { log.innerHTML = '<div class="muted">Пока нет сообщений</div>'; return; }
    log.innerHTML = msgs.map((m) => {
      const who = (m.sender && (m.sender.username || m.sender.display_name)) || m.username || '?';
      return '<div class="chat-msg"><span class="who">' + esc(who) + '</span>' +
        '<span class="when">' + esc(m.created_at || '') + '</span>' +
        '<div class="txt">' + esc(m.text) + '</div></div>';
    }).join('');
    log.scrollTop = log.scrollHeight;
  }

  $('btnConvCreate').addEventListener('click', async () => {
    const members = ($('chatMembers').value || '').split(',').map((s) => s.trim()).filter(Boolean);
    const title = $('chatTitle').value.trim() || 'RU↔CN';
    try {
      const data = await api('/api/conversations', {
        method: 'POST',
        body: JSON.stringify({ title, memberUsernames: members })
      });
      flash('Диалог #' + data.conversation.id, 'ok');
      await loadConversations();
      openConversation(data.conversation.id);
    } catch (e) {
      flash('Диалог: ' + e.message, 'err');
    }
  });
  $('btnConvReload').addEventListener('click', loadConversations);

  async function sendChat() {
    const id = state.conversationId;
    const text = $('chatMsg').value.trim();
    if (!id) { flash('Выберите диалог', 'err'); return; }
    if (!text) return;
    try {
      if (state.ws && state.ws.readyState === 1) {
        state.ws.send(JSON.stringify({ type: 'send', conversationId: id, text }));
        $('chatMsg').value = '';
        return;
      }
      const data = await api('/api/conversations/' + id + '/messages', {
        method: 'POST', body: JSON.stringify({ text })
      });
      $('chatMsg').value = '';
      // append
      const cur = $('chatLog').innerHTML;
      if (cur.includes('Пока нет') || cur.includes('Выберите')) $('chatLog').innerHTML = '';
      const m = data.message;
      const who = (m.sender && m.sender.username) || state.user.username;
      $('chatLog').innerHTML += '<div class="chat-msg"><span class="who">' + esc(who) + '</span>' +
        '<span class="when">' + esc(m.created_at || '') + '</span>' +
        '<div class="txt">' + esc(m.text) + '</div></div>';
      $('chatLog').scrollTop = $('chatLog').scrollHeight;
    } catch (e) {
      if (e.data && e.data.error === 'contact_leak') {
        flash('Контакт заблокирован фильтром: ' + ((e.data.matches || [e.data.matched || e.data.reason]).join(', ')), 'err');
      } else {
        flash('Чат: ' + e.message, 'err');
      }
    }
  }
  $('btnChatSend').addEventListener('click', sendChat);
  $('chatMsg').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } });

  $('btnWs').addEventListener('click', () => {
    if (state.ws && state.ws.readyState <= 1) {
      state.ws.close();
      state.ws = null;
      flash('WS отключён', 'info');
      return;
    }
    const base = state.apiBase.replace(/^http/, 'ws').replace(/\/$/, '');
    const url = base + '/ws?token=' + encodeURIComponent(state.token);
    const ws = new WebSocket(url);
    state.ws = ws;
    ws.onopen = () => {
      flash('WS подключён', 'ok');
      if (state.conversationId) ws.send(JSON.stringify({ type: 'join', conversationId: state.conversationId }));
    };
    ws.onmessage = (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      if (msg.type === 'message' && msg.message) {
        if (!state.conversationId || msg.message.conversation_id === state.conversationId || true) {
          const m = msg.message;
          const who = (m.sender && m.sender.username) || '?';
          if ($('chatLog').textContent.includes('Выберите')) $('chatLog').innerHTML = '';
          $('chatLog').innerHTML += '<div class="chat-msg"><span class="who">' + esc(who) + '</span>' +
            '<span class="when">' + esc(m.created_at || '') + '</span>' +
            '<div class="txt">' + esc(m.text) + '</div></div>';
          $('chatLog').scrollTop = $('chatLog').scrollHeight;
        }
      } else if (msg.type === 'error' && msg.error === 'contact_leak') {
        flash('WS: контакт заблокирован — ' + ((msg.matches || []).join(', ') || msg.reason || ''), 'err');
      } else if (msg.type === 'price_request_updated') {
        loadPriceRequests();
      }
    };
    ws.onclose = () => flash('WS закрыт', 'info');
    ws.onerror = () => flash('WS ошибка', 'err');
  });

  $('btnCallFromChat').addEventListener('click', () => {
    if (!state.conversationId) { flash('Сначала откройте диалог', 'err'); return; }
    const room = 'gilil-' + state.conversationId;
    switchTab('calls');
    joinRoom(room, 'Чат #' + state.conversationId);
  });

  // ——— Calls / Jitsi ———
  function safeRoomId(name) {
    return String(name || '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9_\-а-яА-ЯёЁ]/g, '')
      .slice(0, 64) || ('room-' + Date.now());
  }

  function jitsiUrl(room) {
    // Parent contract: gilil-{conversationId} | gilil-d{drawingId}
    // Public meet.jit.si — no API key
    return 'https://meet.jit.si/' + encodeURIComponent(room);
  }

  function saveRooms() {
    localStorage.setItem(LS_ROOMS, JSON.stringify(state.rooms.slice(0, 20)));
  }

  function rememberRoom(room, label) {
    state.rooms = state.rooms.filter((r) => r.id !== room);
    state.rooms.unshift({ id: room, label: label || room, at: Date.now() });
    state.rooms = state.rooms.slice(0, 20);
    saveRooms();
    renderRooms();
  }

  function renderRooms() {
    const root = $('roomList');
    if (!state.rooms.length) { root.innerHTML = '<p class="muted">Пока пусто — создайте комнату</p>'; return; }
    root.innerHTML = '';
    state.rooms.forEach((r) => {
      const el = document.createElement('div');
      el.className = 'card';
      el.innerHTML = '<div class="name">' + esc(r.label || r.id) + '</div>' +
        '<div class="meta"><code>' + esc(r.id) + '</code></div>' +
        '<div class="flex-gap mt-8">' +
        '<button type="button" class="btn sm" data-join="' + escAttr(r.id) + '">Присоединиться</button>' +
        '</div>';
      el.querySelector('[data-join]').addEventListener('click', () => joinRoom(r.id, r.label));
      root.appendChild(el);
    });
  }

  function joinRoom(room, label) {
    room = safeRoomId(room);
    // Ensure prefix convention for free names
    if (!/^gilil-/i.test(room)) room = 'gilil-' + room;
    state.currentRoom = room;
    rememberRoom(room, label || room);
    const url = jitsiUrl(room);
    $('callTitle').textContent = label || room;
    $('btnCallOpenTab').href = url;
    $('jitsiPlaceholder').classList.add('hidden');
    const frame = $('jitsiFrame');
    frame.classList.remove('hidden');
    frame.src = url;
    $('callRoomName').value = room.replace(/^gilil-/i, '');
    flash('Комната: ' + room, 'ok');
  }

  $('btnCallStart').addEventListener('click', () => {
    let name = ($('callRoomName').value || '').trim();
    if (!name) name = 'meet-' + Date.now().toString(36);
    // If user typed full gilil-… keep it; else prefix
    const room = /^gilil-/i.test(name) ? safeRoomId(name) : ('gilil-' + safeRoomId(name));
    joinRoom(room, name);
  });
  $('btnCallCopy').addEventListener('click', async () => {
    const room = state.currentRoom || ('gilil-' + safeRoomId($('callRoomName').value || 'meet'));
    const url = jitsiUrl(room);
    try {
      await navigator.clipboard.writeText(url);
      flash('Ссылка скопирована', 'ok');
    } catch {
      prompt('Скопируйте ссылку:', url);
    }
  });
  $('btnCallLeave').addEventListener('click', () => {
    $('jitsiFrame').src = 'about:blank';
    $('jitsiFrame').classList.add('hidden');
    $('jitsiPlaceholder').classList.remove('hidden');
    state.currentRoom = null;
    $('callTitle').textContent = 'Конференция';
  });
  $('btnCallFromDrawing').addEventListener('click', () => {
    if (!state.drawingId) { flash('Сначала сохраните чертёж', 'err'); return; }
    joinRoom('gilil-d' + state.drawingId, 'Чертёж #' + state.drawingId);
  });
  $('btnCallFromConv').addEventListener('click', () => {
    if (!state.conversationId) { flash('Сначала откройте чат', 'err'); return; }
    joinRoom('gilil-' + state.conversationId, 'Чат #' + state.conversationId);
  });

  // ——— Export ———
  function buildExportModel() {
    const role = (state.user && state.user.role) || 'ru';
    const article = ($('dwTitle').value || 'LI-2910S').trim();
    const purchases = state.items.filter((i) => i.kind !== 'service');
    const services = state.items.filter((i) => i.kind === 'service');
    const matchRows = [];
    ((state.matches && state.matches.matches) || []).forEach((m) => {
      const top = (m.suggestions || [])[0];
      if (!top) {
        matchRows.push({ item: m.item.name, keywords: m.item.keywords, supplier: '—', score: 0, region: '', type: '' });
        return;
      }
      const s = top.supplier;
      const row = {
        item: m.item.name, keywords: m.item.keywords,
        supplier: s.name_ru || s.name_cn || '', supplier_cn: s.name_cn || '',
        score: top.score, region: s.region || '', type: s.type || '',
        matched: (top.matched_keywords || []).join(', ')
      };
      if (role === 'ru' && s.price_ru != null) row.unit_cost_ru = s.price_ru;
      if (role === 'cn' && s.price_cn != null) row.unit_cost_cn = s.price_cn;
      if (role === 'admin') {
        if (s.price_ru != null) row.unit_cost_ru = s.price_ru;
        if (s.price_cn != null) row.unit_cost_cn = s.price_cn;
      }
      if (!s.contacts_hidden) {
        if (s.phone) row.phone = s.phone;
        if (s.wechat_id) row.wechat = s.wechat_id;
        if (s.address) row.address = s.address;
      }
      matchRows.push(row);
    });
    const prRows = state.priceRequests.map((r) => {
      const row = {
        id: r.id, supplier: r.supplier_name, region: r.supplier_region,
        status: r.status, body: r.body, answer_body: r.answer_body || ''
      };
      if (r.answer_price != null) row.answer_price = r.answer_price;
      if (r.answer_price_redacted) row.answer_price_note = 'redacted';
      return row;
    });
    return {
      meta: {
        article, role, role_label: roleLabel(role),
        generated_at: new Date().toISOString(),
        drawing_id: state.drawingId,
        user: state.user && state.user.username,
        note: 'Только поля, видимые роли ' + roleLabel(role) + '.'
      },
      purchases, services, matches: matchRows, price_requests: prRows
    };
  }

  function refreshExportPreview() {
    try { $('exportPreview').textContent = JSON.stringify(buildExportModel(), null, 2); }
    catch (_) { $('exportPreview').textContent = '{}'; }
  }

  function exportFilename(ext) {
    const article = ($('dwTitle').value || 'LI-2910S').trim().replace(/[^\w\-]+/g, '_');
    return article + '_RFQ_' + roleLabel(state.user && state.user.role) + '.' + ext;
  }

  function downloadBlob(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  function stripWorkbookForRole(wb, role) {
    wb.SheetNames.forEach((name) => {
      const sh = wb.Sheets[name];
      const json = XLSX.utils.sheet_to_json(sh, { defval: null });
      if (!json.length) return;
      const cleaned = json.map((row) => {
        const o = Object.assign({}, row);
        if (role === 'ru') {
          delete o.price_cn; delete o.unit_cost_cn;
          if (String(o.region || '').toLowerCase() === 'china') {
            delete o.answer_price; delete o.phone; delete o.wechat; delete o.address;
          }
        }
        if (role === 'cn') {
          delete o.price_ru; delete o.unit_cost_ru;
          if (String(o.region || '').toLowerCase() === 'russia') {
            delete o.answer_price; delete o.phone; delete o.wechat; delete o.address;
          }
        }
        return o;
      });
      wb.Sheets[name] = XLSX.utils.json_to_sheet(cleaned);
    });
  }

  $('btnExportJson').addEventListener('click', refreshExportPreview);
  $('btnExportXlsx').addEventListener('click', () => {
    if (typeof XLSX === 'undefined') { flash('SheetJS не загружен', 'err'); return; }
    const m = buildExportModel();
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(Object.keys(m.meta).map((k) => [k, m.meta[k]])), 'Meta');
    const bomRows = [
      ...m.purchases.map((i) => ({ section: 'purchase', name: i.name, keywords: i.keywords, qty: i.qty })),
      ...m.services.map((i) => ({ section: 'service', name: i.name, keywords: i.keywords, qty: i.qty }))
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bomRows), 'BOM');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(m.matches.length ? m.matches : [{ item: '—' }]), 'Matches');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(m.price_requests.length ? m.price_requests : [{ id: '—' }]), 'PriceRequests');
    stripWorkbookForRole(wb, m.meta.role);
    const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    downloadBlob(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), exportFilename('xlsx'));
    flash('Excel: ' + exportFilename('xlsx'), 'ok');
  });

  $('btnExportPdf').addEventListener('click', () => {
    if (!window.jspdf || !window.jspdf.jsPDF) { flash('jsPDF не загружен', 'err'); return; }
    const m = buildExportModel();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    doc.setFontSize(14);
    doc.text('Gilil On RFQ — ' + m.meta.article + ' [' + m.meta.role_label + ']', 40, 40);
    doc.setFontSize(10);
    doc.text('drawing_id=' + (m.meta.drawing_id || '—') + '  user=' + (m.meta.user || ''), 40, 58);
    const bomBody = [
      ...m.purchases.map((i) => ['purchase', i.name, i.keywords, String(i.qty)]),
      ...m.services.map((i) => ['service', i.name, i.keywords, String(i.qty)])
    ];
    doc.autoTable({
      startY: 80,
      head: [['Тип', 'Позиция', 'Keywords', 'Qty']],
      body: bomBody,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [184, 149, 108] }
    });
    const matchBody = m.matches.map((r) => {
      const price = r.unit_cost_ru != null ? ('RU:' + r.unit_cost_ru) : (r.unit_cost_cn != null ? ('CN:' + r.unit_cost_cn) : '');
      return [r.item, r.supplier, String(r.score), r.region, price];
    });
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 16,
      head: [['Позиция', 'Поставщик', 'Score', 'Регион', 'Цена']],
      body: matchBody.length ? matchBody : [['—', '—', '', '', '']],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [61, 122, 90] }
    });
    doc.save(exportFilename('pdf'));
    flash('PDF: ' + exportFilename('pdf'), 'ok');
  });

  $('btnExportDoc').addEventListener('click', () => {
    const m = buildExportModel();
    let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>RFQ</title></head><body>';
    html += '<h1>Gilil On RFQ — ' + esc(m.meta.article) + ' [' + m.meta.role_label + ']</h1>';
    html += '<p>' + esc(m.meta.note) + '</p>';
    html += '<h2>BOM</h2><table border="1" cellpadding="4"><tr><th>Тип</th><th>Название</th><th>Keywords</th><th>Qty</th></tr>';
    m.purchases.forEach((i) => { html += '<tr><td>purchase</td><td>' + esc(i.name) + '</td><td>' + esc(i.keywords) + '</td><td>' + i.qty + '</td></tr>'; });
    m.services.forEach((i) => { html += '<tr><td>service</td><td>' + esc(i.name) + '</td><td>' + esc(i.keywords) + '</td><td>' + i.qty + '</td></tr>'; });
    html += '</table></body></html>';
    downloadBlob(new Blob(['\ufeff' + html], { type: 'application/msword' }), exportFilename('doc'));
    flash('Word: ' + exportFilename('doc'), 'ok');
  });

  // ——— Settings / 2FA ———
  $('btnSaveApi').addEventListener('click', () => {
    state.apiBase = ($('apiBaseSettings').value || '').trim() || 'http://127.0.0.1:8787';
    localStorage.setItem(LS_API, state.apiBase);
    $('apiHint').textContent = state.apiBase;
    flash('API base сохранён', 'ok');
  });
  $('btnPing').addEventListener('click', async () => {
    try {
      const r = await fetch(apiUrl('/api/health'));
      const j = await r.json();
      $('healthOut').textContent = JSON.stringify(j, null, 2);
    } catch (e) {
      $('healthOut').textContent = 'Ошибка: ' + e.message;
    }
  });

  document.querySelectorAll('[data-locale]').forEach((b) => {
    b.addEventListener('click', () => {
      state.locale = b.dataset.locale;
      localStorage.setItem(LS_LOCALE, state.locale);
      document.querySelectorAll('.cn-hint').forEach((el) => {
        el.style.display = state.locale === 'cn' ? '' : (state.locale === 'ru' ? '' : '');
      });
      flash(state.locale === 'cn' ? '中文 labels on' : 'Русский', 'ok');
    });
  });
  $('btnLocale').addEventListener('click', () => {
    state.locale = state.locale === 'cn' ? 'ru' : 'cn';
    localStorage.setItem(LS_LOCALE, state.locale);
    flash(state.locale === 'cn' ? 'Подписи: RU + 中文' : 'Подписи: RU', 'info');
  });

  $('btn2faSetup').addEventListener('click', async () => {
    $('totpModalErr').textContent = '';
    try {
      const data = await api('/api/auth/2fa/setup', { method: 'POST', body: '{}' });
      $('totpQr').src = data.qr_data_url || '';
      $('totpSecret').value = data.secret || '';
      $('modal2fa').classList.remove('hidden');
    } catch (e) {
      flash('2FA setup: ' + e.message, 'err');
    }
  });
  $('btn2faClose').addEventListener('click', () => $('modal2fa').classList.add('hidden'));
  $('btn2faEnable').addEventListener('click', async () => {
    try {
      await api('/api/auth/2fa/enable', { method: 'POST', body: JSON.stringify({ code: $('totpEnableCode').value.trim() }) });
      flash('2FA включена', 'ok');
      $('modal2fa').classList.add('hidden');
      check2faBanner();
    } catch (e) {
      $('totpModalErr').textContent = e.message;
    }
  });
  $('btn2faDisable').addEventListener('click', async () => {
    try {
      await api('/api/auth/2fa/disable', { method: 'POST', body: JSON.stringify({ code: $('totpEnableCode').value.trim() }) });
      flash('2FA отключена', 'ok');
      $('modal2fa').classList.add('hidden');
    } catch (e) {
      $('totpModalErr').textContent = e.message;
    }
  });


  // ——— Price Calculator / Калькулятор цены ———
  function roleIs(r) { return state.user && state.user.role === r; }
  function canSeeCn() { return roleIs('admin') || roleIs('cn'); }
  function canSeeRu() { return roleIs('admin') || roleIs('ru'); }
  function canEditItems() { return !roleIs('ru'); }

  async function loadSheets() {
    try {
      const data = await api('/api/sheets');
      state.sheets = data.sheets || [];
      renderSheetCards();
      $('calcListView').classList.remove('hidden');
      $('calcDetailView').classList.add('hidden');
      state.currentSheet = null;
    } catch (e) {
      flash('Листы: ' + e.message, 'err');
    }
  }

  function renderSheetCards() {
    const box = $('sheetCards');
    if (!box) return;
    if (!state.sheets.length) {
      box.innerHTML = '<div class="muted">Нет листов. Нажмите «Создать лист».</div>';
      return;
    }
    box.innerHTML = state.sheets.map((s) => (
      '<div class="sheet-card" data-id="' + s.id + '">' +
        '<div class="name">' + esc(s.title) + '</div>' +
        '<div class="meta">#' + s.id + ' · курс ' + esc(s.exchange_rate) +
          ' · позиций ' + (s.item_count != null ? s.item_count : '—') +
          (s.created_by_username ? ' · ' + esc(s.created_by_username) : '') +
        '</div>' +
        '<span class="pill-status ' + esc(s.status || '') + '">' + esc(s.status || 'draft') + '</span>' +
      '</div>'
    )).join('');
    box.querySelectorAll('.sheet-card').forEach((el) => {
      el.addEventListener('click', () => openSheet(Number(el.dataset.id)));
    });
  }

  $('btnSheetCreate').addEventListener('click', async () => {
    const title = prompt('Название листа', 'Расчёт ' + new Date().toLocaleDateString('ru-RU'));
    if (title === null) return;
    try {
      const data = await api('/api/sheets', {
        method: 'POST',
        body: JSON.stringify({ title: title || 'Новый лист', exchange_rate: 12.5, margin_mode: 'percent', margin_value: 20 })
      });
      flash('Лист создан', 'ok');
      await openSheet(data.sheet.id);
    } catch (e) { flash(e.message, 'err'); }
  });
  $('btnSheetReload').addEventListener('click', () => loadSheets());
  $('btnSheetBack').addEventListener('click', () => loadSheets());

  async function openSheet(id) {
    try {
      const data = await api('/api/sheets/' + id);
      state.currentSheet = data.sheet;
      state.sheetItems = (data.sheet.items || []).map(normalizeItemRow);
      state.sheetCosts = data.sheet.costs || [];
      state.calcResult = data.sheet.calc || null;
      $('calcListView').classList.add('hidden');
      $('calcDetailView').classList.remove('hidden');
      $('sheetTitle').value = data.sheet.title || '';
      $('sheetStatus').value = data.sheet.status || 'draft';
      $('sheetRate').value = data.sheet.exchange_rate;
      $('sheetMarginMode').value = data.sheet.margin_mode || 'percent';
      $('sheetMarginValue').value = data.sheet.margin_value != null ? data.sheet.margin_value : 20;
      if ($('sheetDutyOverride')) $('sheetDutyOverride').value = data.sheet.duty_pct_override != null ? data.sheet.duty_pct_override : '';
      if ($('sheetVatOverride')) $('sheetVatOverride').value = data.sheet.vat_pct_override != null ? data.sheet.vat_pct_override : '';
      applyRoleUi();
      setCalcSub(state.calcSub || 'items');
      renderItemsTable();
      renderCosts();
      renderCalcResult();
    } catch (e) { flash('Лист: ' + e.message, 'err'); }
  }

  function normalizeItemRow(it) {
    return {
      id: it.id,
      sku: it.sku || '',
      name: it.name || '',
      qty: it.qty != null ? it.qty : 1,
      china_price_cny: it.china_price_redacted ? null : (it.china_price_cny != null ? it.china_price_cny : 0),
      weight_kg: it.weight_kg != null ? it.weight_kg : '',
      tnved_code: it.tnved_code || '',
      tnved_display: it.tnved_display || it.tnved_code || '',
      rub_line_total: it.rub_line_total,
      china_price_redacted: !!it.china_price_redacted,
      duty_pct: it.duty_pct,
      vat_pct: it.vat_pct,
      tnved_warning: it.tnved_warning,
      notes: it.notes || '',
      attrs: it.attrs || ''
    };
  }

  function applyRoleUi() {
    const showCn = canSeeCn();
    const showRu = canSeeRu();
    $('subtabCn').classList.toggle('hidden', !showCn);
    $('subtabRu').classList.toggle('hidden', !showRu);
    const subTnved = $('subtabTnved');
    if (subTnved) subTnved.classList.toggle('hidden', !roleIs('admin'));
    document.querySelectorAll('.col-cny').forEach((el) => el.classList.toggle('hidden', roleIs('ru')));
    $('itemsHint').textContent = roleIs('ru')
      ? 'Роль RU: цена ¥ скрыта, видна сумма в ₽'
      : (roleIs('cn') ? 'Роль CN: издержки RU скрыты' : '');
    $('btnItemsSave').classList.toggle('hidden', !canEditItems());
    $('btnItemAdd').classList.toggle('hidden', !canEditItems());
    const xlsxLabel = $('sheetXlsx') && $('sheetXlsx').closest('label');
    if (xlsxLabel) xlsxLabel.classList.toggle('hidden', !canEditItems());
  }

  function setCalcSub(name) {
    if (name === 'cn' && !canSeeCn()) name = 'items';
    if (name === 'ru' && !canSeeRu()) name = 'items';
    if (name === 'tnved' && !roleIs('admin')) name = 'items';
    state.calcSub = name;
    document.querySelectorAll('#calcSubtabs button').forEach((b) => {
      b.classList.toggle('active', b.dataset.sub === name);
    });
    ['items', 'cn', 'ru', 'result', 'tnved'].forEach((s) => {
      const el = $('calcSub-' + s);
      if (el) el.classList.toggle('hidden', s !== name);
    });
    if (name === 'tnved') loadTnvedRules();
  }
  document.querySelectorAll('#calcSubtabs button').forEach((btn) => {
    btn.addEventListener('click', () => setCalcSub(btn.dataset.sub));
  });

  function renderItemsTable() {
    const body = $('itemsBody');
    if (!body) return;
    const rate = Number(($('sheetRate') && $('sheetRate').value) || (state.currentSheet && state.currentSheet.exchange_rate) || 12.5);
    const ru = roleIs('ru');
    const editable = canEditItems();
    if (!state.sheetItems.length) {
      body.innerHTML = '<tr><td colspan="8" class="muted">Нет строк. Добавьте или загрузите Excel.</td></tr>';
      return;
    }
    body.innerHTML = state.sheetItems.map((it, idx) => {
      const price = it.china_price_redacted ? null : Number(it.china_price_cny || 0);
      const qty = Number(it.qty || 0);
      const rub = it.rub_line_total != null
        ? Number(it.rub_line_total)
        : (price != null ? Math.round(price * qty * rate * 100) / 100 : '—');
      const missingTnved = !it.tnved_code;
      const warn = (it.tnved_warning || missingTnved)
        ? '<div class="tnved-warn">' + esc(it.tnved_warning || 'Код ТН ВЭД не указан') + '</div>'
        : '';
      return '<tr data-idx="' + idx + '">' +
        '<td><input data-f="sku" value="' + escAttr(it.sku) + '" ' + (editable ? '' : 'readonly') + ' /></td>' +
        '<td><input data-f="name" value="' + escAttr(it.name) + '" ' + (editable ? '' : 'readonly') + ' /></td>' +
        '<td><input data-f="qty" type="number" step="0.01" value="' + escAttr(it.qty) + '" ' + (editable ? '' : 'readonly') + ' /></td>' +
        (ru
          ? '<td class="col-cny hidden"><span class="muted">скрыто</span></td>'
          : '<td class="col-cny"><input data-f="china_price_cny" type="number" step="0.01" value="' + escAttr(it.china_price_cny) + '" /></td>') +
        '<td><input data-f="weight_kg" type="number" step="0.001" value="' + escAttr(it.weight_kg) + '" ' + (editable ? '' : 'readonly') + ' /></td>' +
        '<td class="col-tnved' + (missingTnved ? ' tnved-warn' : '') + '"><input data-f="tnved_code" value="' + escAttr(it.tnved_display || it.tnved_code || '') + '" placeholder="9405 20 …" ' + (editable || roleIs('admin') ? '' : 'readonly') + ' />' + warn + '</td>' +
        '<td class="col-rub">' + esc(rub) + '</td>' +
        '<td>' + (editable ? '<button type="button" class="btn ghost sm btn-item-del" data-idx="' + idx + '">×</button>' : '') + '</td>' +
      '</tr>';
    }).join('');
    body.querySelectorAll('input').forEach((inp) => {
      inp.addEventListener('change', () => {
        const tr = inp.closest('tr');
        const i = Number(tr.dataset.idx);
        const f = inp.dataset.f;
        if (!state.sheetItems[i]) return;
        state.sheetItems[i][f] = inp.type === 'number' ? (inp.value === '' ? '' : Number(inp.value)) : inp.value;
      });
    });
    body.querySelectorAll('.btn-item-del').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.sheetItems.splice(Number(btn.dataset.idx), 1);
        renderItemsTable();
      });
    });
  }

  $('btnItemAdd').addEventListener('click', () => {
    state.sheetItems.push({ sku: '', name: '', qty: 1, china_price_cny: 0, weight_kg: '', tnved_code: '' });
    renderItemsTable();
  });

  $('btnItemsSave').addEventListener('click', async () => {
    if (!state.currentSheet) return;
    try {
      const items = state.sheetItems.map((it) => ({
        sku: it.sku || null,
        name: it.name || '',
        qty: Number(it.qty) || 0,
        china_price_cny: Number(it.china_price_cny) || 0,
        weight_kg: it.weight_kg === '' || it.weight_kg == null ? null : Number(it.weight_kg),
        tnved_code: it.tnved_code || null
      }));
      const data = await api('/api/sheets/' + state.currentSheet.id + '/items', {
        method: 'POST',
        body: JSON.stringify({ items: items, mode: 'replace' })
      });
      state.currentSheet = data.sheet;
      state.sheetItems = (data.sheet.items || []).map(normalizeItemRow);
      state.sheetCosts = data.sheet.costs || state.sheetCosts;
      renderItemsTable();
      flash('Товары сохранены', 'ok');
    } catch (e) { flash(e.message, 'err'); }
  });

  $('btnItemTemplate').addEventListener('click', () => {
    const rows = [
      ['sku', 'name', 'qty', 'china_price_cny', 'weight_kg', 'tnved_code'],
      ['LI-2910S-BODY', 'Корпус нерж 1.4мм', 1, 85, 2.5, '9405 19 000 0'],
      ['LI-2910S-LED', 'LED спот 6W', 2, 18, 0.1, '9405 41 000 0'],
      ['LI-2910S-DRV', 'Драйвер 36V', 2, 22, 0.15, '8504 40 000 0']
    ];
    if (typeof XLSX !== 'undefined') {
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'items');
      XLSX.writeFile(wb, 'gilil_price_template.xlsx');
    } else {
      const csv = rows.map((r) => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'gilil_price_template.csv';
      a.click();
    }
  });

  $('sheetXlsx').addEventListener('change', async (ev) => {
    const file = ev.target.files && ev.target.files[0];
    ev.target.value = '';
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      let rows = [];
      if (typeof XLSX !== 'undefined') {
        const wb = XLSX.read(buf, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      } else {
        flash('SheetJS не загружен — используйте CSV вручную', 'err');
        return;
      }
      const mapped = rows.map((r) => ({
        sku: r.sku || r.SKU || r.артикул || '',
        name: r.name || r.Name || r.название || r.наименование || '',
        qty: Number(r.qty || r.Qty || r.кол || r.количество || 1) || 1,
        china_price_cny: Number(r.china_price_cny || r.price_cny || r.price || r.цена || 0) || 0,
        weight_kg: r.weight_kg || r.weight || r.вес || '',
        tnved_code: r.tnved_code || r.tnved || r.ТНВЭД || r['код тн вэд'] || ''
      })).filter((r) => r.name || r.sku);
      if (!mapped.length) { flash('В файле нет строк', 'err'); return; }
      state.sheetItems = mapped;
      renderItemsTable();
      flash('Загружено строк: ' + mapped.length + ' — нажмите «Сохранить товары»', 'info');
    } catch (e) { flash('Excel: ' + e.message, 'err'); }
  });

  function renderCosts() {
    renderCostSide('cn', $('costsCnList'));
    renderCostSide('ru', $('costsRuList'));
  }

  function renderCostSide(side, box) {
    if (!box) return;
    if ((side === 'cn' && !canSeeCn()) || (side === 'ru' && !canSeeRu())) {
      box.innerHTML = '<div class="muted">Скрыто для вашей роли</div>';
      return;
    }
    const list = (state.sheetCosts || []).filter((c) => c.side === side);
    const canEdit = roleIs('admin') || (side === 'cn' && roleIs('cn')) || (side === 'ru' && roleIs('ru'));
    if (!list.length) {
      box.innerHTML = '<div class="muted">Нет издержек</div>';
    } else {
      box.innerHTML = list.map((c) => (
        '<div class="cost-row" data-id="' + c.id + '">' +
          '<div><label>Название</label><input data-f="name" value="' + escAttr(c.name) + '" ' + (canEdit ? '' : 'readonly') + ' /></div>' +
          '<div><label>Сумма</label><input data-f="amount" type="number" step="0.01" value="' + escAttr(c.amount) + '" ' + (canEdit ? '' : 'readonly') + ' /></div>' +
          '<div><label>Валюта</label><select data-f="currency" ' + (canEdit ? '' : 'disabled') + '>' +
            '<option value="CNY"' + (c.currency === 'CNY' ? ' selected' : '') + '>CNY</option>' +
            '<option value="RUB"' + (c.currency === 'RUB' ? ' selected' : '') + '>RUB</option>' +
          '</select></div>' +
          '<div><label>Примечание</label><input data-f="note" value="' + escAttr(c.note || '') + '" ' + (canEdit ? '' : 'readonly') + ' /></div>' +
          '<div>' + (canEdit
            ? '<button type="button" class="btn ghost sm btn-cost-save">✓</button> <button type="button" class="btn danger sm btn-cost-del">×</button>'
            : '') + '</div>' +
        '</div>'
      )).join('');
    }
    box.querySelectorAll('.btn-cost-save').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const row = btn.closest('.cost-row');
        const id = Number(row.dataset.id);
        const payload = {};
        row.querySelectorAll('[data-f]').forEach((el) => { payload[el.dataset.f] = el.value; });
        payload.amount = Number(payload.amount) || 0;
        try {
          const data = await api('/api/sheets/' + state.currentSheet.id + '/costs/' + id, {
            method: 'PUT', body: JSON.stringify(payload)
          });
          state.currentSheet = data.sheet;
          state.sheetCosts = data.sheet.costs || [];
          renderCosts();
          flash('Издержка обновлена', 'ok');
        } catch (e) { flash(e.message, 'err'); }
      });
    });
    box.querySelectorAll('.btn-cost-del').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.closest('.cost-row').dataset.id);
        try {
          await api('/api/sheets/' + state.currentSheet.id + '/costs/' + id, { method: 'DELETE' });
          state.sheetCosts = state.sheetCosts.filter((c) => c.id !== id);
          renderCosts();
          flash('Удалено', 'ok');
        } catch (e) { flash(e.message, 'err'); }
      });
    });
  }

  async function addCost(side) {
    if (!state.currentSheet) return;
    const name = prompt(side === 'cn' ? 'Название издержки CN' : 'Название издержки RU',
      side === 'cn' ? 'Офис / зарплаты' : 'Пошлина / НДС / доставка');
    if (!name) return;
    const amount = Number(prompt('Сумма', '0') || 0);
    const currency = side === 'cn' ? 'CNY' : 'RUB';
    try {
      const data = await api('/api/sheets/' + state.currentSheet.id + '/costs', {
        method: 'POST',
        body: JSON.stringify({ side, name, amount, currency, note: '' })
      });
      state.currentSheet = data.sheet;
      state.sheetCosts = data.sheet.costs || [];
      renderCosts();
      flash('Добавлено', 'ok');
    } catch (e) { flash(e.message, 'err'); }
  }
  $('btnCostCnAdd').addEventListener('click', () => addCost('cn'));
  $('btnCostRuAdd').addEventListener('click', () => addCost('ru'));

  $('btnSheetSaveMeta').addEventListener('click', async () => {
    if (!state.currentSheet) return;
    try {
      const data = await api('/api/sheets/' + state.currentSheet.id, {
        method: 'PUT',
        body: JSON.stringify({
          title: $('sheetTitle').value.trim(),
          status: $('sheetStatus').value,
          exchange_rate: Number($('sheetRate').value),
          margin_mode: $('sheetMarginMode').value,
          margin_value: Number($('sheetMarginValue').value)
        })
      });
      state.currentSheet = data.sheet;
      flash('Мета сохранена', 'ok');
    } catch (e) { flash(e.message, 'err'); }
  });

  $('btnSheetDelete').addEventListener('click', async () => {
    if (!state.currentSheet) return;
    if (!confirm('Удалить лист #' + state.currentSheet.id + '?')) return;
    try {
      await api('/api/sheets/' + state.currentSheet.id, { method: 'DELETE' });
      flash('Удалён', 'ok');
      loadSheets();
    } catch (e) { flash(e.message, 'err'); }
  });

  $('btnCalcRun').addEventListener('click', async () => {
    if (!state.currentSheet) return;
    try {
      // save meta first (rate/margin)
      const dutyOv = $('sheetDutyOverride') && $('sheetDutyOverride').value !== '' ? Number($('sheetDutyOverride').value) : null;
      const vatOv = $('sheetVatOverride') && $('sheetVatOverride').value !== '' ? Number($('sheetVatOverride').value) : null;
      await api('/api/sheets/' + state.currentSheet.id, {
        method: 'PUT',
        body: JSON.stringify({
          title: $('sheetTitle').value.trim(),
          status: $('sheetStatus').value,
          exchange_rate: Number($('sheetRate').value),
          margin_mode: $('sheetMarginMode').value,
          margin_value: Number($('sheetMarginValue').value),
          duty_pct_override: dutyOv,
          vat_pct_override: vatOv
        })
      });
      const data = await api('/api/sheets/' + state.currentSheet.id + '/calc');
      state.calcResult = data.calc;
      if (data.sheet) {
        state.currentSheet = data.sheet;
        if (data.sheet.items) state.sheetItems = data.sheet.items.map(normalizeItemRow);
        if (data.sheet.costs) state.sheetCosts = data.sheet.costs;
      }
      renderItemsTable();
      renderCalcResult();
      flash('Расчёт готов', 'ok');
    } catch (e) { flash(e.message, 'err'); }
  });

  function renderCalcResult() {
    const box = $('calcResultBox');
    if (!box) return;
    const calc = state.calcResult;
    if (!calc || !calc.breakdown) {
      box.innerHTML = '<div class="muted">Нажмите «Пересчитать»</div>';
      return;
    }
    const b = calc.breakdown;
    const rows = [];
    if (b.cn_goods_cny != null) rows.push(['Товары CN (¥)', b.cn_goods_cny + ' ¥']);
    if (b.cn_costs_cny != null) rows.push(['Издержки CN (¥)', b.cn_costs_cny + ' ¥']);
    if (b.cn_costs_hidden) rows.push(['Издержки CN', 'скрыто']);
    if (b.cn_total_cny != null) rows.push(['Итого CN (¥)', b.cn_total_cny + ' ¥']);
    if (b.cn_total_rub != null) rows.push(['CN → ₽', b.cn_total_rub + ' ₽']);
    if (b.ru_costs_rub != null) rows.push(['Издержки RU (₽)', b.ru_costs_rub + ' ₽']);
    if (b.ru_costs_hidden) rows.push(['Издержки RU', 'скрыто']);
    if (b.duty_rub != null) rows.push(['Пошлина ТН ВЭД (₽)', b.duty_rub + ' ₽']);
    if (b.vat_rub != null) rows.push(['НДС ТН ВЭД (₽)', b.vat_rub + ' ₽']);
    if (b.ru_base_rub != null) rows.push(['База до маржи (₽)', b.ru_base_rub + ' ₽']);
    if (b.margin_amount_rub != null) {
      rows.push(['Маржа (' + (b.margin_mode === 'fixed' ? 'фикс' : b.margin_value + '%') + ')', b.margin_amount_rub + ' ₽']);
    }
    if (b.total_rub != null) rows.push(['ИТОГО', b.total_rub + ' ₽']);
    else if (b.goods_rub != null) rows.push(['Товары в ₽ (без RU/маржи)', b.goods_rub + ' ₽']);

    let warnHtml = '';
    if (calc.warnings && calc.warnings.length) {
      warnHtml = calc.warnings.map((w) => '<div class="calc-warn">' + esc(w) + '</div>').join('');
    }
    box.innerHTML =
      warnHtml +
      (b.total_rub != null ? '<div class="total">' + esc(b.total_rub) + ' ₽</div>' : '') +
      rows.map((r) => '<div class="bd-row"><span>' + esc(r[0]) + '</span><span>' + esc(r[1]) + '</span></div>').join('');
  }

  $('btnCalcExport').addEventListener('click', () => {
    if (!state.currentSheet) return;
    const calc = state.calcResult;
    const rate = Number($('sheetRate').value) || state.currentSheet.exchange_rate;
    const itemRows = [['sku', 'name', 'qty', 'china_price_cny', 'weight_kg', 'tnved_code', 'rub_line_total']].concat(
      state.sheetItems.map((it) => [
        it.sku, it.name, it.qty,
        it.china_price_redacted ? '' : it.china_price_cny,
        it.weight_kg, it.tnved_code || '',
        it.rub_line_total != null ? it.rub_line_total : ''
      ])
    );
    const costRows = [['side', 'name', 'amount', 'currency', 'note']].concat(
      (state.sheetCosts || []).map((c) => [c.side, c.name, c.amount, c.currency, c.note || ''])
    );
    const bd = (calc && calc.breakdown) || {};
    const sumRows = [
      ['field', 'value'],
      ['exchange_rate', rate],
      ['margin_mode', bd.margin_mode || ''],
      ['margin_value', bd.margin_value != null ? bd.margin_value : ''],
      ['cn_goods_cny', bd.cn_goods_cny != null ? bd.cn_goods_cny : ''],
      ['cn_costs_cny', bd.cn_costs_cny != null ? bd.cn_costs_cny : ''],
      ['cn_total_rub', bd.cn_total_rub != null ? bd.cn_total_rub : ''],
      ['ru_costs_rub', bd.ru_costs_rub != null ? bd.ru_costs_rub : ''],
      ['duty_rub', bd.duty_rub != null ? bd.duty_rub : ''],
      ['vat_rub', bd.vat_rub != null ? bd.vat_rub : ''],
      ['total_rub', bd.total_rub != null ? bd.total_rub : '']
    ];
    if (typeof XLSX !== 'undefined') {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(itemRows), 'items');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(costRows), 'costs');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sumRows), 'summary');
      XLSX.writeFile(wb, 'gilil_sheet_' + state.currentSheet.id + '.xlsx');
    } else {
      flash('SheetJS недоступен', 'err');
    }
  });


  // ——— База ТН ВЭД (admin) ———
  async function loadTnvedRules() {
    if (!roleIs('admin')) return;
    try {
      const data = await api('/api/tnved/rules');
      state.tnvedRules = data.rules || [];
      renderTnvedRules();
    } catch (e) {
      flash('ТН ВЭД: ' + e.message, 'err');
    }
  }

  function renderTnvedRules() {
    const body = $('tnvedRulesBody');
    if (!body) return;
    if (!state.tnvedRules.length) {
      body.innerHTML = '<tr><td colspan="8" class="muted">Нет правил</td></tr>';
      return;
    }
    body.innerHTML = state.tnvedRules.map((r) => (
      '<tr data-id="' + r.id + '">' +
        '<td><input data-f="pattern" value="' + escAttr(r.pattern) + '" /></td>' +
        '<td><input data-f="tnved_code" value="' + escAttr(r.tnved_display || r.tnved_code || '') + '" style="width:100px" /></td>' +
        '<td><input data-f="duty_pct" type="number" step="0.01" value="' + escAttr(r.duty_pct != null ? r.duty_pct : '') + '" style="width:70px" /></td>' +
        '<td><input data-f="vat_pct" type="number" step="0.01" value="' + escAttr(r.vat_pct != null ? r.vat_pct : 22) + '" style="width:70px" /></td>' +
        '<td><input data-f="priority" type="number" value="' + escAttr(r.priority != null ? r.priority : 0) + '" style="width:70px" /></td>' +
        '<td><span class="muted">' + esc(r.source || '') + '</span></td>' +
        '<td><input data-f="description" value="' + escAttr(r.description || '') + '" /></td>' +
        '<td class="flex-gap">' +
          '<button type="button" class="btn ghost sm btn-tnved-save" data-id="' + r.id + '">💾</button>' +
          '<button type="button" class="btn danger sm btn-tnved-del" data-id="' + r.id + '">×</button>' +
        '</td>' +
      '</tr>'
    )).join('');
    body.querySelectorAll('.btn-tnved-save').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const tr = btn.closest('tr');
        const payload = {};
        tr.querySelectorAll('input[data-f]').forEach((inp) => {
          payload[inp.dataset.f] = inp.type === 'number'
            ? (inp.value === '' ? null : Number(inp.value))
            : inp.value;
        });
        try {
          await api('/api/tnved/rules/' + btn.dataset.id, {
            method: 'PUT',
            body: JSON.stringify(payload)
          });
          flash('Правило обновлено', 'ok');
          loadTnvedRules();
        } catch (e) { flash(e.message, 'err'); }
      });
    });
    body.querySelectorAll('.btn-tnved-del').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Удалить правило #' + btn.dataset.id + '?')) return;
        try {
          await api('/api/tnved/rules/' + btn.dataset.id, { method: 'DELETE' });
          flash('Удалено', 'ok');
          loadTnvedRules();
        } catch (e) { flash(e.message, 'err'); }
      });
    });
  }

  if ($('btnTnvedReload')) {
    $('btnTnvedReload').addEventListener('click', () => loadTnvedRules());
  }
  if ($('btnTnvedAdd')) {
    $('btnTnvedAdd').addEventListener('click', async () => {
      const pattern = prompt('Паттерн (подстрока или regex)', 'бра');
      if (pattern === null || !pattern.trim()) return;
      const code = prompt('Код ТН ВЭД', '940520');
      if (code === null || !code.trim()) return;
      const duty = prompt('Пошлина %', '12');
      try {
        await api('/api/tnved/rules', {
          method: 'POST',
          body: JSON.stringify({
            pattern: pattern.trim(),
            tnved_code: code.trim(),
            duty_pct: duty !== null && duty !== '' ? Number(duty) : 12,
            vat_pct: 22,
            priority: 30,
            source: 'manual',
            description: 'Добавлено вручную'
          })
        });
        flash('Правило добавлено', 'ok');
        loadTnvedRules();
      } catch (e) { flash(e.message, 'err'); }
    });
  }
  if ($('btnTnvedSuggest')) {
    $('btnTnvedSuggest').addEventListener('click', async () => {
      const q = ($('tnvedSuggestQ') && $('tnvedSuggestQ').value) || '';
      try {
        const data = await api('/api/tnved/suggest?q=' + encodeURIComponent(q));
        const out = $('tnvedSuggestOut');
        if (!out) return;
        if (data.suggestion) {
          out.textContent = (data.suggestion.tnved_display || data.suggestion.tnved_code) +
            ' · пошлина ' + data.suggestion.duty_pct + '% · НДС ' + data.suggestion.vat_pct + '%' +
            (data.suggestion.matched_pattern ? ' ← ' + data.suggestion.matched_pattern : '');
        } else {
          out.textContent = (data.warnings && data.warnings[0]) || 'нет совпадений';
        }
      } catch (e) { flash(e.message, 'err'); }
    });
  }

  // Boot
  if (state.token && state.user) {
    api('/api/auth/me').then(() => showApp()).catch(() => {
      setSession(null, null, null);
      showLogin();
    });
  } else {
    showLogin();
  }
})();
