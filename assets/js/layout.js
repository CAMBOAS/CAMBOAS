/* CAMBO MINI — Shared Layout (Sidebar + Topbar) */
(function () {
  'use strict';

  /* ── Page titles ── */
  const PAGE_META = {
    'index.html':               { title:'Dashboard',           subtitle:'Overview of sales, revenue, and live activity' },
    'pages/analytics.html':     { title:'Analytics',           subtitle:'Deep dive into your business metrics' },
    'pages/orders-details.html':{ title:'Smart Orderer',       subtitle:'Create orders quickly and smartly' },
    'pages/smart-mobile.html':  { title:'Smart Mobile',         subtitle:'Mobile-optimized order entry for smartphones' },
    'pages/order-list.html':        { title:'Order List',           subtitle:'View and manage all orders in one place' },
    'pages/new-order.html':     { title:'New Order',           subtitle:'Create a new order' },
    'pages/customers.html':     { title:'Customers',           subtitle:'Manage your customer base' },
    'pages/products.html':      { title:'Products',            subtitle:'Browse and manage products' },
    'pages/stock.html':         { title:'Stock',               subtitle:'Track inventory levels and stock movements' },
    'pages/delivery.html':      { title:'Delivery',            subtitle:'Manage delivery and shipping' },
    'pages/commission.html':    { title:'Commission',          subtitle:'Agent commission and leaderboard' },
    'pages/packaging.html':     { title:'Packaging',           subtitle:'វិចខ្ចប់ និងរៀបចំការដឹកជញ្ជូន' },
    'pages/settings.html':      { title:'Settings',            subtitle:'Configure your workspace' },
    'login.html':               { title:'Login',               subtitle:'' },
  };

  /* ── Icons ── */
  const ic = {
    dashboard: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    analytics:  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    orders:     '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>',
    pos:        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    orderlist: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="12" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="10" y2="18"/><line x1="12" y1="18" x2="16" y2="18"/></svg>',
    neworder:   '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    customers:  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    products:   '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
    stock:      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>',
    delivery:   '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
    packaging:  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16v-2"/><polyline points="7.5 4.21 12 6.81 16.5 4.21"/><polyline points="7.5 19.79 7.5 14.6 3 12"/><polyline points="21 12 16.5 14.6 16.5 19.79"/><line x1="12" y1="22" x2="12" y2="12.01"/></svg>',
    commission: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    settings:   '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    logout:     '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
    moon:       '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    sun:        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    bell:       '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  };

  /* ── Determine current page path ── */
  function getCurrentPage() {
    const path = window.location.pathname.replace(/\\/g, '/');
    const parts = path.split('/');
    const file  = parts[parts.length - 1] || 'index.html';
    const prev  = parts[parts.length - 2] || '';
    if (prev === 'pages') return 'pages/' + file;
    return file;
  }

  /* ── Build sidebar HTML ── */
  function buildSidebar() {
    const cur = getCurrentPage();
    function link(page, icon, label, danger) {
      const active = cur === page ? 'sb-active' : '';
      const cls    = danger ? 'sb-link sb-link-danger' : 'sb-link';
      const prefix = page.startsWith('pages/') ? (cur.startsWith('pages/') ? '' : 'pages/') : (cur.startsWith('pages/') ? '../' : '');
      const href   = cur.startsWith('pages/') ? (page.startsWith('pages/') ? page.replace('pages/','') : '../' + page) : page;
      return `<li><a href="${href}" class="${cls} ${active}" data-page="${page}" data-tooltip="${label}"><span class="sb-icon">${icon}</span><span class="sb-label">${label}</span><span class="sb-active-dot"></span></a></li>`;
    }

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    return `
      <div class="sb-brand">
        <div class="sb-logo">
          <img src="${cur.startsWith('pages/') ? '../' : ''}images/logo/LOGO CAMBOMINI.png" alt="CAMBO MINI" onerror="this.style.display='none'">
        </div>
        <div class="sb-brand-text">
          <div class="sb-brand-name">CAMBO MINI</div>
          <div class="sb-brand-sub">Premium Workspace</div>
        </div>
      </div>
      <div class="sb-toggle-row">
        <button class="sb-toggle-btn" id="sbToggleBtn" title="Toggle sidebar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
      </div>
      <div class="sb-divider"></div>
      <nav class="sb-nav">
        <div class="sb-section-label">Main Menu</div>
        <ul class="sb-list">
          ${link('index.html',                ic.dashboard,'Dashboard')}
          ${link('pages/analytics.html',      ic.analytics, 'Analytics')}
          ${link('pages/new-order.html',      ic.neworder,  'New Order')}
          ${link('pages/orders-details.html', ic.orders,    'Smart Orders')}
          ${link('pages/smart-mobile.html',   ic.orders,    'Smart Mobile 📱')}
          ${link('pages/order-list.html',     ic.orderlist, 'Order List')}
        </ul>
        <div class="sb-divider sb-divider-sm"></div>
        <div class="sb-section-label">Management</div>
        <ul class="sb-list">
          ${link('pages/customers.html',  ic.customers, 'Customers')}
          ${link('pages/products.html',   ic.products,  'Products')}
          ${link('pages/stock.html',      ic.stock,     'Stock')}
          ${link('pages/delivery.html',   ic.delivery,  'Delivery')}
          ${link('pages/packaging.html',  ic.packaging, 'Packaging')}
          ${link('pages/commission.html', ic.commission,'Commission')}
        </ul>
        <div class="sb-divider sb-divider-sm"></div>
        <div class="sb-section-label">System</div>
        <ul class="sb-list">
          ${link('pages/settings.html', ic.settings, 'Settings')}
          ${link('login.html',          ic.logout,   'Logout', true)}
        </ul>
      </nav>
      <div class="sb-footer">
        <button class="sb-theme-btn" id="sbThemeBtn">
          <span class="sb-theme-icon">${isDark ? ic.moon : ic.sun}</span>
          <span>${isDark ? 'Dark Mode' : 'Light Mode'}</span>
          <div class="sb-theme-toggle ${isDark ? 'on' : ''}"></div>
        </button>
        <div class="sb-user">
          <div class="sb-user-avatar">CM</div>
          <div>
            <div class="sb-user-name">CAMBO MINI</div>
            <div class="sb-user-role"><span class="sb-online-dot"></span>Administrator</div>
          </div>
        </div>
      </div>`;
  }

  /* ── Notifications ── */
  const NOTES_KEY = 'cambo_notifications_v1';
  let _activeTab = 'all';
  function loadNotes() { try { return JSON.parse(localStorage.getItem(NOTES_KEY)||'[]'); } catch(e){ return []; } }
  function saveNotes(n) { try { localStorage.setItem(NOTES_KEY,JSON.stringify(n)); } catch(e){} }

  /* ── Build topbar HTML ── */
  function buildTopbar() {
    const cur  = getCurrentPage();
    const meta = PAGE_META[cur] || { title:'CAMBO MINI', subtitle:'' };
    return `
      <div class="header-shell premium-header-shell">
        <div class="header-start">
          <button class="mobile-menu-btn" id="mobileMenuBtn">
            <span></span><span></span><span></span>
          </button>
          <div class="header-text">
            <div class="header-kicker">CAMBO MINI</div>
            <h1 class="header-title">${meta.title}</h1>
            ${meta.subtitle ? `<p class="header-subtitle">${meta.subtitle}</p>` : ''}
          </div>
        </div>
        <div class="header-actions">
          <div class="notify-wrap" style="position:relative">
            <button class="notify-btn" id="notifyBtn" aria-label="Notifications">
              ${ic.bell}
              <span class="notify-count" id="notifyCount" hidden>0</span>
            </button>
            <div class="notify-panel" id="notifyPanel" hidden>
              <div class="notify-head">
                <div class="notify-head-left">
                  <strong>Notifications</strong>
                </div>
                <div class="notify-head-actions">
                  <button class="notify-head-btn" id="markAllReadBtn">Mark all read</button>
                  <button class="notify-head-btn" id="clearAllBtn">Clear all</button>
                </div>
              </div>
              <div class="notify-tabs">
                <button class="notify-tab active" data-tab="all">All</button>
                <button class="notify-tab" data-tab="unread">Unread</button>
                <button class="notify-tab" data-tab="orders">Orders</button>
              </div>
              <div class="notify-list" id="notifyList"></div>
              <div class="notify-footer">
                <button class="notify-footer-btn">View all notifications →</button>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }

  /* ── Render notifications ── */
  function renderNotes() {
    const notes = loadNotes();
    const list  = document.getElementById('notifyList');
    const count = document.getElementById('notifyCount');
    if (!list) return;

    const unread = notes.filter(n => !n.read).length;
    if (count) {
      count.textContent = unread;
      count.hidden = unread === 0;
    }

    const filtered = _activeTab === 'unread' ? notes.filter(n=>!n.read)
                   : _activeTab === 'orders' ? notes.filter(n=>n.type==='order')
                   : notes;

    if (!filtered.length) {
      list.innerHTML = `<div class="notify-empty"><div style="font-size:2rem;margin-bottom:8px">🔔</div>No notifications yet.</div>`;
      return;
    }
    list.innerHTML = filtered.map((n,i) => `
      <div class="notify-item${n.read ? '' : ' notify-unread'}">
        <div class="notify-avatar" style="background:${n.color||'#8b5cf6'}">${n.icon||'📢'}</div>
        <div class="notify-body-wrap">
          <div class="notify-title">${n.title||''}</div>
          <div class="notify-body">${n.body||''}</div>
          <time class="notify-time">${n.time||''}</time>
        </div>
        <button class="notify-del" data-idx="${i}">×</button>
      </div>`).join('');

    list.querySelectorAll('.notify-del').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const arr = loadNotes();
        arr.splice(Number(btn.dataset.idx), 1);
        saveNotes(arr);
        renderNotes();
      });
    });
  }

  /* ── Init ── */
  function init() {
    const sidebar = document.getElementById('sharedSidebar');
    const header  = document.getElementById('sharedHeader');

    if (sidebar) sidebar.innerHTML = buildSidebar();
    if (header)  header.innerHTML  = buildTopbar();

    /* Active link highlight */
    const cur = getCurrentPage();
    document.querySelectorAll('.sb-link').forEach(a => {
      if (a.dataset.page === cur) a.classList.add('sb-active');
    });

    /* Mobile sidebar */
    const menuBtn = document.getElementById('mobileMenuBtn');
    const overlay = document.querySelector('.sidebar-overlay');
    function openSidebar()  { document.body.classList.add('sidebar-open'); }
    function closeSidebar() { document.body.classList.remove('sidebar-open'); }
    if (menuBtn) menuBtn.addEventListener('click', openSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);

    /* Notification panel */
    const notifyBtn   = document.getElementById('notifyBtn');
    const notifyPanel = document.getElementById('notifyPanel');
    const clearBtn    = document.getElementById('clearAllBtn');
    const markAllBtn  = document.getElementById('markAllReadBtn');

    let _notifyOpen = false;
    function openNotify()  { if (!notifyPanel) return; notifyPanel.hidden=false; _notifyOpen=true; renderNotes(); }
    function closeNotify() { if (!notifyPanel) return; notifyPanel.hidden=true;  _notifyOpen=false; }

    if (notifyBtn) notifyBtn.addEventListener('click', e => { e.stopPropagation(); _notifyOpen ? closeNotify() : openNotify(); });
    if (clearBtn)  clearBtn.addEventListener('click',  () => { saveNotes([]); renderNotes(); });
    if (markAllBtn) markAllBtn.addEventListener('click', () => {
      const arr = loadNotes().map(n => ({...n, read:true}));
      saveNotes(arr); renderNotes();
    });

    document.querySelectorAll('.notify-tab').forEach(tab => {
      tab.addEventListener('click', e => {
        document.querySelectorAll('.notify-tab').forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        _activeTab = e.currentTarget.dataset.tab;
        renderNotes();
      });
    });

    document.addEventListener('click', e => {
      if (_notifyOpen && notifyPanel && !notifyPanel.contains(e.target) && e.target !== notifyBtn)
        closeNotify();
    });

    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNotify(); });

    /* ── Sidebar collapse ── */
    const _chevL = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
    const _chevR = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';

    function applyCollapse(collapsed) {
      const sb = document.querySelector('.sidebar');
      if (sb) sb.classList.toggle('sb-collapsed', collapsed);
      document.body.classList.toggle('sb-collapsed', collapsed);
      const btn = document.getElementById('sbToggleBtn');
      if (btn) btn.innerHTML = collapsed ? _chevR : _chevL;
    }

    function bindToggleBtn() {
      const btn = document.getElementById('sbToggleBtn');
      if (!btn) return;
      btn.addEventListener('click', () => {
        const collapsed = !document.querySelector('.sidebar')?.classList.contains('sb-collapsed');
        localStorage.setItem('sb_collapsed', collapsed ? '1' : '0');
        applyCollapse(collapsed);
      });
    }

    /* Dark mode toggle — smooth with localStorage */
    function applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('cambo_theme', theme);
    }

    // Apply saved theme on load
    const savedTheme = localStorage.getItem('cambo_theme') || 'light';
    applyTheme(savedTheme);

    function bindThemeBtn() {
      const btn = document.getElementById('sbThemeBtn');
      if (!btn) return;
      btn.addEventListener('click', () => {
        const cur = document.documentElement.getAttribute('data-theme');
        const next = cur === 'light' ? 'dark' : 'light';
        applyTheme(next);
        // Re-render sidebar for toggle visual
        if (sidebar) {
          sidebar.innerHTML = buildSidebar();
          bindThemeBtn();
          applyCollapse(localStorage.getItem('sb_collapsed') === '1');
          bindToggleBtn();
        }
      });
    }
    bindThemeBtn();
    applyCollapse(localStorage.getItem('sb_collapsed') === '1');
    bindToggleBtn();

    /* Scroll FABs */
    const scrollUp   = document.getElementById('scrollFabUp');
    const scrollDown = document.getElementById('scrollFabDown');
    if (scrollUp)   scrollUp.addEventListener('click',   () => window.scrollTo({top:0,behavior:'smooth'}));
    if (scrollDown) scrollDown.addEventListener('click', () => window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'}));

    renderNotes();
  }

  /* Public: add notification */
  window.camboNotify = function(title, body, type, icon, color) {
    const notes = loadNotes();
    notes.unshift({ title, body, type: type||'info', icon: icon||'📢', color: color||'#8b5cf6',
      time: new Date().toLocaleTimeString(), read: false });
    saveNotes(notes.slice(0,50));
    const btn = document.getElementById('notifyBtn');
    if (btn) { btn.classList.add('notify-flash'); setTimeout(()=>btn.classList.remove('notify-flash'),800); }
    renderNotes();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* ══ macUI — macOS-style Notifications ══ */
(function(){
  var ICONS  = {success:'✅', error:'❌', warning:'⚠️', info:'ℹ️'};
  var LABELS = {success:'Success', error:'Error', warning:'Warning', info:'Info'};

  function getStack(){
    var s = document.getElementById('mac-toast-stack');
    if(!s){ s=document.createElement('div'); s.id='mac-toast-stack'; document.body.appendChild(s); }
    return s;
  }

  function macToast(message, type){
    type = type||'info';
    var stack = getStack();
    var el = document.createElement('div');
    el.className = 'mac-toast '+type;
    el.innerHTML =
      '<div class="mac-t-icon">'+(ICONS[type]||'🔔')+'</div>'
      +'<div class="mac-t-body">'
        +'<div class="mac-t-title">'+(LABELS[type]||'')+'</div>'
        +'<div class="mac-t-msg">'+String(message)+'</div>'
      +'</div>'
      +'<button class="mac-t-close">✕</button>';
    stack.appendChild(el);
    var timer = setTimeout(function(){
      el.classList.add('hide');
      setTimeout(function(){ el.remove(); }, 250);
    }, 3200);
    el.querySelector('.mac-t-close').addEventListener('click', function(){
      clearTimeout(timer); el.remove();
    });
    requestAnimationFrame(function(){ el.classList.add('show'); });
  }

  function macAlert(message, title, icon){
    return new Promise(function(resolve){
      var ov = document.createElement('div');
      ov.className = 'mac-modal-overlay';
      ov.innerHTML =
        '<div class="mac-modal">'
          +'<div class="mac-modal-ico">'+(icon||'ℹ️')+'</div>'
          +'<div class="mac-modal-title">'+String(title||'ជូនដំណឹង')+'</div>'
          +'<div class="mac-modal-msg">'+String(message)+'</div>'
          +'<div class="mac-modal-btns"><button class="mac-btn-ok">យល់ព្រម</button></div>'
        +'</div>';
      document.body.appendChild(ov);
      requestAnimationFrame(function(){ ov.classList.add('show'); });
      ov.querySelector('.mac-btn-ok').addEventListener('click', function(){
        ov.classList.remove('show');
        setTimeout(function(){ ov.remove(); resolve(); }, 200);
      });
    });
  }

  function macConfirm(message, title, danger){
    return new Promise(function(resolve){
      var ov = document.createElement('div');
      ov.className = 'mac-modal-overlay';
      ov.innerHTML =
        '<div class="mac-modal">'
          +'<div class="mac-modal-ico">'+(danger?'🗑️':'❓')+'</div>'
          +'<div class="mac-modal-title">'+String(title||'បញ្ជាក់')+'</div>'
          +'<div class="mac-modal-msg">'+String(message)+'</div>'
          +'<div class="mac-modal-btns">'
            +'<button class="mac-btn-cancel">បោះបង់</button>'
            +'<button class="mac-btn-ok'+(danger?' danger':'')+'">'+(danger?'លុប':'យល់ព្រម')+'</button>'
          +'</div>'
        +'</div>';
      document.body.appendChild(ov);
      requestAnimationFrame(function(){ ov.classList.add('show'); });
      ov.querySelector('.mac-btn-cancel').addEventListener('click', function(){
        ov.classList.remove('show');
        setTimeout(function(){ ov.remove(); resolve(false); }, 200);
      });
      ov.querySelector('.mac-btn-ok').addEventListener('click', function(){
        ov.classList.remove('show');
        setTimeout(function(){ ov.remove(); resolve(true); }, 200);
      });
    });
  }

  window.macUI = { toast: macToast, alert: macAlert, confirm: macConfirm };
  window.alert = function(msg){ macAlert(String(msg)); };
})();
