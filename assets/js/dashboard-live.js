let revenueChart;
let _chartPeriod = 'monthly';
let _dashRows = [];

/* Parse any date format → JS Date (local midnight) */
function parseOrderDate(value) {
  if (!value) return null;
  const s = String(value).trim();
  // "DD, MM, YYYY / HH:MM:SS AM/PM" — newest Apps Script format
  const dm2 = s.match(/^(\d{2}),\s*(\d{2}),\s*(\d{4})/);
  if (dm2) return new Date(+dm2[3], +dm2[2]-1, +dm2[1]);
  // DD/MM/YYYY (Cambodia Sheet format)
  const ddmm = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (ddmm) return new Date(+ddmm[3], +ddmm[2]-1, +ddmm[1]);
  // YYYY-MM-DD
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

function updateStats(rows) {
  const totalRevenue = rows.reduce((s,o) => s + orderTotal(o), 0);
  const totalOrders  = rows.length;
  const pending   = rows.filter(o => String(o.status||'').toLowerCase() === 'pending').length;

  const stats = document.querySelectorAll('.stat-value');
  if (stats[0]) stats[0].textContent = `$${totalRevenue.toFixed(2).replace(/\.00$/, '')}`;
  if (stats[1]) stats[1].textContent = String(new Set(rows.map(o => o.customer).filter(Boolean)).size || 0);
  if (stats[2]) stats[2].textContent = String(totalOrders);

  // Today & yesterday ranges
  const now       = new Date();
  const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const todayEnd  = new Date(today); todayEnd.setHours(23, 59, 59, 999);
  const yesterdayEnd = new Date(yesterday); yesterdayEnd.setHours(23, 59, 59, 999);

  const todayRows = rows.filter(o => { const d = parseOrderDate(o.date); return d && d >= today && d <= todayEnd; });
  const yesterdayRows = rows.filter(o => { const d = parseOrderDate(o.date); return d && d >= yesterday && d < today; });

  const todayRevAmt     = todayRows.reduce((s,o) => s + orderTotal(o), 0);
  const yesterdayRevAmt = yesterdayRows.reduce((s,o) => s + orderTotal(o), 0);

  // Sub-values on other cards
  const todayRev  = document.getElementById('todayRevenue');
  const todayOrd  = document.getElementById('todayOrders');
  const todayCus  = document.getElementById('todayCustomers');
  const pendBadge = document.getElementById('pendingBadge');
  if (todayRev) todayRev.textContent = '$' + todayRevAmt.toFixed(2).replace(/\.00$/, '');
  if (todayOrd) todayOrd.textContent = todayRows.length;
  if (todayCus) todayCus.textContent = new Set(todayRows.map(o => o.customer).filter(Boolean)).size;
  if (pendBadge) pendBadge.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${pending} Pending`;

  // Today's Revenue card
  const cardRev    = document.getElementById('cardTodayRev');
  const cardChange = document.getElementById('cardTodayChange');
  const cardText   = document.getElementById('cardTodayChangeText');
  const cardArrow  = document.getElementById('cardTodayArrow');
  const cardOrders = document.getElementById('cardTodayOrders');

  if (cardRev) cardRev.textContent = '$' + todayRevAmt.toFixed(2).replace(/\.00$/, '');
  if (cardOrders) cardOrders.textContent = todayRows.length;

  if (cardChange && cardText && cardArrow) {
    if (yesterdayRevAmt === 0) {
      cardChange.className = 'stat-change positive';
      cardArrow.setAttribute('points', '18 15 12 9 6 15');
      cardText.textContent = 'គ្មានទិន្នន័យម្សិល';
    } else {
      const pct = ((todayRevAmt - yesterdayRevAmt) / yesterdayRevAmt) * 100;
      const isUp = pct >= 0;
      cardChange.className = 'stat-change ' + (isUp ? 'positive' : 'negative');
      cardArrow.setAttribute('points', isUp ? '18 15 12 9 6 15' : '6 9 12 15 18 9');
      cardText.textContent = (isUp ? '+' : '') + pct.toFixed(1) + '% vs ម្សិល';
    }
  }
}

function buildChartData(rows, period) {
  const now = new Date();

  if (period === 'weekly') {
    // Last 8 weeks (Sun–Sat)
    const weeks = [];
    for (let i = 7; i >= 0; i--) {
      const s = new Date(now);
      s.setDate(now.getDate() - now.getDay() - i * 7);
      s.setHours(0, 0, 0, 0);
      const e = new Date(s); e.setDate(s.getDate() + 6); e.setHours(23, 59, 59, 999);
      const label = (s.getMonth()+1) + '/' + s.getDate();
      weeks.push({ start: s.getTime(), end: e.getTime(), label });
    }
    const totals = Array(8).fill(0);
    rows.forEach(o => {
      const d = parseOrderDate(o.date);
      if (!d) return;
      const t = d.getTime();
      weeks.forEach((w, i) => { if (t >= w.start && t <= w.end) totals[i] += orderTotal(o); });
    });
    return { labels: weeks.map(w => w.label), totals };
  }

  if (period === 'daily') {
    // Last 30 days
    const labels = [], totals = Array(30).fill(0);
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      labels.push((d.getMonth()+1) + '/' + d.getDate());
    }
    rows.forEach(o => {
      const d = parseOrderDate(o.date);
      if (!d) return;
      const diff = Math.floor((now - d) / 86400000);
      if (diff >= 0 && diff < 30) totals[29 - diff] += orderTotal(o);
    });
    return { labels, totals };
  }

  // monthly (default)
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const yr = now.getFullYear();
  const totals = Array(12).fill(0);
  rows.forEach(o => {
    const d = parseOrderDate(o.date);
    if (!d || d.getFullYear() !== yr) return;
    totals[d.getMonth()] += orderTotal(o);
  });
  return { labels: monthNames, totals };
}

function updateChart(rows, period) {
  const wrap = document.querySelector('.chart-wrapper');
  if (!wrap || !window.Chart) return;

  period = period || _chartPeriod;
  if (!document.getElementById('revenueChartCanvas'))
    wrap.innerHTML = '<div class="chart-canvas-wrap"><canvas id="revenueChartCanvas"></canvas></div>';

  const ctx = document.getElementById('revenueChartCanvas');
  if (revenueChart) revenueChart.destroy();

  const { labels, totals } = buildChartData(rows, period);

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

function bindChartButtons() {
  document.querySelectorAll('.chart-card .card-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.chart-card .card-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const map = { 'Monthly': 'monthly', 'Weekly': 'weekly', 'Daily': 'daily' };
      _chartPeriod = map[btn.textContent.trim()] || 'monthly';
      updateChart(_dashRows, _chartPeriod);
    });
  });
}

async function refreshDashboard() {
  const rows = await fetchDashboardOrders();
  _dashRows = rows;
  updateStats(rows);
  updateChart(rows, _chartPeriod);
  window.dispatchEvent(new CustomEvent('cambo-dash-refreshed', { detail: rows }));
}

window.addEventListener('cambo-orders-updated', refreshDashboard);
document.addEventListener('DOMContentLoaded', () => {
  bindChartButtons();
  refreshDashboard();
  setInterval(refreshDashboard, 30000);
});

