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
  function openOrderDrawer(o) {
    const overlay = document.getElementById('orderDrawerOverlay');
    const drawer  = document.getElementById('orderDrawer');
    const body    = document.getElementById('orderDrawerBody');
    const idEl    = document.getElementById('drawerOrderId');
    if (!overlay || !drawer || !body) return;

    const statusKey = String(o.status || '').toLowerCase();
    const st  = STATUS_STYLE[statusKey] || { bg: 'rgba(148,163,184,.15)', color: '#94a3b8', label: o.status || '—' };
    const amt = typeof orderTotal === 'function' ? orderTotal(o) : 0;
    const initials = String(o.customer || '?').trim().charAt(0).toUpperCase();

    const dateStr = (() => {
      const d = typeof parseOrderDate === 'function' ? parseOrderDate(o.date) : null;
      if (!d) return o.date || '—';
      return d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();
    })();

    if (idEl) idEl.textContent = o.id ? '#' + o.id : dateStr;

    const prods = Array.isArray(o.products) && o.products.length ? o.products : [];
    const prodRows = prods.map(p => {
      const lineTotal = (Number(p.qty || 1) * Number(p.price || 0) - Number(p.discount || 0));
      return `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 0;border-bottom:1px solid rgba(148,163,184,.08)">
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;color:var(--text);font-weight:500">${p.name || '—'}</div>
          <div style="font-size:10px;color:var(--muted);margin-top:2px">x${p.qty || 1} × $${Number(p.price||0).toFixed(2)}${Number(p.discount||0) ? ' <span style="color:#f87171">-$'+Number(p.discount).toFixed(2)+'</span>' : ''}</div>
        </div>
        <div style="font-size:13px;font-weight:700;color:var(--text);flex-shrink:0">$${lineTotal.toFixed(2).replace(/\.00$/,'')}</div>
      </div>`;
    }).join('') || '<div style="font-size:12px;color:var(--muted);padding:8px 0">មិនមានផលិតផល</div>';

    const delivFee = Number(o.deliveryFee || 0);

    body.innerHTML = `
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px">
        <div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#8b5cf6,#06b6d4);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:#fff;flex-shrink:0">${initials}</div>
        <div>
          <div style="font-size:16px;font-weight:700;color:var(--text)">${o.customer || '—'}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px">${o.phone || '—'}</div>
        </div>
        <span style="margin-left:auto;font-size:10px;padding:4px 10px;border-radius:20px;font-weight:600;background:${st.bg};color:${st.color}">${st.label}</span>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px">
        ${infoChip('📍','ខេត្ត', o.province || '—')}
        ${infoChip('📅','កាលបរិច្ឆេទ', dateStr)}
        ${infoChip('👤','CloseBy', o.closeBy || '—')}
        ${infoChip('📄','Page', o.page || '—')}
        ${o.delivery ? infoChip('🚚','Delivery', o.delivery) : ''}
      </div>

      <div style="font-size:12px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Products</div>
      ${prodRows}

      <div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(148,163,184,.15)">
        ${delivFee ? `<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted);margin-bottom:6px"><span>Delivery Fee</span><span>$${delivFee.toFixed(2)}</span></div>` : ''}
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:13px;font-weight:600;color:var(--muted)">សរុប</span>
          <span style="font-size:20px;font-weight:800;color:var(--text)">$${amt.toFixed(2).replace(/\.00$/,'')}</span>
        </div>
      </div>

      ${o.address ? `<div style="margin-top:14px;padding:10px 12px;border-radius:10px;background:rgba(148,163,184,.06);border:1px solid rgba(148,163,184,.1);font-size:11px;color:var(--muted);line-height:1.6"><span style="font-weight:600;color:var(--text)">អាសយដ្ឋាន:</span> ${o.address}</div>` : ''}
    `;

    overlay.style.display = 'block';
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      drawer.style.transform = 'translateX(0)';
    });
  }

  function infoChip(icon, label, value) {
    return `<div style="padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(148,163,184,.1)">
      <div style="font-size:10px;color:var(--muted);margin-bottom:2px">${label}</div>
      <div style="font-size:12px;font-weight:600;color:var(--text)">${value}</div>
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
