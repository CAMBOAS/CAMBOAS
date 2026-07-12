let revenueChart;
let _dashRows = [];
let _globalDate = ''; // "YYYY-MM-DD" or '' for all

/* Parse any date format → JS Date (local midnight) */
function parseOrderDate(value) {
  if (!value) return null;
  const s = String(value).trim();
  const dm2 = s.match(/^(\d{2}),\s*(\d{2}),\s*(\d{4})/);
  if (dm2) return new Date(+dm2[3], +dm2[2]-1, +dm2[1]);
  const ddmm = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (ddmm) return new Date(+ddmm[3], +ddmm[2]-1, +ddmm[1]);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s.slice(0,10)+'T00:00:00');
  return null;
}

async function fetchDashboardOrders() {
  try {
    let data;
    if (window.CamboAPI) {
      data = await window.CamboAPI.get({action:'list', limit:'1000'});
    } else {
      const DIRECT = 'https://script.google.com/macros/s/AKfycbzefJjsVDLZ7YwtzHxIilWyQ8-j6-7sCieD8CmPqvlKVbazr6Jhi7Zj9sjG-MLaHMkQIA/exec';
      const res = await fetch(DIRECT + '?action=list&limit=1000&_=' + Date.now());
      data = await res.json();
    }
    return Array.isArray(data?.orders)       ? data.orders
         : Array.isArray(data?.data?.orders) ? data.data.orders
         : Array.isArray(data?.rows)         ? data.rows
         : Array.isArray(data?.data)         ? data.data
         : [];
  } catch {
    return [];
  }
}

function orderTotal(order) {
  const items = (order.products||[]).reduce((s,p) =>
    s + (Number(p.qty||0) * Number(p.price||0) - Number(p.discount||0)), 0);
  return items + Number(order.deliveryFee||0);
}

/* Filter rows to a specific date string "YYYY-MM-DD" */
function filterRowsByDate(rows, dateStr) {
  if (!dateStr) return rows;
  const [yr, mo, dy] = dateStr.split('-').map(Number);
  return rows.filter(o => {
    const d = parseOrderDate(o.date);
    return d && d.getFullYear() === yr && d.getMonth() === mo - 1 && d.getDate() === dy;
  });
}

function updateStats(rows) {
  const filtered = filterRowsByDate(rows, _globalDate);

  const totalRevenue = filtered.reduce((s,o) => s + orderTotal(o), 0);
  const totalOrders  = filtered.length;
  const pending      = filtered.filter(o => String(o.status||'').toLowerCase() === 'pending').length;

  const stats = document.querySelectorAll('.stat-value');
  if (stats[0]) stats[0].textContent = `$${totalRevenue.toFixed(2).replace(/\.00$/, '')}`;
  if (stats[1]) stats[1].textContent = String(new Set(filtered.map(o => o.customer).filter(Boolean)).size || 0);
  if (stats[2]) stats[2].textContent = String(totalOrders);

  const pendBadge = document.getElementById('pendingBadge');
  if (pendBadge) pendBadge.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${pending} Pending`;

  if (_globalDate) {
    /* Date selected — show selected-date data on all sub-labels */
    const [yr, mo, dy] = _globalDate.split('-').map(Number);
    const dateLabel    = `${String(dy).padStart(2,'0')}/${String(mo).padStart(2,'0')}/${yr}`;

    const todayRev = document.getElementById('todayRevenue');
    const todayOrd = document.getElementById('todayOrders');
    const todayCus = document.getElementById('todayCustomers');
    if (todayRev) todayRev.textContent = '$' + totalRevenue.toFixed(2).replace(/\.00$/,'');
    if (todayOrd) todayOrd.textContent = totalOrders;
    if (todayCus) todayCus.textContent = new Set(filtered.map(o => o.customer).filter(Boolean)).size;

    const cardRev    = document.getElementById('cardTodayRev');
    const cardOrders = document.getElementById('cardTodayOrders');
    const cardText   = document.getElementById('cardTodayChangeText');
    const cardChange = document.getElementById('cardTodayChange');
    const cardArrow  = document.getElementById('cardTodayArrow');
    if (cardRev)    cardRev.textContent    = '$' + totalRevenue.toFixed(2).replace(/\.00$/,'');
    if (cardOrders) cardOrders.textContent = totalOrders;
    if (cardChange) cardChange.className   = 'stat-change positive';
    if (cardArrow)  cardArrow.setAttribute('points','18 15 12 9 6 15');
    if (cardText)   cardText.textContent   = dateLabel;

    /* Update KPI labels to reflect selected date */
    const statChanges = document.querySelectorAll('.stat-change:not(#pendingBadge):not(#cardTodayChange)');
    statChanges.forEach(el => { const t = el.querySelector('span, text, .sc-text'); if (!t) el.lastChild.textContent && (el.lastChild.textContent = dateLabel); });

  } else {
    /* No date — show today sub-values */
    const now       = new Date();
    const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd  = new Date(today); todayEnd.setHours(23,59,59,999);
    const yesterday = new Date(today); yesterday.setDate(today.getDate()-1);

    const todayRows     = rows.filter(o => { const d = parseOrderDate(o.date); return d && d >= today && d <= todayEnd; });
    const yesterdayRows = rows.filter(o => { const d = parseOrderDate(o.date); return d && d >= yesterday && d < today; });

    const todayRevAmt     = todayRows.reduce((s,o) => s + orderTotal(o), 0);
    const yesterdayRevAmt = yesterdayRows.reduce((s,o) => s + orderTotal(o), 0);

    const todayRev = document.getElementById('todayRevenue');
    const todayOrd = document.getElementById('todayOrders');
    const todayCus = document.getElementById('todayCustomers');
    if (todayRev) todayRev.textContent = '$' + todayRevAmt.toFixed(2).replace(/\.00$/,'');
    if (todayOrd) todayOrd.textContent = todayRows.length;
    if (todayCus) todayCus.textContent = new Set(todayRows.map(o => o.customer).filter(Boolean)).size;

    const cardRev    = document.getElementById('cardTodayRev');
    const cardOrders = document.getElementById('cardTodayOrders');
    const cardChange = document.getElementById('cardTodayChange');
    const cardText   = document.getElementById('cardTodayChangeText');
    const cardArrow  = document.getElementById('cardTodayArrow');
    if (cardRev)    cardRev.textContent    = '$' + todayRevAmt.toFixed(2).replace(/\.00$/,'');
    if (cardOrders) cardOrders.textContent = todayRows.length;

    if (cardChange && cardText && cardArrow) {
      if (yesterdayRevAmt === 0) {
        cardChange.className = 'stat-change positive';
        cardArrow.setAttribute('points','18 15 12 9 6 15');
        cardText.textContent = 'គ្មានទិន្នន័យម្សិល';
      } else {
        const pct  = ((todayRevAmt - yesterdayRevAmt) / yesterdayRevAmt) * 100;
        const isUp = pct >= 0;
        cardChange.className = 'stat-change ' + (isUp ? 'positive' : 'negative');
        cardArrow.setAttribute('points', isUp ? '18 15 12 9 6 15' : '6 9 12 15 18 9');
        cardText.textContent = (isUp ? '+' : '') + pct.toFixed(1) + '% vs ម្សិល';
      }
    }
  }
}

function buildChartData(rows) {
  if (_globalDate) {
    /* Hourly breakdown for the selected date */
    const [yr, mo, dy] = _globalDate.split('-').map(Number);
    const labels = Array.from({length:24}, (_,i) => String(i).padStart(2,'0') + ':00');
    const totals = Array(24).fill(0);
    rows.forEach(o => {
      const s = String(o.date||'').trim();
      let hour = 0;
      /* "DD, MM, YYYY / HH:MM:SS AM/PM" */
      const m1 = s.match(/^(\d{2}),\s*(\d{2}),\s*(\d{4})[^\d]+(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i);
      if (m1) {
        const d = parseOrderDate(s);
        if (!d || d.getFullYear()!==yr || d.getMonth()!==mo-1 || d.getDate()!==dy) return;
        let h = parseInt(m1[4],10);
        if (m1[6] && m1[6].toUpperCase()==='PM' && h<12) h+=12;
        if (m1[6] && m1[6].toUpperCase()==='AM' && h===12) h=0;
        hour = h;
      } else {
        const d = parseOrderDate(s);
        if (!d || d.getFullYear()!==yr || d.getMonth()!==mo-1 || d.getDate()!==dy) return;
      }
      totals[hour] += orderTotal(o);
    });
    return { labels, totals };
  }

  /* Monthly overview (default) */
  const now        = new Date();
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const yr         = now.getFullYear();
  const totals     = Array(12).fill(0);
  rows.forEach(o => {
    const d = parseOrderDate(o.date);
    if (!d || d.getFullYear() !== yr) return;
    totals[d.getMonth()] += orderTotal(o);
  });
  return { labels: monthNames, totals };
}

function updateChart(rows) {
  const wrap = document.querySelector('.chart-wrapper');
  if (!wrap || !window.Chart) return;

  if (!document.getElementById('revenueChartCanvas'))
    wrap.innerHTML = '<div class="chart-canvas-wrap"><canvas id="revenueChartCanvas"></canvas></div>';

  const ctx = document.getElementById('revenueChartCanvas');
  if (revenueChart) revenueChart.destroy();

  const { labels, totals } = buildChartData(rows);

  /* Update chart subtitle label */
  const lbl = document.getElementById('chartDateLabel');
  if (lbl) {
    if (_globalDate) {
      const [yr,mo,dy] = _globalDate.split('-').map(Number);
      lbl.textContent = `Revenue by hour — ${String(dy).padStart(2,'0')}/${String(mo).padStart(2,'0')}/${yr}`;
    } else {
      lbl.textContent = 'Monthly overview';
    }
  }

  revenueChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Revenue',
        data: totals,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139,92,246,.18)',
        fill: true,
        tension: .35,
        pointRadius: 3,
        pointBackgroundColor: '#22d3ee'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#cbd5e1', maxRotation: 45 }, grid: { color: 'rgba(148,163,184,.08)' } },
        y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,.08)' } }
      }
    }
  });
}

function applyGlobalDate(dateStr) {
  _globalDate = dateStr || '';
  updateStats(_dashRows);
  updateChart(_dashRows);
  window.dispatchEvent(new CustomEvent('cambo-dash-refreshed', { detail: _dashRows }));
}

async function refreshDashboard() {
  const rows = await fetchDashboardOrders();
  _dashRows = rows;
  updateStats(rows);
  updateChart(rows);
  window.dispatchEvent(new CustomEvent('cambo-dash-refreshed', { detail: rows }));
}

window.addEventListener('cambo-orders-updated', refreshDashboard);
window.addEventListener('cambo-global-date', e => applyGlobalDate(e.detail && e.detail.date));

document.addEventListener('DOMContentLoaded', () => {
  refreshDashboard();
  setInterval(refreshDashboard, 30000);
});
