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

      const cls = ['calendar-day', isToday ? 'today' : '', count ? 'has-event' : '', count ? 'cal-clickable' : '']
        .filter(Boolean).join(' ');

      const badge = count
        ? `<span class="cal-order-badge">${count}</span>`
        : '';

      html += `<div class="${cls}" data-date="${key}" title="${count ? count + ' orders — ចុចដើម្បីមើល' : ''}">${d}${badge}</div>`;
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

    const gridEl = document.getElementById('calGrid');
    if (gridEl) {
      gridEl.addEventListener('click', e => {
        const day = e.target.closest('.cal-clickable');
        if (!day || !day.dataset.date) return;
        window.location.href = 'pages/order-list.html?date=' + day.dataset.date;
      });
    }
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
    pending:   { color: '#d97706', bg: '#fef3c7', label: 'Pending'   },
    delivered: { color: '#059669', bg: '#d1fae5', label: 'Delivered' },
    cancelled: { color: '#dc2626', bg: '#fee2e2', label: 'Cancelled' },
  };

  function openOrderDrawer(o) {
    const overlay = document.getElementById('orderDrawerOverlay');
    const drawer  = document.getElementById('orderDrawer');
    const body    = document.getElementById('orderDrawerBody');
    const idEl    = document.getElementById('drawerOrderId');
    if (!overlay || !drawer || !body) return;

    const statusKey = String(o.status || '').toLowerCase();
    const st  = ST_META[statusKey] || { color: '#475569', bg: '#f1f5f9', label: o.status || '—' };
    const amt = typeof orderTotal === 'function' ? orderTotal(o) : 0;
    const delivFee = Number(o.deliveryFee || 0);

    const dateStr = (() => {
      const d = typeof parseOrderDate === 'function' ? parseOrderDate(o.date) : null;
      if (!d) return o.date || '—';
      const pad = n => String(n).padStart(2,'0');
      return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
    })();

    if (idEl) idEl.textContent = o.id ? '#' + o.id : dateStr;

    const prods = Array.isArray(o.products) && o.products.length ? o.products : [];

    const infoRows = [
      ['ឈ្មោះ',        o.customer   || '—'],
      ['ទូរស័ព្ទ',      o.phone      || '—'],
      ['អាសយដ្ឋាន',    o.address    || o.detailAddress || '—'],
      ['ខេត្ត/ក្រុង',  o.province   || '—'],
      ['ថ្ងៃ/ម៉ោង',    dateStr],
      ['ដឹកជញ្ជូន',   o.delivery   || '—'],
      ['Pages',         o.page       || '—'],
      ['CloseBy',       o.closeBy    || '—'],
      ['Priority',      o.priority   || '—'],
      ['Status',        null, st],
      ['Note',          o.note       || ''],
    ].map(([label, val, statusMeta]) => {
      const valueHtml = statusMeta
        ? `<span style="padding:3px 12px;border-radius:20px;font-size:12px;font-weight:600;background:${statusMeta.bg};color:${statusMeta.color}">${statusMeta.label}</span>`
        : `<span style="font-size:13px;color:var(--text)">${val}</span>`;
      return `<div style="display:flex;align-items:center;min-height:40px;border:1px solid var(--line,#e2e8f0);border-radius:8px;padding:8px 12px;margin-bottom:6px;background:var(--input-bg,rgba(248,250,252,.8))">
        <span style="font-size:12px;color:#8b5cf6;font-weight:600;min-width:90px;flex-shrink:0">${label}</span>
        <span style="width:1px;height:16px;background:var(--line,#e2e8f0);margin:0 10px;flex-shrink:0"></span>
        ${valueHtml}
      </div>`;
    }).join('');

    const prodTableRows = prods.map(p => {
      const qty   = Number(p.qty   || 1);
      const price = Number(p.price || 0);
      const disc  = Number(p.discount || 0);
      const unit  = p.unit || 'ឈុត';
      const total = qty * price - disc;
      return `<tr>
        <td style="padding:8px 10px;font-size:12px;color:var(--text);border-bottom:1px solid var(--line,#e2e8f0)">${p.name || '—'}</td>
        <td style="padding:8px 6px;font-size:12px;color:var(--text);text-align:center;border-bottom:1px solid var(--line,#e2e8f0)">${qty}</td>
        <td style="padding:8px 6px;font-size:12px;color:var(--text);text-align:center;border-bottom:1px solid var(--line,#e2e8f0)">${unit}</td>
        <td style="padding:8px 6px;font-size:12px;color:var(--text);text-align:right;border-bottom:1px solid var(--line,#e2e8f0)">${price}</td>
        <td style="padding:8px 10px;font-size:12px;font-weight:700;color:var(--text);text-align:right;border-bottom:1px solid var(--line,#e2e8f0)">$${total.toFixed(2).replace(/\.00$/,'')}</td>
      </tr>`;
    }).join('') || `<tr><td colspan="5" style="padding:16px;text-align:center;color:#94a3b8;font-size:12px">មិនមានផលិតផល</td></tr>`;

    const khrAmt = Math.round(amt * 4100);

    body.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span style="font-size:13px;font-weight:700;color:#8b5cf6">ព័ត៌មានអតិថិជន</span>
      </div>
      ${infoRows}

      <div style="display:flex;align-items:center;justify-content:space-between;margin:18px 0 10px">
        <div style="display:flex;align-items:center;gap:8px">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          <span style="font-size:13px;font-weight:700;color:#06b6d4">ផលិតផល</span>
        </div>
      </div>
      <div style="border:1px solid var(--line,#e2e8f0);border-radius:10px;overflow:hidden">
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:rgba(139,92,246,.08)">
              <th style="padding:8px 10px;font-size:11px;font-weight:600;color:#8b5cf6;text-align:left">ផលិតផល</th>
              <th style="padding:8px 6px;font-size:11px;font-weight:600;color:#8b5cf6;text-align:center">ចំនួន</th>
              <th style="padding:8px 6px;font-size:11px;font-weight:600;color:#8b5cf6;text-align:center">ប្រភេទ</th>
              <th style="padding:8px 6px;font-size:11px;font-weight:600;color:#8b5cf6;text-align:right">តំម្លៃ</th>
              <th style="padding:8px 10px;font-size:11px;font-weight:600;color:#8b5cf6;text-align:right">សរុប</th>
            </tr>
          </thead>
          <tbody>${prodTableRows}</tbody>
        </table>
      </div>

      <div style="margin-top:14px;padding:12px 16px;border-radius:10px;background:var(--input-bg,rgba(248,250,252,.8));border:1px solid var(--line,#e2e8f0)">
        ${delivFee ? `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid var(--line,#e2e8f0)">
          <span style="font-size:13px;color:var(--muted)">🚚 ថ្ងៃដឹក</span>
          <span style="font-size:13px;font-weight:600;color:var(--text)">$${delivFee.toFixed(2)}</span>
        </div>` : ''}
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:14px;font-weight:700;color:var(--text)">GRAND TOTAL</span>
          <div style="text-align:right">
            <div style="font-size:22px;font-weight:800;background:linear-gradient(135deg,#8b5cf6,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">$${amt.toFixed(2).replace(/\.00$/,'')}</div>
            <div style="font-size:11px;color:#8b5cf6;margin-top:1px">${khrAmt.toLocaleString()}រ</div>
          </div>
        </div>
      </div>
    `;

    overlay.style.display = 'block';
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      drawer.style.transform = 'translateX(0)';
    });
  }

  function closeOrderDrawer() {
    const overlay = document.getElementById('orderDrawerOverlay');
    const drawer  = document.getElementById('orderDrawer');
    if (!overlay || !drawer) return;
    overlay.style.opacity = '0';
    drawer.style.transform = 'translateX(100%)';
    setTimeout(() => { overlay.style.display = 'none'; }, 280);
  }

  /* ─── GLOBAL DATE FILTER ───────────────────────────────── */
  let _widgetGlobalDate = '';
  let _allDashRows      = [];

  function filterRecentByDate(rows, dateStr) {
    if (!dateStr) return rows;
    const [yr, mo, dy] = dateStr.split('-').map(Number);
    return rows.filter(o => {
      const d = typeof parseOrderDate === 'function' ? parseOrderDate(o.date) : null;
      return d && d.getFullYear()===yr && d.getMonth()===mo-1 && d.getDate()===dy;
    });
  }

  function refreshRecent() {
    const rows = filterRecentByDate(_allDashRows, _widgetGlobalDate);
    renderRecentOrders(rows);
  }

  /* ─── INIT & REFRESH ────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    initCalendar();

    document.getElementById('orderDrawerClose')?.addEventListener('click', closeOrderDrawer);
    document.getElementById('orderDrawerOverlay')?.addEventListener('click', closeOrderDrawer);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeOrderDrawer(); });

    if (typeof _dashRows !== 'undefined' && _dashRows.length) {
      _allDashRows = _dashRows;
      buildOrderDays(_dashRows);
      renderCalendar();
      refreshRecent();
    }
  });

  window.addEventListener('cambo-dash-refreshed', e => {
    const rows = Array.isArray(e.detail) ? e.detail : [];
    _allDashRows = rows;
    buildOrderDays(rows);
    renderCalendar();
    refreshRecent();
  });

  window.addEventListener('cambo-global-date', e => {
    _widgetGlobalDate = (e.detail && e.detail.date) || '';
    refreshRecent();
  });

})();
