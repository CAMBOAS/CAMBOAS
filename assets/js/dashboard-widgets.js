(function () {

  /* ─── CALENDAR ─────────────────────────────────────────── */
  const KH_DAYS   = ['អា','ច','អ','ព','ព','ស','ស'];
  const KH_MONTHS = ['មករា','កុម្ភៈ','មីនា','មេសា','ឧសភា','មិថុនា',
                     'កក្កដា','សីហា','កញ្ញា','តុលា','វិច្ឆិកា','ធ្នូ'];

  let viewYear, viewMonth;
  const orderDays = new Map(); // "YYYY-MM-DD" → count

  function buildOrderDays(rows) {
    orderDays.clear();
    rows.forEach(o => {
      const d = typeof parseOrderDate === 'function' ? parseOrderDate(o.date) : null;
      if (!d) return;
      const key = d.getFullYear() + '-'
        + String(d.getMonth() + 1).padStart(2, '0') + '-'
        + String(d.getDate()).padStart(2, '0');
      orderDays.set(key, (orderDays.get(key) || 0) + 1);
    });
  }

  function renderCalendar() {
    const titleEl = document.getElementById('calTitle');
    const gridEl  = document.getElementById('calGrid');
    if (!titleEl || !gridEl) return;

    const now = new Date();
    titleEl.textContent = KH_MONTHS[viewMonth] + ' ' + viewYear;

    const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrev  = new Date(viewYear, viewMonth, 0).getDate();

    let html = '';

    KH_DAYS.forEach(d => {
      html += `<div class="calendar-day-name">${d}</div>`;
    });

    for (let i = firstDay - 1; i >= 0; i--) {
      html += `<div class="calendar-day other-month">${daysInPrev - i}</div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const key = viewYear + '-'
        + String(viewMonth + 1).padStart(2, '0') + '-'
        + String(d).padStart(2, '0');
      const count   = orderDays.get(key) || 0;
      const isToday = now.getFullYear() === viewYear
                   && now.getMonth()    === viewMonth
                   && now.getDate()     === d;

      const cls = ['calendar-day', isToday ? 'today' : '', count ? 'has-event' : '']
        .filter(Boolean).join(' ');

      const badge = count
        ? `<span class="cal-order-badge">${count}</span>`
        : '';

      html += `<div class="${cls}" title="${count ? count + ' orders' : ''}">${d}${badge}</div>`;
    }

    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    for (let d = 1; d <= totalCells - firstDay - daysInMonth; d++) {
      html += `<div class="calendar-day other-month">${d}</div>`;
    }

    gridEl.innerHTML = html;
  }

  function initCalendar() {
    const now = new Date();
    viewYear  = now.getFullYear();
    viewMonth = now.getMonth();
    renderCalendar();

    const prev = document.getElementById('calPrev');
    const next = document.getElementById('calNext');
    if (prev) prev.addEventListener('click', () => {
      viewMonth--;
      if (viewMonth < 0) { viewMonth = 11; viewYear--; }
      renderCalendar();
    });
    if (next) next.addEventListener('click', () => {
      viewMonth++;
      if (viewMonth > 11) { viewMonth = 0; viewYear++; }
      renderCalendar();
    });
  }

  /* ─── RECENT ORDERS ─────────────────────────────────────── */
  const STATUS_STYLE = {
    pending:   { bg: 'rgba(251,191,36,.15)',  color: '#fbbf24', label: 'Pending'   },
    delivered: { bg: 'rgba(74,222,128,.15)',  color: '#4ade80', label: 'Delivered' },
    cancelled: { bg: 'rgba(248,113,113,.15)', color: '#f87171', label: 'Cancelled' },
  };

  function renderRecentOrders(rows) {
    const el = document.getElementById('recentOrdersList');
    if (!el) return;

    if (!rows.length) {
      el.innerHTML = '<div style="text-align:center;padding:24px;opacity:.45;font-size:13px">មិនមានទិន្នន័យ</div>';
      return;
    }

    const sorted = rows.slice().sort((a, b) => {
      const da = typeof parseOrderDate === 'function' ? parseOrderDate(a.date) : new Date(a.date);
      const db = typeof parseOrderDate === 'function' ? parseOrderDate(b.date) : new Date(b.date);
      return (db || 0) - (da || 0);
    });

    const recent = sorted.slice(0, 8);

    el.innerHTML = recent.map((o, idx) => {
      const statusKey = String(o.status || '').toLowerCase();
      const st  = STATUS_STYLE[statusKey] || { bg: 'rgba(148,163,184,.15)', color: '#94a3b8', label: o.status || '—' };
      const amt = typeof orderTotal === 'function'
        ? '$' + orderTotal(o).toFixed(2).replace(/\.00$/, '')
        : '—';

      const prods = Array.isArray(o.products) && o.products.length
        ? o.products.map(p => p.name || '').filter(Boolean).join(', ')
        : (o.product || '—');
      const prodShort = prods.length > 32 ? prods.slice(0, 32) + '…' : prods;

      const initials = String(o.customer || '?').trim().charAt(0).toUpperCase();

      const dateStr = (() => {
        const d = typeof parseOrderDate === 'function' ? parseOrderDate(o.date) : null;
        if (!d) return '';
        return d.getDate() + '/' + (d.getMonth() + 1);
      })();

      return `<div data-order-idx="${idx}" class="ro-row" style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.03);border:1px solid rgba(148,163,184,.08);cursor:pointer;transition:all .15s">
        <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#8b5cf6,#06b6d4);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;color:#fff;flex-shrink:0">${initials}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${o.customer || '—'}</div>
          <div style="font-size:10px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px">${prodShort}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex-shrink:0">
          <span style="font-size:12px;font-weight:700;color:var(--text)">${amt}</span>
          <span style="font-size:9px;padding:2px 7px;border-radius:20px;font-weight:600;background:${st.bg};color:${st.color}">${st.label}</span>
        </div>
        <div style="font-size:10px;color:var(--muted);flex-shrink:0;min-width:28px;text-align:right">${dateStr}</div>
      </div>`;
    }).join('');

    el.querySelectorAll('.ro-row').forEach(row => {
      row.addEventListener('mouseover', () => { row.style.background = 'rgba(139,92,246,.12)'; row.style.borderColor = 'rgba(139,92,246,.3)'; });
      row.addEventListener('mouseout',  () => { row.style.background = 'rgba(255,255,255,.03)'; row.style.borderColor = 'rgba(148,163,184,.08)'; });
      row.addEventListener('click', () => openOrderDrawer(recent[+row.dataset.orderIdx]));
    });
  }

  /* ─── ORDER DRAWER ──────────────────────────────────────── */
  const ST_META = {
    pending:   { color: '#fbbf24', bg: 'rgba(251,191,36,.18)',  border: 'rgba(251,191,36,.4)',  label: 'Pending'   },
    delivered: { color: '#4ade80', bg: 'rgba(74,222,128,.18)',  border: 'rgba(74,222,128,.4)',  label: 'Delivered' },
    cancelled: { color: '#f87171', bg: 'rgba(248,113,113,.18)', border: 'rgba(248,113,113,.4)', label: 'Cancelled' },
  };

  function openOrderDrawer(o) {
    const overlay = document.getElementById('orderDrawerOverlay');
    const drawer  = document.getElementById('orderDrawer');
    const body    = document.getElementById('orderDrawerBody');
    const idEl    = document.getElementById('drawerOrderId');
    if (!overlay || !drawer || !body) return;

    const statusKey = String(o.status || '').toLowerCase();
    const st  = ST_META[statusKey] || { color: '#94a3b8', bg: 'rgba(148,163,184,.18)', border: 'rgba(148,163,184,.4)', label: o.status || '—' };
    const amt = typeof orderTotal === 'function' ? orderTotal(o) : 0;
    const initials = String(o.customer || '?').trim().charAt(0).toUpperCase();

    const dateStr = (() => {
      const d = typeof parseOrderDate === 'function' ? parseOrderDate(o.date) : null;
      if (!d) return o.date || '—';
      return d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();
    })();

    if (idEl) idEl.textContent = o.id ? '#' + o.id : dateStr;

    const prods = Array.isArray(o.products) && o.products.length ? o.products : [];
    const delivFee = Number(o.deliveryFee || 0);

    const prodRows = prods.map((p, i) => {
      const qty       = Number(p.qty || 1);
      const price     = Number(p.price || 0);
      const disc      = Number(p.discount || 0);
      const lineTotal = qty * price - disc;
      return `
        <div style="display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border-radius:10px;background:rgba(139,92,246,.06);border:1px solid rgba(139,92,246,.15);margin-bottom:6px">
          <div style="width:22px;height:22px;border-radius:6px;background:linear-gradient(135deg,#8b5cf6,#06b6d4);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex-shrink:0;margin-top:1px">${i+1}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:600;color:#e2e8f0;line-height:1.4">${p.name || '—'}</div>
            <div style="font-size:10px;color:#94a3b8;margin-top:3px">
              x${qty} × <span style="color:#a78bfa">$${price.toFixed(2)}</span>
              ${disc ? `<span style="color:#f87171;margin-left:4px">−$${disc.toFixed(2)}</span>` : ''}
            </div>
          </div>
          <div style="font-size:13px;font-weight:700;color:#e2e8f0;flex-shrink:0">$${lineTotal.toFixed(2).replace(/\.00$/,'')}</div>
        </div>`;
    }).join('') || `<div style="text-align:center;padding:16px;color:#64748b;font-size:12px">មិនមានផលិតផល</div>`;

    body.innerHTML = `
      <div style="margin:-20px -20px 20px;padding:24px 20px 20px;background:linear-gradient(135deg,#1e1b4b 0%,#0f172a 60%,#0c1a2e 100%);border-bottom:1px solid rgba(139,92,246,.25)">
        <div style="display:flex;align-items:center;gap:14px">
          <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#8b5cf6,#06b6d4);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:#fff;flex-shrink:0;box-shadow:0 0 0 3px rgba(139,92,246,.3)">${initials}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:17px;font-weight:700;color:#f1f5f9;line-height:1.2">${o.customer || '—'}</div>
            <div style="font-size:12px;color:#94a3b8;margin-top:3px;display:flex;align-items:center;gap:5px">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91A16 16 0 0 0 15.09 16.09l.91-.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              ${o.phone || '—'}
            </div>
          </div>
          <span style="flex-shrink:0;font-size:11px;font-weight:700;padding:5px 12px;border-radius:20px;background:${st.bg};color:${st.color};border:1px solid ${st.border}">${st.label}</span>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px">
        ${chip('<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>','#06b6d4','ខេត្ត', o.province || '—')}
        ${chip('<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>','#a78bfa','កាលបរិច្ឆេទ', dateStr)}
        ${chip('<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>','#4ade80','CloseBy', o.closeBy || '—')}
        ${chip('<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10z"/></svg>','#fbbf24','Page', o.page || '—')}
        ${o.delivery ? chip('<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f472b6" stroke-width="2.5"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>','#f472b6','Delivery', o.delivery) : ''}
      </div>

      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px">Products</div>
        <div style="flex:1;height:1px;background:rgba(148,163,184,.15)"></div>
        <div style="font-size:10px;color:#64748b">${prods.length} item${prods.length !== 1 ? 's' : ''}</div>
      </div>
      ${prodRows}

      <div style="margin-top:14px;padding:14px 16px;border-radius:12px;background:linear-gradient(135deg,rgba(139,92,246,.12),rgba(6,182,212,.08));border:1px solid rgba(139,92,246,.25)">
        ${delivFee ? `<div style="display:flex;justify-content:space-between;font-size:12px;color:#94a3b8;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid rgba(148,163,184,.15)"><span>Delivery Fee</span><span style="color:#e2e8f0">$${delivFee.toFixed(2)}</span></div>` : ''}
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:13px;font-weight:600;color:#94a3b8">សរុបទាំងអស់</span>
          <span style="font-size:24px;font-weight:800;background:linear-gradient(135deg,#a78bfa,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">$${amt.toFixed(2).replace(/\.00$/,'')}</span>
        </div>
      </div>

      ${o.address ? `<div style="margin-top:12px;padding:10px 14px;border-radius:10px;background:rgba(248,113,113,.06);border:1px solid rgba(248,113,113,.2);display:flex;gap:8px;align-items:flex-start"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2.5" style="flex-shrink:0;margin-top:2px"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg><span style="font-size:11px;color:#cbd5e1;line-height:1.6">${o.address}</span></div>` : ''}
    `;

    overlay.style.display = 'block';
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      drawer.style.transform = 'translateX(0)';
    });
  }

  function chip(svgIcon, color, label, value) {
    return `<div style="padding:10px 12px;border-radius:10px;background:rgba(15,23,42,.6);border:1px solid rgba(148,163,184,.12)">
      <div style="display:flex;align-items:center;gap:5px;margin-bottom:4px">${svgIcon}<span style="font-size:10px;color:#64748b;font-weight:500">${label}</span></div>
      <div style="font-size:12px;font-weight:700;color:#e2e8f0;line-height:1.3">${value}</div>
    </div>`;
  }

  function closeOrderDrawer() {
    const overlay = document.getElementById('orderDrawerOverlay');
    const drawer  = document.getElementById('orderDrawer');
    if (!overlay || !drawer) return;
    overlay.style.opacity = '0';
    drawer.style.transform = 'translateX(100%)';
    setTimeout(() => { overlay.style.display = 'none'; }, 280);
  }

  /* ─── INIT & REFRESH ────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    initCalendar();

    document.getElementById('orderDrawerClose')?.addEventListener('click', closeOrderDrawer);
    document.getElementById('orderDrawerOverlay')?.addEventListener('click', closeOrderDrawer);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeOrderDrawer(); });

    if (typeof _dashRows !== 'undefined' && _dashRows.length) {
      buildOrderDays(_dashRows);
      renderCalendar();
      renderRecentOrders(_dashRows);
    }
  });

  window.addEventListener('cambo-dash-refreshed', e => {
    const rows = Array.isArray(e.detail) ? e.detail : [];
    buildOrderDays(rows);
    renderCalendar();
    renderRecentOrders(rows);
  });

})();
