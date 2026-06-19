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

  /* ─── ORDER STATUS DONUT ────────────────────────────────── */
  const CIRC = 339.3; // 2π × 54

  function renderDonut(rows) {
    const total     = rows.length;
    const pending   = rows.filter(o => String(o.status || '').toLowerCase() === 'pending').length;
    const delivered = rows.filter(o => String(o.status || '').toLowerCase() === 'delivered').length;
    const cancelled = rows.filter(o => String(o.status || '').toLowerCase() === 'cancelled').length;
    const other     = total - pending - delivered - cancelled;
    const pending2  = pending + other;

    const elTotal     = document.getElementById('statusDonutTotal');
    const elPending   = document.getElementById('statusPendingCount');
    const elDelivered = document.getElementById('statusDeliveredCount');
    const elCancelled = document.getElementById('statusCancelledCount');
    const segPending   = document.getElementById('statusSegPending');
    const segDelivered = document.getElementById('statusSegDelivered');
    const segCancelled = document.getElementById('statusSegCancelled');

    if (elTotal)     elTotal.textContent     = total;
    if (elPending)   elPending.textContent   = pending2;
    if (elDelivered) elDelivered.textContent = delivered;
    if (elCancelled) elCancelled.textContent = cancelled;

    if (!total || !segPending || !segDelivered || !segCancelled) return;

    const lenP = Math.round((pending2   / total) * CIRC * 10) / 10;
    const lenD = Math.round((delivered  / total) * CIRC * 10) / 10;
    const lenC = Math.round((cancelled  / total) * CIRC * 10) / 10;

    segPending.setAttribute('stroke-dasharray',   `${lenP} ${CIRC}`);
    segPending.setAttribute('stroke-dashoffset',  '0');

    segDelivered.setAttribute('stroke-dasharray',  `${lenD} ${CIRC}`);
    segDelivered.setAttribute('stroke-dashoffset', `-${lenP}`);

    segCancelled.setAttribute('stroke-dasharray',  `${lenC} ${CIRC}`);
    segCancelled.setAttribute('stroke-dashoffset', `-${lenP + lenD}`);
  }

  /* ─── INIT & REFRESH ────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    initCalendar();

    if (typeof _dashRows !== 'undefined' && _dashRows.length) {
      buildOrderDays(_dashRows);
      renderCalendar();
      renderDonut(_dashRows);
    }
  });

  window.addEventListener('cambo-dash-refreshed', e => {
    const rows = Array.isArray(e.detail) ? e.detail : [];
    buildOrderDays(rows);
    renderCalendar();
    renderDonut(rows);
  });

})();
