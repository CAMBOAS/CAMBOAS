const DASHBOARD_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzd1g4M2oIFIl5MYkUnVd-WtxTzaEgXXepuIXYJ-KZboRNJGIOXfPOd8ANWX-dzay-ynQ/exec';
let revenueChart;
async function fetchDashboardOrders() {
  try {
    const res = await fetch(`${DASHBOARD_WEB_APP_URL}?action=list&limit=200&_=${Date.now()}`);
    const data = await res.json();
    return Array.isArray(data?.orders) ? data.orders : Array.isArray(data?.data?.orders) ? data.data.orders : Array.isArray(data?.rows) ? data.rows : Array.isArray(data?.data) ? data.data : JSON.parse(localStorage.getItem('cambo_search_edit_orders_v3') || '[]');
  } catch {
    return JSON.parse(localStorage.getItem('cambo_search_edit_orders_v3') || '[]');
  }
}
function orderTotal(order) {
  const items=(order.products||[]).reduce((s,p)=>s+(Number(p.qty||0)*Number(p.price||0)-Number(p.discount||0)),0);
  return items+Number(order.deliveryFee||0);
}
function monthKey(dateText) { const d = new Date(String(dateText||'').slice(0,10)); if(Number.isNaN(d.getTime())) return ''; return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }
function updateStats(rows) {
  const totalRevenue = rows.reduce((s,o)=>s+orderTotal(o),0);
  const totalOrders = rows.length;
  const pending = rows.filter(o=>String(o.status||'').toLowerCase()==='pending').length;
  const delivered = rows.filter(o=>String(o.status||'').toLowerCase()==='delivered').length;
  const stats = document.querySelectorAll('.stat-value');
  if (stats[0]) stats[0].textContent = `$${totalRevenue.toFixed(2).replace(/\.00$/,'')}`;
  if (stats[1]) stats[1].textContent = String(new Set(rows.map(o=>o.customer).filter(Boolean)).size || 0);
  if (stats[2]) stats[2].textContent = String(totalOrders);
  if (stats[3]) stats[3].textContent = totalOrders ? `${Math.round((delivered/totalOrders)*100)}%` : '0%';
  const activity = document.querySelector('.activity-list');
  if (activity) activity.innerHTML = rows.slice(0,6).map(o=>`<div class="activity-item"><div class="activity-avatar" style="background: linear-gradient(135deg, var(--emerald-light), var(--emerald));">${(o.customer||'C').slice(0,2)}</div><div class="activity-content"><p class="activity-text"><strong>${o.customer||'Customer'}</strong> ordered ${o.products?.[0]?.name || 'product'}</p><span class="activity-time">${o.date || ''}</span></div><div class="activity-amount">$${orderTotal(o).toFixed(2).replace(/\.00$/,'')}</div></div>`).join('');
}
function updateChart(rows) {
  const wrap = document.querySelector('.chart-wrapper');
  if (!wrap || !window.Chart) return;
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const totals = Array(12).fill(0);
  rows.forEach(o=>{ const d = new Date(String(o.date||'').slice(0,10)); if(!Number.isNaN(d.getTime())) totals[d.getMonth()] += orderTotal(o); });
  if (!document.getElementById('revenueChartCanvas')) wrap.innerHTML = '<div class="chart-canvas-wrap"><canvas id="revenueChartCanvas"></canvas></div>';
  const ctx = document.getElementById('revenueChartCanvas');
  if (revenueChart) revenueChart.destroy();
  revenueChart = new Chart(ctx, { type:'line', data:{ labels:monthNames, datasets:[{ label:'Revenue', data:totals, borderColor:'#8b5cf6', backgroundColor:'rgba(139,92,246,.18)', fill:true, tension:.35, pointRadius:3, pointBackgroundColor:'#22d3ee' }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false }}, scales:{ x:{ ticks:{ color:'#cbd5e1' }, grid:{ color:'rgba(148,163,184,.08)' }}, y:{ ticks:{ color:'#94a3b8' }, grid:{ color:'rgba(148,163,184,.08)' }}} }});
}
async function refreshDashboard() { const rows = await fetchDashboardOrders(); updateStats(rows); updateChart(rows); }
window.addEventListener('cambo-orders-updated', refreshDashboard);
document.addEventListener('DOMContentLoaded', ()=>{ refreshDashboard(); setInterval(refreshDashboard, 30000); });