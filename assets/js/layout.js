(function(){
  const isInPages = location.pathname.includes('/pages/');
  const ROOT = isInPages ? '../' : './';
  const current = location.pathname.split('/').pop() || 'index.html';
  const pageMeta = {
    'index.html':{title:'Dashboard', subtitle:'Overview of sales, revenue, and live activity'},
    'analytics.html':{title:'Analytics', subtitle:'Track performance and growth insights'},
    'users.html':{title:'Users', subtitle:'Manage team members and account access'},
    'settings.html':{title:'Settings', subtitle:'Configure workspace preferences and tools'},
    'search-edit-pos.html':{title:'Search & Edit Orders', subtitle:'Search, filter, print, and update order data'},
    'orders-details.html':{title:'Orders Details', subtitle:'Create orders with premium dark order entry flow'},
    'login.html':{title:'Login', subtitle:'Secure access to CAMBO MINI'},
    'register.html':{title:'Register', subtitle:'Create a new workspace account'}
  };
  const KEY='cambo_notifications_v1';
  const sidebarTemplate = `<div class="sidebar-header shared-sidebar-header">
  <div class="logo-wrap">
    <img src="{{ROOT}}assets/img/logo.svg" alt="CAMBO MINI logo" class="shared-logo">
    <div>
      <div class="logo-text">CAMBO MINI</div>
      <div class="logo-subtext">Dark Premium Workspace</div>
    </div>
  </div>
</div>
<div class="sidebar-mini-card">
  <div class="mini-card-label">Workspace</div>
  <div class="mini-card-title">Offline Bundle</div>
  <div class="mini-card-text">Shared header and sidebar for every page.</div>
</div>
<ul class="nav-menu">
  <li class="nav-section"><span class="nav-section-title">Main Menu</span><ul>
    <li class="nav-item"><a data-page="index.html" class="nav-link"><span class="nav-icon-wrap"><svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg></span><span>Dashboard</span></a></li>
    <li class="nav-item"><a data-page="pages/analytics.html" class="nav-link"><span class="nav-icon-wrap"><svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></span><span>Analytics</span></a></li>
    <li class="nav-item"><a data-page="pages/users.html" class="nav-link"><span class="nav-icon-wrap"><svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span><span>Users</span></a></li>
    <li class="nav-item"><a data-page="pages/orders-details.html" class="nav-link"><span class="nav-icon-wrap"><svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7H4"/><path d="M20 12H4"/><path d="M20 17H4"/></svg></span><span>Orders Details</span></a></li>
    <li class="nav-item"><a data-page="pages/search-edit-pos.html" class="nav-link"><span class="nav-icon-wrap"><svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7h18"/><path d="M6 12h12"/><path d="M10 17h4"/></svg></span><span>Search &amp; Edit POS</span></a></li>
    <li class="nav-item"><a data-page="pages/settings.html" class="nav-link"><span class="nav-icon-wrap"><svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></span><span>Settings</span></a></li>
  </ul></li>
  <li class="nav-section"><span class="nav-section-title">Account</span><ul>
    <li class="nav-item"><a data-page="login.html" class="nav-link"><span class="nav-icon-wrap"><svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></span><span>Logout</span></a></li>
  </ul></li>
</ul>
<div class="sidebar-footer">
  <div class="user-profile">
    <div class="user-avatar">CM</div>
    <div class="user-info"><div class="user-name">CAMBO MINI</div><div class="user-role">Premium Dark UI</div></div>
  </div>
</div>`;
  const headerTemplate = `<div class="header-shell premium-header-shell">
  <div class="header-start">
    <button class="mobile-menu-btn" id="mobileMenuBtn" type="button" aria-label="Open menu"><span></span><span></span><span></span></button>
    <div class="header-copy">
      <div class="header-kicker">CAMBO MINI</div>
      <h1 class="header-title" id="sharedPageTitle">Dashboard</h1>
      <div class="header-subtitle" id="sharedPageSubtitle">Dark premium workspace</div>
    </div>
  </div>
  <div class="header-actions">
    <div class="header-badge">OFFLINE READY</div>
    <button class="notify-btn" id="notifyBtn" type="button" aria-label="Notifications">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
      <span class="notify-dot" id="notifyDot" hidden></span>
    </button>
    <button class="theme-pill" type="button">Dark Premium</button>
  </div>
</div>
<div class="notify-panel" id="notifyPanel" hidden>
  <div class="notify-head"><strong>Notifications</strong><button id="notifyClearBtn" type="button">Clear</button></div>
  <div class="notify-list" id="notifyList"><div class="notify-empty">No notifications yet.</div></div>
</div>`;

  function injectSharedLayout(){
    const sidebar=document.getElementById('sharedSidebar');
    const header=document.getElementById('sharedHeader');
    if(sidebar) sidebar.innerHTML = sidebarTemplate.replaceAll('{{ROOT}}', ROOT);
    if(header) header.innerHTML = headerTemplate.replaceAll('{{ROOT}}', ROOT);
  }
  function getNotes(){ try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return []} }
  function saveNotes(list){ localStorage.setItem(KEY, JSON.stringify(list.slice(0,25))); }
  function renderNotes(){
    const listEl=document.getElementById('notifyList'); const dot=document.getElementById('notifyDot');
    if(!listEl) return; const items=getNotes();
    if(dot) dot.hidden = items.length===0;
    listEl.innerHTML = items.length ? items.map(item=>`<article class="notify-item"><div class="notify-title">${item.title||'Update'}</div><div class="notify-body">${item.body||''}</div><time>${item.time||''}</time></article>`).join('') : '<div class="notify-empty">No notifications yet.</div>';
  }
  window.camboNotify = function(title, body){
    const items=getNotes(); items.unshift({title, body, time:new Date().toLocaleString()}); saveNotes(items); renderNotes();
  };

  function getTheme(){
    try { return localStorage.getItem('theme') || 'light'; } catch { return 'light'; }
  }
  function applyTheme(theme){
    const next = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch {}
    const pill = document.querySelector('.theme-pill');
    if(pill){
      pill.textContent = next === 'dark' ? 'Dark Mode' : 'Light Mode';
      pill.setAttribute('aria-label', next === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      pill.setAttribute('title', next === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      pill.classList.toggle('is-light', next === 'light');
    }
  }
  function initSharedTheme(){
    applyTheme(getTheme());
    const pill = document.querySelector('.theme-pill');
    if(pill){
      pill.addEventListener('click', ()=>{
        applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
      });
    }
  }
  function bind(){
    document.querySelectorAll('[data-page]').forEach(a=>{
      const target=a.getAttribute('data-page');
      a.setAttribute('href', ROOT+target);
      if(target.endsWith(current) || (current==='index.html' && target==='index.html')) a.classList.add('active');
    });
    const t=document.getElementById('sharedPageTitle');
    const s=document.getElementById('sharedPageSubtitle');
    const meta=pageMeta[current]||{title:'CAMBO MINI', subtitle:'Dark premium workspace'};
    if(t) t.textContent=meta.title;
    if(s) s.textContent=meta.subtitle;

    const toggle=document.getElementById('mobileMenuBtn');
    const overlay=document.querySelector('.sidebar-overlay');
    const notifyBtn=document.getElementById('notifyBtn');
    const notifyPanel=document.getElementById('notifyPanel');
    const clearBtn=document.getElementById('notifyClearBtn');
    const open=()=>document.body.classList.add('sidebar-open');
    const close=()=>document.body.classList.remove('sidebar-open');

    if(toggle) toggle.addEventListener('click', ()=>{ document.body.classList.contains('sidebar-open') ? close() : open(); });
    if(overlay) overlay.addEventListener('click', close);
    document.addEventListener('keydown', e=>{ if(e.key==='Escape'){ close(); if(notifyPanel) notifyPanel.hidden=true; } });
    document.querySelectorAll('.nav-link').forEach(a=>a.addEventListener('click', ()=>{ if(window.innerWidth <= 980) close(); }));

    if(notifyBtn) notifyBtn.addEventListener('click', (e)=>{ e.stopPropagation(); if(notifyPanel) notifyPanel.hidden=!notifyPanel.hidden; });
    if(clearBtn) clearBtn.addEventListener('click', ()=>{ saveNotes([]); renderNotes(); });
    document.addEventListener('click', (e)=>{ if(notifyPanel && !notifyPanel.hidden && !notifyPanel.contains(e.target) && e.target!==notifyBtn && !(notifyBtn && notifyBtn.contains(e.target))) notifyPanel.hidden=true; });
    renderNotes();

    let sx=0, sy=0, tracking=false;
    document.addEventListener('touchstart', (e)=>{ const t=e.touches[0]; sx=t.clientX; sy=t.clientY; tracking = sx < 22 || document.body.classList.contains('sidebar-open'); }, {passive:true});
    document.addEventListener('touchmove', (e)=>{ if(!tracking) return; const t=e.touches[0]; const dx=t.clientX-sx; const dy=Math.abs(t.clientY-sy); if(dy>50) return; if(sx<22 && dx>70) { open(); tracking=false; } if(document.body.classList.contains('sidebar-open') && dx<-70) { close(); tracking=false; } }, {passive:true});
  }
  document.addEventListener('DOMContentLoaded', ()=>{ injectSharedLayout(); bind(); initSharedTheme(); });
})();
