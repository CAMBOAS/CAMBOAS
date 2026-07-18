let revenueChart;
let _chartPeriod = 'monthly';
let _dashRows = [];
let _globalDateFrom = '';
let _globalDateTo   = '';

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
      const DIRECT = 'https://script.google.com/macros/s/AKfycbyhPAP25edj3Q2hlW1yZNMW56BzsC3Hd9fH60lRZofqQnRUMcuqa-CRIo60912HGweM1w/exec';
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

function filterByDateRange(rows, dateFrom, dateTo) {
  if (!dateFrom && !dateTo) return rows;
  const fromD = dateFrom ? new Date(dateFrom + 'T00:00:00') : null;
  const toD   = dateTo   ? new Date(dateTo   + 'T23:59:59') : null;
  return rows.filter(o => {
    const d = parseOrderDate(o.date);
    if (!d) return false;
    if (fromD && d < fromD) return false;
    if (toD   && d > toD)   return false;
    return true;
  });
}

function updateStats(rows) {
  const filtered = filterByDateRange(rows, _globalDateFrom, _globalDateTo);

  const totalRevenue = filtered.reduce((s,o) => s + orderTotal(o), 0);
  const totalOrders  = filtered.length;
  const totalItems   = filtered.reduce((s,o) => s + (o.products||[]).reduce((ps,p) => ps + Number(p.qty||0), 0), 0);

  const stats = document.querySelectorAll('.stat-value');
  if (stats[0]) stats[0].textContent = `$${totalRevenue.toFixed(2).replace(/\.00$/, '')}`;
  if (stats[1]) stats[1].textContent = String(new Set(filtered.map(o => o.customer).filter(Boolean)).size || 0);
  if (stats[2]) stats[2].textContent = String(totalOrders);

  const pendBadge = document.getElementById('pendingBadge');
  if (pendBadge) pendBadge.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> ${totalItems.toLocaleString()} Items`;

  if (_globalDateFrom || _globalDateTo) {
    /* Date range selected — show filtered data on sub-labels */
    let dateLabel = '';
    if (_globalDateFrom && _globalDateTo && _globalDateFrom === _globalDateTo) {
      const [yr,mo,dy] = _globalDateFrom.split('-').map(Number);
      dateLabel = `${String(dy).padStart(2,'0')}/${String(mo).padStart(2,'0')}/${yr}`;
    } else if (_globalDateFrom && _globalDateTo) {
      const [y1,m1,d1] = _globalDateFrom.split('-').map(Number);
      const [y2,m2,d2] = _globalDateTo.split('-').map(Number);
      dateLabel = `${String(d1).padStart(2,'0')}/${String(m1).padStart(2,'0')}/${y1} → ${String(d2).padStart(2,'0')}/${String(m2).padStart(2,'0')}/${y2}`;
    } else {
      dateLabel = _globalDateFrom || _globalDateTo;
    }

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
  const isSingle = _globalDateFrom && _globalDateFrom === _globalDateTo;
  const isRange  = _globalDateFrom && _globalDateTo && _globalDateFrom !== _globalDateTo;

  if (isSingle) {
    /* Hourly breakdown for single selected date */
    const [yr, mo, dy] = _globalDateFrom.split('-').map(Number);
    const labels = Array.from({length:24}, (_,i) => String(i).padStart(2,'0') + ':00');
    const totals = Array(24).fill(0);
    rows.forEach(o => {
      const s = String(o.date||'').trim();
      let hour = 0;
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

  if (isRange) {
    /* Daily breakdown for a date range */
    const labels = [], totals = [];
    let cur = new Date(_globalDateFrom + 'T00:00:00');
    const end = new Date(_globalDateTo + 'T00:00:00');
    while (cur <= end) {
      const dy2 = cur.getDate(), mo2 = cur.getMonth(), yr2 = cur.getFullYear();
      labels.push(String(dy2).padStart(2,'0') + '/' + String(mo2+1).padStart(2,'0'));
      totals.push(
        rows.filter(o => { const d = parseOrderDate(o.date); return d && d.getFullYear()===yr2 && d.getMonth()===mo2 && d.getDate()===dy2; })
            .reduce((s,o) => s + orderTotal(o), 0)
      );
      cur = new Date(yr2, mo2, dy2 + 1);
    }
    return { labels, totals };
  }

  const now = new Date();

  if (_chartPeriod === 'weekly') {
    /* Last 8 weeks */
    const weeks = [];
    for (let i = 7; i >= 0; i--) {
      const s = new Date(now); s.setDate(now.getDate() - now.getDay() - i * 7); s.setHours(0,0,0,0);
      const e = new Date(s); e.setDate(s.getDate() + 6); e.setHours(23,59,59,999);
      weeks.push({ start: s.getTime(), end: e.getTime(), label: (s.getMonth()+1) + '/' + s.getDate() });
    }
    const totals = Array(8).fill(0);
    rows.forEach(o => {
      const d = parseOrderDate(o.date); if (!d) return;
      const t = d.getTime();
      weeks.forEach((w, i) => { if (t >= w.start && t <= w.end) totals[i] += orderTotal(o); });
    });
    return { labels: weeks.map(w => w.label), totals };
  }

  if (_chartPeriod === 'daily') {
    /* Last 30 days */
    const labels = [], totals = Array(30).fill(0);
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      labels.push((d.getMonth()+1) + '/' + d.getDate());
    }
    rows.forEach(o => {
      const d = parseOrderDate(o.date); if (!d) return;
      const diff = Math.floor((now - d) / 86400000);
      if (diff >= 0 && diff < 30) totals[29 - diff] += orderTotal(o);
    });
    return { labels, totals };
  }

  /* Monthly overview (default) */
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

function applyGlobalDate(dateFrom, dateTo) {
  _globalDateFrom = dateFrom || '';
  _globalDateTo   = dateTo   || '';
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
window.addEventListener('cambo-global-date', e => {
  const d = (e && e.detail) || {};
  applyGlobalDate(d.dateFrom, d.dateTo);
});

function bindChartButtons() {
  const btns = document.querySelectorAll('.chart-card .card-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const map = { 'Monthly': 'monthly', 'Weekly': 'weekly', 'Daily': 'daily' };
      _chartPeriod = map[btn.textContent.trim()] || 'monthly';
      updateChart(_dashRows);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  bindChartButtons();
  refreshDashboard();
  setInterval(refreshDashboard, 30000);
});

