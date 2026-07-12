(function () {

  const COLORS = [
    '#06b6d4','#22d3ee','#38bdf8','#60a5fa','#818cf8',
    '#a78bfa','#c084fc','#e879f9','#f472b6','#fb7185',
    '#f87171','#fca5a5','#fdba74','#fcd34d','#a3e635',
    '#34d399','#2dd4bf','#38bdf8','#818cf8','#a78bfa',
    '#c084fc','#e879f9','#fb7185','#94a3b8','#64748b',
  ];

  let _allRows    = [];
  let _globalDate = '';
  let currentSort = 'desc';

  function filterByDate(rows, dateStr) {
    if (!dateStr) {
      /* No date → current month */
      const now        = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd   = new Date(now.getFullYear(), now.getMonth()+1, 0, 23, 59, 59, 999);
      return rows.filter(o => {
        const d = typeof parseOrderDate === 'function' ? parseOrderDate(o.date) : null;
        return d && d >= monthStart && d <= monthEnd;
      });
    }
    const [yr, mo, dy] = dateStr.split('-').map(Number);
    return rows.filter(o => {
      const d = typeof parseOrderDate === 'function' ? parseOrderDate(o.date) : null;
      return d && d.getFullYear()===yr && d.getMonth()===mo-1 && d.getDate()===dy;
    });
  }

  function groupByProvince(rows) {
    const map = new Map();
    rows.forEach(o => {
      const prov  = String(o.province || '').trim() || 'មិនបញ្ជាក់';
      const total = typeof orderTotal === 'function' ? orderTotal(o) : 0;
      if (!map.has(prov)) map.set(prov, { name: prov, orders: 0, amount: 0 });
      const entry = map.get(prov);
      entry.orders++;
      entry.amount += total;
    });
    return Array.from(map.values());
  }

  function render() {
    const el = document.getElementById('provList');
    if (!el) return;

    const filtered = filterByDate(_allRows, _globalDate);
    let list = groupByProvince(filtered);

    if (currentSort === 'asc')       list.sort((a,b) => a.amount - b.amount);
    else if (currentSort === 'name') list.sort((a,b) => a.name.localeCompare(b.name, 'km'));
    else                             list.sort((a,b) => b.amount - a.amount);

    if (!list.length) {
      el.innerHTML = '<div style="text-align:center;padding:24px;opacity:.45;font-size:13px">មិនមានទិន្នន័យ</div>';
      return;
    }

    const max = Math.max(...list.map(p => p.amount), 1);
    el.innerHTML = list.map((p, i) => {
      const pct       = Math.max(4, Math.round((p.amount / max) * 100));
      const color     = COLORS[i] || '#64748b';
      const rankClass = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : '';
      const rankLabel = i < 3 ? ['🥇','🥈','🥉'][i] : (i + 1);
      const amt       = p.amount.toFixed(2).replace(/\.00$/, '');
      return `<div class="prov-row">
        <span class="prov-rank ${rankClass}">${rankLabel}</span>
        <div class="prov-bar-wrap">
          <span class="prov-name">${p.name}</span>
          <div class="prov-bar-track">
            <div class="prov-bar-fill" style="width:${pct}%;background:${color}"></div>
          </div>
        </div>
        <div class="prov-right">
          <span class="prov-amount">$${amt}</span>
          <span class="prov-orders">${p.orders} orders</span>
        </div>
      </div>`;
    }).join('');
  }

  async function init() {
    if (typeof _dashRows !== 'undefined' && _dashRows.length) {
      _allRows = _dashRows;
      render();
      return;
    }
    if (typeof fetchDashboardOrders === 'function') {
      _allRows = await fetchDashboardOrders();
    }
    render();
  }

  document.addEventListener('DOMContentLoaded', () => {
    init();
    const sel = document.getElementById('provSortSel');
    if (sel) sel.addEventListener('change', () => { currentSort = sel.value; render(); });
  });

  window.addEventListener('cambo-global-date', e => {
    _globalDate = (e.detail && e.detail.date) || '';
    render();
  });

  window.addEventListener('cambo-dash-refreshed', e => {
    _allRows = Array.isArray(e.detail) ? e.detail : [];
    render();
  });

})();
