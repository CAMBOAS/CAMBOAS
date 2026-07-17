/* CAMBO MINI — Shared Layout (Sidebar + Topbar) */
(function () {
  'use strict';

  /* ── Language helpers ── */
  function getLang() { return localStorage.getItem('cambo_lang') || 'kh'; }
  function setLang(l) { localStorage.setItem('cambo_lang', l); }
  function t(kh, en) { return getLang() === 'en' ? en : kh; }

  /* ── Page titles (bilingual) — function so t() re-evaluates on each call ── */
  function getPageMeta() {
    return {
      'index.html':               { title: t('ផ្ទាំងគ្រប់គ្រង','Dashboard'),    subtitle: t('ទិដ្ឋភាពរួមនៃការលក់ ចំណូល និងសកម្មភាព','Overview of sales, revenue, and live activity') },
      'pages/analytics.html':     { title: t('វិភាគទិន្នន័យ','Analytics'),       subtitle: t('វិភាគស៊ីជម្រៅលើអាជីវកម្មរបស់អ្នក','Deep dive into your business metrics') },
      'pages/sales-report.html':  { title: t('របាយការណ៍លក់','Sales Report'), subtitle: t('មើលការលក់ប្រចាំថ្ងៃ Orders និង Items','View daily sales, orders and items breakdown') },
      'pages/orders-details.html':{ title: t('Smart Orders','Smart Orders'),     subtitle: t('បង្កើតបញ្ជាទិញបានលឿន និងឆ្លាតវៃ','Create orders quickly and smartly') },
      'pages/order-list.html':    { title: t('បញ្ជីបញ្ជាទិញ','Order List'),      subtitle: t('មើល និងគ្រប់គ្រងបញ្ជាទិញទាំងអស់','View and manage all orders in one place') },
      'pages/new-order.html':     { title: t('បញ្ជាទិញថ្មី','New Order'),        subtitle: t('បង្កើតបញ្ជាទិញថ្មី','Create a new order') },
      'pages/new-order-2.html':   { title: t('បញ្ជាទិញថ្មី II','New Order II'),  subtitle: t('បង្កើតបញ្ជាទិញថ្មី','Create a new order') },
      'pages/customers.html':     { title: t('អតិថិជន','Customers'),             subtitle: t('គ្រប់គ្រងបញ្ជីអតិថិជន','Manage your customer base') },
      'pages/products.html':      { title: t('ផលិតផល','Products'),               subtitle: t('រក្សាទុក និងគ្រប់គ្រងផលិតផល','Browse and manage products') },
      'pages/stock.html':         { title: t('ស្តុក','Stock'),                    subtitle: t('តាមដានស្តុក និងការផ្លាស់ប្ដូរ','Track inventory levels and stock movements') },
      'pages/delivery.html':      { title: t('ដឹកជញ្ជូន','Delivery'),            subtitle: t('គ្រប់គ្រងការដឹកជញ្ជូន','Manage delivery and shipping') },
      'pages/cmd.html':           { title: t('កម្រៃជើងសារ','Commission'),         subtitle: t('កម្រៃអ្នកលក់ និងតារាងចំណាត់ថ្នាក់','Agent commission and leaderboard') },
      'pages/packaging.html':     { title: t('វេចខ្ចប់','Packaging'),             subtitle: t('វេចខ្ចប់ និងរៀបចំការដឹកជញ្ជូន','Packaging and delivery preparation') },
      'pages/helen-loan.html':    { title: t('ការកម្ចី','Loans'),                 subtitle: t('គ្រប់គ្រងការកម្ចី និងព័ត៌មានអ្នកខ្ចី','Manage loans and borrower information') },
      'pages/loan-list.html':  { title: t('បញ្ជីកម្ចី','Loan List'),             subtitle: t('តារាង និងការគ្រប់គ្រងអ្នកខ្ចីសរុប','Borrower list and management') },
      'pages/settings.html':      { title: t('ការកំណត់','Settings'),              subtitle: t('រៀបចំ Workspace របស់អ្នក','Configure your workspace') },
      'login.html':               { title: t('ចូលប្រើ','Login'),                  subtitle: '' },
    };
  }

  /* ── Icons ── */
  const ic = {
    dashboard: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    analytics:  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    dailyrpt:   '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/><line x1="8" y1="18" x2="16" y2="18"/></svg>',
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
    cmd:        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    settings:   '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    loan:       '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>',
    loanrpt:    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    logout:     '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
    moon:       '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    sun:        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    globe:      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    translate:  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/></svg>',
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
      const onclick = danger ? ' onclick="event.preventDefault();if(window.CamboAuth)window.CamboAuth.logout();location.href=this.href;"' : '';
      return `<li><a href="${href}" class="${cls} ${active}" data-page="${page}" data-tooltip="${label}"${onclick}><span class="sb-icon">${icon}</span><span class="sb-label">${label}</span><span class="sb-active-dot"></span></a></li>`;
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
        <div class="sb-section-label">${t('ម៉ឺនុយចំបង','Main Menu')}</div>
        <ul class="sb-list">
          ${link('index.html',                ic.dashboard, t('ផ្ទាំងគ្រប់គ្រង','Dashboard'))}
          ${link('pages/analytics.html',      ic.analytics, t('វិភាគទិន្នន័យ','Analytics'))}
          ${link('pages/sales-report.html',   ic.dailyrpt,  t('របាយការណ៍លក់','Sales Report'))}
          ${link('pages/new-order.html',      ic.neworder,  t('បញ្ជាទិញថ្មី','New Order'))}
          ${link('pages/new-order-2.html',    ic.neworder,  t('បញ្ជាទិញថ្មី II','New Order II'))}
          ${link('pages/order-list.html',     ic.orderlist, t('បញ្ជីបញ្ជាទិញ','Order List'))}
        </ul>
        <div class="sb-divider sb-divider-sm"></div>
        <div class="sb-section-label">${t('ការគ្រប់គ្រង','Management')}</div>
        <ul class="sb-list">
          ${link('pages/cmd.html', ic.commission, t('កម្រៃជើងសារ','Commission'))}
          ${link('pages/customers.html',  ic.customers, t('អតិថិជន','Customers'))}
          ${link('pages/products.html',   ic.products,  t('ផលិតផល','Products'))}
          ${link('pages/stock.html',      ic.stock,     t('ស្តុក','Stock'))}
          ${link('pages/delivery.html',   ic.delivery,  t('ដឹកជញ្ជូន','Delivery'))}
          ${link('pages/packaging.html',  ic.packaging, t('វេចខ្ចប់','Packaging'))}
        </ul>
        <div class="sb-divider sb-divider-sm"></div>
        <div class="sb-section-label">${t('ហិរញ្ញវត្ថុ','Finance')}</div>
        <ul class="sb-list">
          ${link('pages/helen-loan.html',  ic.loan,    t('ការកម្ចី','Loans'))}
          ${link('pages/loan-list.html', ic.loanrpt, t('បញ្ជីកម្ចី','Loan List'))}
        </ul>
        <div class="sb-divider sb-divider-sm"></div>
        <div class="sb-section-label">${t('ប្រព័ន្ធ','System')}</div>
        <ul class="sb-list">
          ${link('pages/settings.html', ic.settings, t('ការកំណត់','Settings'))}
          ${link('login.html',          ic.logout,   t('ចាកចេញ','Logout'), true)}
        </ul>
      </nav>
      <div class="sb-footer">
        <button class="sb-lang-btn" id="langToggleBtn">
          <span class="sb-theme-icon">${getLang()==='kh' ? ic.translate : ic.globe}</span>
          <span>${getLang()==='kh' ? t('ភាសាខ្មែរ','ភាសាខ្មែរ') : t('English','English')}</span>
          <span class="sb-lang-badge">${getLang()==='kh' ? 'KH' : 'EN'}</span>
        </button>
        <button class="sb-theme-btn" id="sbThemeBtn">
          <span class="sb-theme-icon">${isDark ? ic.moon : ic.sun}</span>
          <span>${isDark ? t('របៀបងងឹត','Dark Mode') : t('របៀបភ្លឺ','Light Mode')}</span>
          <div class="sb-theme-toggle ${isDark ? 'on' : ''}"></div>
        </button>
        <div class="sb-user">
          <div class="sb-user-avatar">CM</div>
          <div>
            <div class="sb-user-name">CAMBO MINI</div>
            <div class="sb-user-role"><span class="sb-online-dot"></span>${t('អ្នកគ្រប់គ្រង','Administrator')}</div>
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
    const meta = getPageMeta()[cur] || { title:'CAMBO MINI', subtitle:'' };
    return `
      <div class="header-shell premium-header-shell">
        <div class="header-start">
          <button class="mobile-menu-btn" id="mobileMenuBtn">
            <span></span><span></span><span></span>
          </button>
          <div class="header-text">
            <div class="header-kicker">CAMBO MINI</div>
            <h1 class="header-title">${meta.title}</h1>
            <p class="header-subtitle" id="headerGreeting">${meta.subtitle || ''}</p>
          </div>
        </div>
        <div class="header-actions">
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

    /* Sidebar overlay close */
    const overlay = document.querySelector('.sidebar-overlay');
    function openSidebar()  { document.body.classList.add('sidebar-open'); }
    function closeSidebar() { document.body.classList.remove('sidebar-open'); }
    if (overlay) overlay.addEventListener('click', closeSidebar);

    /* ── bindTopbar: rebind all topbar events after any rebuild ── */
    let _notifyOpen = false;
    function bindTopbar() {
      /* Mobile menu button */
      const menuBtn = document.getElementById('mobileMenuBtn');
      if (menuBtn) { menuBtn.replaceWith(menuBtn.cloneNode(true)); }
      const menuBtn2 = document.getElementById('mobileMenuBtn');
      if (menuBtn2) menuBtn2.addEventListener('click', openSidebar);

      /* Notification panel */
      const notifyBtn   = document.getElementById('notifyBtn');
      const notifyPanel = document.getElementById('notifyPanel');
      const clearBtn    = document.getElementById('clearAllBtn');
      const markAllBtn  = document.getElementById('markAllReadBtn');

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
    }
    bindTopbar();

    document.addEventListener('click', e => {
      const notifyPanel = document.getElementById('notifyPanel');
      const notifyBtn   = document.getElementById('notifyBtn');
      if (_notifyOpen && notifyPanel && !notifyPanel.contains(e.target) && e.target !== notifyBtn) {
        notifyPanel.hidden = true; _notifyOpen = false;
      }
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { const p = document.getElementById('notifyPanel'); if(p) p.hidden=true; _notifyOpen=false; }
    });

    /* ── Sidebar collapse ── */
    const _chevL = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
    const _chevR = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';

    function applyCollapse(collapsed) {
      const sb = document.querySelector('.sidebar');
      if (sb) {
        sb.classList.toggle('sb-collapsed', collapsed);
        // Force-hide via inline style to guarantee nothing bleeds through
        sb.querySelectorAll('.sb-section-label,.sb-divider,.sb-divider-sm').forEach(el => {
          el.style.display = collapsed ? 'none' : '';
        });
      }
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
        // Update toggle pill + icon/label in-place (no sidebar rebuild → pill animates smoothly)
        const isDark = next !== 'light';
        const pill = btn.querySelector('.sb-theme-toggle');
        if (pill) pill.classList.toggle('on', isDark);
        const iconEl = btn.querySelector('.sb-theme-icon');
        if (iconEl) iconEl.innerHTML = isDark ? ic.moon : ic.sun;
        const labelEl = btn.querySelector('span:not(.sb-theme-icon)');
        if (labelEl) labelEl.textContent = isDark ? t('របៀបងងឹត','Dark Mode') : t('របៀបភ្លឺ','Light Mode');
      });
    }
    bindThemeBtn();
    applyCollapse(localStorage.getItem('sb_collapsed') === '1');
    bindToggleBtn();

    /* ── Language toggle ── */
    function bindLangBtn() {
      const btn = document.getElementById('langToggleBtn');
      if (!btn) return;
      btn.addEventListener('click', function() {
        setLang(getLang() === 'kh' ? 'en' : 'kh');
        /* Rebuild sidebar (lang button lives here now) */
        if (sidebar) {
          sidebar.innerHTML = buildSidebar();
          bindThemeBtn();
          bindToggleBtn();
          bindLangBtn();
          applyCollapse(localStorage.getItem('sb_collapsed') === '1');
        }
        /* Rebuild topbar greeting only */
        if (header) {
          header.innerHTML = buildTopbar();
          bindTopbar();
          startGreeting();
        }
        /* Notify pages that registered a lang-change callback */
        (window.__langCallbacks || []).forEach(function(cb) { try { cb(getLang()); } catch(e) {} });
      });
    }
    bindLangBtn();

    /* ── Topbar greeting: time-based + rotating motivational phrases ── */
    var _greetTimer = null;
    function startGreeting() {
      if (_greetTimer) { clearInterval(_greetTimer); _greetTimer = null; }

      /* Inject keyframes once */
      if (!document.getElementById('greetKF')) {
        var s = document.createElement('style');
        s.id = 'greetKF';
        s.textContent =
          '@keyframes greetIn{' +
            '0%{opacity:0;transform:translateY(10px) scale(.97);}' +
            '60%{opacity:1;transform:translateY(-2px) scale(1.01);}' +
            '100%{opacity:1;transform:translateY(0) scale(1);}' +
          '}' +
          '@keyframes greetOut{' +
            '0%{opacity:1;transform:translateY(0) scale(1);}' +
            '100%{opacity:0;transform:translateY(-10px) scale(.97);}' +
          '}';
        document.head.appendChild(s);
      }

      var isKH = getLang() === 'kh';
      var h = new Date().getHours();
      var timeGreet = isKH
        ? (h>=5&&h<12 ? 'អរុណសួស្ដី! ☀️' : h>=12&&h<18 ? 'ទិវាសួស្ដី! 🌤' : h>=18&&h<21 ? 'សាយណ្ហសួស្ដី! 🌆' : 'រាត្រីសួស្ដី! 🌙')
        : (h>=5&&h<12 ? 'Good Morning! ☀️' : h>=12&&h<18 ? 'Good Afternoon! 🌤' : h>=18&&h<21 ? 'Good Evening! 🌆' : 'Good Night! 🌙');

      var phrases = isKH ? [
        timeGreet,
        'ជ័យជម្នះជារបស់អ្នក! 🏆',
        'ថ្ងៃដ៏ស្រស់ស្អាត! ✨',
        'ជោគជ័យចាប់ផ្ដើមពីថ្ងៃនេះ 🚀',
        'អ្នកអាចធ្វើបាន! 💪',
        'ព្យាយាម ហើយនឹងជោគជ័យ 🌟',
        'ដំណើរការពាណិជ្ជ! 📈',
      ] : [
        timeGreet,
        'Victory belongs to you! 🏆',
        'What a beautiful day! ✨',
        'Success starts today 🚀',
        'You can do it! 💪',
        'Keep going, stay strong 🌟',
        'Great business ahead! 📈',
      ];

      var el = document.getElementById('headerGreeting');
      if (!el) return;
      el.style.cssText = 'display:block;overflow:hidden;';
      var idx = 0;

      function showPhrase(text) {
        el.style.animation = 'greetOut .38s cubic-bezier(.4,0,.6,1) forwards';
        setTimeout(function() {
          el.textContent = text;
          el.style.animation = 'greetIn .45s cubic-bezier(.22,.68,0,1.2) forwards';
        }, 380);
      }

      el.textContent = phrases[0];
      el.style.animation = 'greetIn .55s cubic-bezier(.22,.68,0,1.2) forwards';

      _greetTimer = setInterval(function() {
        idx = (idx + 1) % phrases.length;
        showPhrase(phrases[idx]);
      }, 10000);
    }
    startGreeting();

    /* ── Logo spin: randomly pick 1 of 5 styles each page load ── */
    (function() {
      var styles = [
        { name: 'logo-spin-steady',    dur: '9s',  timing: 'linear' },
        { name: 'logo-spin-pulse',     dur: '7s',  timing: 'ease-in-out' },
        { name: 'logo-spin-wobble',    dur: '6s',  timing: 'ease-in-out' },
        { name: 'logo-spin-bounce',    dur: '5s',  timing: 'ease-in-out' },
        { name: 'logo-spin-heartbeat', dur: '4s',  timing: 'ease-in-out' },
      ];
      var s = styles[Math.floor(Math.random() * styles.length)];
      var img = document.querySelector('.sb-logo img');
      if (img) {
        img.style.animationName           = s.name;
        img.style.animationDuration       = s.dur;
        img.style.animationTimingFunction = s.timing;
      }
    })();

    /* Scroll FABs */
    const scrollUp   = document.getElementById('scrollFabUp');
    const scrollDown = document.getElementById('scrollFabDown');
    if (scrollUp)   scrollUp.addEventListener('click',   () => window.scrollTo({top:0,behavior:'smooth'}));
    if (scrollDown) scrollDown.addEventListener('click', () => window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'}));

    /* ── Smart scroll: hide on scroll-down, show on scroll-up ── */
    const _topbarEl = document.getElementById('sharedHeader');
    /* Measure topbar height and set --topbar-offset so content isn't hidden behind fixed header */
    function _setTopOffset() {
      if (!_topbarEl) return;
      const h = _topbarEl.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--topbar-offset', h + 'px');
    }
    setTimeout(_setTopOffset, 80);
    window.addEventListener('resize', _setTopOffset, { passive: true });

    let _prevY = window.pageYOffset;
    window.addEventListener('scroll', function () {
      const y = window.pageYOffset;
      if (!_topbarEl) { _prevY = y; return; }
      if (y < 60) {
        _topbarEl.classList.remove('topbar-hidden');
      } else if (y > _prevY + 6) {
        _topbarEl.classList.add('topbar-hidden');    /* scrolling down */
      } else if (y < _prevY - 6) {
        _topbarEl.classList.remove('topbar-hidden'); /* scrolling up */
      }
      _prevY = y;
    }, { passive: true });

    renderNotes();
  }

  /* Public: language helpers for pages */
  window.getLang = getLang;
  window.camboT  = function(kh, en) { return getLang() === 'en' ? en : kh; };
  /* Pages can push callbacks here — called whenever language is toggled */
  window.__langCallbacks = window.__langCallbacks || [];

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

/* ══ Page Transition — smooth curtain ══ */
(function(){
  /* Inject styles directly from JS so CSS cache never blocks the effect */
  var _s = document.getElementById('_pt_css');
  if(!_s){
    _s = document.createElement('style');
    _s.id = '_pt_css';
    _s.textContent =
      '#page-curtain{position:fixed;inset:0;z-index:99996;background:var(--bg,#060c1a);' +
      'opacity:0;pointer-events:none;' +
      'transition:opacity .3s cubic-bezier(.4,0,.2,1);will-change:opacity}' +
      '#page-curtain.out{opacity:1!important;pointer-events:all}' +
      '@keyframes _pageEnter{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}' +
      '.main-content{animation:_pageEnter .4s cubic-bezier(.22,.68,0,1.2) both}';
    document.head.appendChild(_s);
  }

  /* Ensure curtain div exists in body */
  function getCurtain(){
    var c = document.getElementById('page-curtain');
    if(!c){
      c = document.createElement('div');
      c.id = 'page-curtain';
      document.body.appendChild(c);
    }
    return c;
  }

  /* Create curtain once DOM is ready */
  if(document.body){ getCurtain(); }
  else{ document.addEventListener('DOMContentLoaded', getCurtain); }

  /* Intercept ALL sidebar nav link clicks via event delegation */
  document.addEventListener('click', function(e){
    var link = e.target.closest('a.sb-link');
    if(!link) return;
    if(link.classList.contains('sb-link-danger')) return; /* logout handles itself */
    var href = link.getAttribute('href');
    if(!href || href === '#' || /^javascript/i.test(href)) return;
    /* Don't animate if already on this page */
    try{ if(new URL(href, location.href).href === location.href) return; }catch(x){}
    e.preventDefault();
    var curtain = getCurtain();
    /* Force reflow so transition fires reliably */
    curtain.style.opacity = '0';
    curtain.classList.remove('out');
    void curtain.offsetWidth; /* reflow */
    curtain.classList.add('out');
    setTimeout(function(){ window.location.href = href; }, 300);
  }, true); /* capture phase — fires before any inline onclick */

  /* Hide curtain on page show (back/forward cache) */
  window.addEventListener('pageshow', function(e){
    var c = document.getElementById('page-curtain');
    if(c){ c.classList.remove('out'); c.style.opacity = ''; }
  });
})();
