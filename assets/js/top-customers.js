/**
 * Top Customers Widget — CAMBO MINI Dashboard
 * Uses same data source as dashboard-live.js (Google Apps Script + localStorage fallback)
 */
(function(){
'use strict';

var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzW7fNFKrIoE2hB1afSuQfKGr4laKna4Ife0K82x_viFwM9uUBMsyfYjeNz0RpEG5F2xA/exec';
var LS_KEY     = 'cambo_search_edit_orders_v3';
var currentPeriod = 'monthly';
var _cachedOrders = null;

/* ── Fetch orders (same as dashboard-live.js) ── */
async function fetchOrders() {
  if (_cachedOrders) return _cachedOrders;
  try {
    const res  = await fetch(`${SCRIPT_URL}?action=list&limit=1000&_=${Date.now()}`);
    const data = await res.json();
    const rows = Array.isArray(data?.orders)      ? data.orders
               : Array.isArray(data?.data?.orders) ? data.data.orders
               : Array.isArray(data?.rows)         ? data.rows
               : Array.isArray(data?.data)         ? data.data
               : JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    _cachedOrders = rows;
    return rows;
  } catch {
    const rows = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    _cachedOrders = rows;
    return rows;
  }
}

/* ── Order total ── */
function orderTotal(o) {
  const items = (o.products||[]).reduce((s,p) =>
    s + (Number(p.qty||0) * Number(p.price||0) - Number(p.discount||0)), 0);
  return items + Number(o.deliveryFee||0);
}

/* ── Date range filter ── */
function getRange(period) {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'daily') return { start: today, end: today };
  if (period === 'weekly') {
    const s = new Date(today); s.setDate(today.getDate() - today.getDay());
    const e = new Date(s); e.setDate(s.getDate() + 6);
    return { start: s, end: e };
  }
  // monthly
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end:   new Date(now.getFullYear(), now.getMonth()+1, 0)
  };
}

function inRange(dateStr, range) {
  const raw = String(dateStr||'').slice(0,10);
  const d   = new Date(raw + 'T00:00:00');
  if (isNaN(d)) return true;
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return t >= range.start && t <= range.end;
}

/* ── Aggregate top customers ── */
function getTopCustomers(orders, period) {
  const range = getRange(period);
  const filtered = orders.filter(o => inRange(o.date, range));

  const map = {};
  filtered.forEach(o => {
    const name  = (o.customer || o.customerName || 'Unknown').trim();
    const total = orderTotal(o);
    if (!map[name]) map[name] = { name, total: 0, orders: 0 };
    map[name].total  += total;
    map[name].orders += 1;
  });

  return Object.values(map)
    .sort((a,b) => b.total - a.total)
    .slice(0, 10);
}

/* ── Colors & avatar ── */
const COLORS = [
  'linear-gradient(135deg,#8b5cf6,#06b6d4)',
  'linear-gradient(135deg,#10b981,#22d3ee)',
  'linear-gradient(135deg,#f59e0b,#fde68a)',
  'linear-gradient(135deg,#ef4444,#fca5a5)',
  'linear-gradient(135deg,#6366f1,#a78bfa)',
];

function initials(name) {
  const p = name.trim().split(/\s+/);
  return p.length >= 2 ? (p[0][0]+p[1][0]).toUpperCase() : name.slice(0,2).toUpperCase();
}

/* ── Render ── */
function render(orders, period) {
  const el = document.getElementById('tcList');
  if (!el) return;

  const customers = getTopCustomers(orders, period);

  if (!customers.length) {
    el.innerHTML = '<div class="tc-empty">🏆 មិនមានទិន្នន័យ<br><small>Save orders ពី Smart Orderer ជាមុន</small></div>';
    return;
  }

  const maxTotal = customers[0].total || 1;
  el.innerHTML = customers.map((c, i) => {
    const pct   = Math.round((c.total / maxTotal) * 100);
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i+1);
    const color = COLORS[i % COLORS.length];
    return `<div class="tc-item">
      <div class="tc-rank">${medal}</div>
      <div class="tc-avatar" style="background:${color}">${initials(c.name)}</div>
      <div class="tc-info">
        <span class="tc-name">${c.name}</span>
        <div class="tc-bar-wrap">
          <div class="tc-bar"><div class="tc-fill" style="width:${pct}%;background:${color}"></div></div>
          <span class="tc-orders">${c.orders} orders</span>
        </div>
      </div>
      <span class="tc-total">$${c.total.toFixed(2).replace(/\.00$/,'')}</span>
    </div>`;
  }).join('');
}

/* ── Init ── */
async function init() {
  const el = document.getElementById('tcList');
  if (el) el.innerHTML = '<div class="tc-loading">Loading...</div>';

  const orders = await fetchOrders();
  render(orders, currentPeriod);

  // Tab buttons
  document.querySelectorAll('.tc-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tc-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPeriod = btn.dataset.period;
      render(orders, currentPeriod);
    });
  });

  // Listen for new orders saved (same event as dashboard)
  window.addEventListener('cambo-orders-updated', async () => {
    _cachedOrders = null;
    const fresh = await fetchOrders();
    render(fresh, currentPeriod);
  });
}

document.addEventListener('DOMContentLoaded', init);

})();

