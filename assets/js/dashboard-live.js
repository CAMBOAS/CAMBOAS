const DASHBOARD_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzd1g4M2oIFIl5MYkUnVd-WtxTzaEgXXepuIXYJ-KZboRNJGIOXfPOd8ANWX-dzay-ynQ/exec';
let revenueChart;
let _chartPeriod = 'monthly';
let _dashRows = [];

async function fetchDashboardOrders() {
  try {
    const res = await fetch(`${DASHBOARD_WEB_APP_URL}?action=list&limit=1000&_=${Date.now()}`);
    const data = await res.json();
    return Array.isArray(data?.orders)      ? data.orders
         : Array.isArray(data?.data?.orders) ? data.data.orders
         : Array.isArray(data?.rows)         ? data.rows
         : Array.isArray(data?.data)         ? data.data
         : JSON.parse(localStorage.getItem('cambo_search_edit_orders_v3') || '[]');
  } catch {
    return JSON.parse(localStorage.getItem('cambo_search_edit_orders_v3') || '[]');
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
  const delivered = rows.filter(o => String(o.status||'').toLowerCase() === 'delivered').length;

  const stats = document.querySelectorAll('.stat-value');
  if (stats[0]) stats[0].textContent = `$${totalRevenue.toFixed(2).replace(/\.00$/, '')}`;
  if (stats[1]) stats[1].textContent = String(new Set(rows.map(o => o.customer).filter(Boolean)).size || 0);
  if (stats[2]) stats[2].textContent = String(totalOrders);
  if (stats[3]) stats[3].textContent = totalOrders ? `${Math.round((delivered / totalOrders) * 100)}%` : '0%';

  // Today stats
  const today = new Date(); today.setHours(0,0,0,0);
  const todayRows = rows.filter(o => {
    const d = new Date(String(o.date||'').slice(0,10));
    return !isNaN(d) && d >= today;
  });
  const todayRev = document.getElementById('todayRevenue');
  const todayOrd = document.getElementById('todayOrders');
  const todayCus = document.getElementById('todayCustomers');
  const delCount = document.getElementById('deliveredCount');
  const pendBadge = document.getElementById('pendingBadge');
  if (todayRev) todayRev.textContent = '$' + todayRows.reduce((s,o) => s + orderTotal(o), 0).toFixed(2).replace(/\.00$/, '');
  if (todayOrd) todayOrd.textContent = todayRows.length;
  if (todayCus) todayCus.textContent = new Set(todayRows.map(o => o.customer).filter(Boolean)).size;
  if (delCount)  delCount.textContent = delivered;
  if (pendBadge) pendBadge.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${pending} Pending`;
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
      const d = new Date(String(o.date||'').slice(0,10));
      if (isNaN(d)) return;
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
      const d = new Date(String(o.date||'').slice(0,10));
      if (isNaN(d)) return;
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
    const d = new Date(String(o.date||'').slice(0,10));
    if (isNaN(d) || d.getFullYear() !== yr) return;
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
}

window.addEventListener('cambo-orders-updated', refreshDashboard);
document.addEventListener('DOMContentLoaded', () => {
  bindChartButtons();
  refreshDashboard();
  setInterval(refreshDashboard, 30000);
});
