/**
 * Top Customers Widget — CAMBO MINI Dashboard
 * Controlled by global date filter (cambo-global-date event)
 */
(function(){
'use strict';

var _cachedOrders  = null;
var _globalDateFrom = '';
var _globalDateTo   = '';

function parseOrderDate(value) {
  if (!value) return null;
  const s = String(value).trim();
  const dm2 = s.match(/^(\d{2}),\s*(\d{2}),\s*(\d{4})/);
  if (dm2) return new Date(+dm2[3], +dm2[2]-1, +dm2[1]);
  const ddmm = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (ddmm) return new Date(+ddmm[3], +ddmm[2]-1, +ddmm[1]);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s.slice(0,10)+'T00:00:00');
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

async function fetchOrders() {
  if (_cachedOrders) return _cachedOrders;
  try {
    let data;
    if (window.CamboAPI) {
      data = await window.CamboAPI.get({action:'list', limit:'1000'});
    } else {
      const DIRECT = 'https://script.google.com/macros/s/AKfycbzefJjsVDLZ7YwtzHxIilWyQ8-j6-7sCieD8CmPqvlKVbazr6Jhi7Zj9sjG-MLaHMkQIA/exec';
      const res = await fetch(DIRECT + '?action=list&limit=1000&_=' + Date.now());
      data = await res.json();
    }
    const rows = Array.isArray(data?.orders)       ? data.orders
               : Array.isArray(data?.data?.orders) ? data.data.orders
               : Array.isArray(data?.rows)         ? data.rows
               : Array.isArray(data?.data)         ? data.data
               : [];
    _cachedOrders = rows;
    return rows;
  } catch {
    return [];
  }
}

function orderTotal(o) {
  const items = (o.products||[]).reduce((s,p) =>
    s + (Number(p.qty||0) * Number(p.price||0) - Number(p.discount||0)), 0);
  return items + Number(o.deliveryFee||0);
}

function filterByDate(orders, dateFrom, dateTo) {
  if (!dateFrom && !dateTo) return orders;
  const fromD = dateFrom ? new Date(dateFrom + 'T00:00:00') : null;
  const toD   = dateTo   ? new Date(dateTo   + 'T23:59:59') : null;
  return orders.filter(o => {
    const d = parseOrderDate(o.date);
    if (!d) return false;
    if (fromD && d < fromD) return false;
    if (toD   && d > toD)   return false;
    return true;
  });
}

function getTopCustomers(orders) {
  const filtered = filterByDate(orders, _globalDateFrom, _globalDateTo);
  const map = {};
  filtered.forEach(o => {
    const name  = (o.customer || o.customerName || 'Unknown').trim();
    const total = orderTotal(o);
    if (!map[name]) map[name] = { name, total: 0, orders: 0 };
    map[name].total  += total;
    map[name].orders += 1;
  });
  return Object.values(map).sort((a,b) => b.total - a.total).slice(0, 10);
}

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

function render(orders) {
  const el = document.getElementById('tcList');
  if (!el) return;

  const customers = getTopCustomers(orders);

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

async function init() {
  const el = document.getElementById('tcList');
  if (el) el.innerHTML = '<div class="tc-loading">Loading...</div>';
  const orders = await fetchOrders();
  render(orders);
}

window.addEventListener('cambo-global-date', e => {
  const d = (e && e.detail) || {};
  _globalDateFrom = d.dateFrom || '';
  _globalDateTo   = d.dateTo   || '';
  if (_cachedOrders) render(_cachedOrders);
});

window.addEventListener('cambo-orders-updated', async () => {
  _cachedOrders = null;
  const fresh = await fetchOrders();
  render(fresh);
});

document.addEventListener('DOMContentLoaded', init);

})();
