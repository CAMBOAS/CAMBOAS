(function () {

  // Base monthly data for all 25 provinces
  const BASE = [
    { name: 'ភ្នំពេញ',       orders: 312, amount: 8740 },
    { name: 'សៀមរាប',        orders: 198, amount: 5520 },
    { name: 'កណ្ដាល',         orders: 167, amount: 4680 },
    { name: 'កំពង់ចាម',       orders: 143, amount: 4010 },
    { name: 'តាកែវ',          orders: 128, amount: 3590 },
    { name: 'បាត់ដំបង',       orders: 119, amount: 3340 },
    { name: 'ព្រះសីហនុ',      orders: 108, amount: 3020 },
    { name: 'ព្រៃវែង',        orders:  96, amount: 2690 },
    { name: 'ស្វាយរៀង',       orders:  89, amount: 2490 },
    { name: 'កំពត',           orders:  84, amount: 2360 },
    { name: 'កំពង់ស្ពឺ',      orders:  78, amount: 2190 },
    { name: 'ក្រចេះ',         orders:  72, amount: 2020 },
    { name: 'ពោធិ៍សាត់',      orders:  67, amount: 1880 },
    { name: 'កំពង់ធំ',        orders:  63, amount: 1770 },
    { name: 'រតនគិរី',        orders:  58, amount: 1630 },
    { name: 'មណ្ឌលគីរី',      orders:  52, amount: 1460 },
    { name: 'ឧត្ដរមានជ័យ',    orders:  49, amount: 1380 },
    { name: 'ស្ទឹងត្រែង',     orders:  46, amount: 1300 },
    { name: 'ត្បូងឃ្មុំ',     orders:  44, amount: 1240 },
    { name: 'កែប',            orders:  38, amount: 1070 },
    { name: 'ប៉ៃលិន',         orders:  35, amount:  980 },
    { name: 'ព្រះវិហារ',      orders:  33, amount:  930 },
    { name: 'អន្លង់វែង',      orders:  28, amount:  790 },
    { name: 'កំពង់ឆ្នាំង',    orders:  24, amount:  680 },
    { name: 'ឱឡូវ',           orders:  18, amount:  510 },
  ];

  // Scale factors per period
  const SCALE = { monthly: 1, weekly: 0.26, daily: 0.038 };

  const COLORS = [
    '#06b6d4','#22d3ee','#38bdf8','#60a5fa','#818cf8',
    '#a78bfa','#c084fc','#e879f9','#f472b6','#fb7185',
    '#f87171','#fca5a5','#fdba74','#fcd34d','#a3e635',
    '#34d399','#2dd4bf','#38bdf8','#818cf8','#a78bfa',
    '#c084fc','#e879f9','#fb7185','#94a3b8','#64748b',
  ];

  let currentPeriod = 'monthly';
  let currentSort   = 'desc';

  function getDataForPeriod(period) {
    const scale = SCALE[period] || 1;
    return BASE.map(p => ({
      name:   p.name,
      orders: Math.round(p.orders * scale),
      amount: Math.round(p.amount * scale),
    }));
  }

  function render() {
    const el = document.getElementById('provList');
    if (!el) return;

    let list = getDataForPeriod(currentPeriod);
    if      (currentSort === 'asc')  list.sort((a, b) => a.amount - b.amount);
    else if (currentSort === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'km'));
    else                             list.sort((a, b) => b.amount - a.amount);

    const max = Math.max(...list.map(p => p.amount));

    el.innerHTML = list.map((p, i) => {
      const pct       = Math.max(4, Math.round((p.amount / max) * 100));
      const color     = COLORS[i] || '#64748b';
      const rankClass = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : '';
      const rankLabel = i < 3 ? ['🥇','🥈','🥉'][i] : (i + 1);

      return `<div class="prov-row">
        <span class="prov-rank ${rankClass}">${rankLabel}</span>
        <div class="prov-bar-wrap">
          <span class="prov-name">${p.name}</span>
          <div class="prov-bar-track">
            <div class="prov-bar-fill" style="width:${pct}%;background:${color}"></div>
          </div>
        </div>
        <div class="prov-right">
          <span class="prov-amount">$${p.amount.toLocaleString()}</span>
          <span class="prov-orders">${p.orders} orders</span>
        </div>
      </div>`;
    }).join('');
  }

  document.addEventListener('DOMContentLoaded', () => {
    render();

    // Sort select
    const sel = document.getElementById('provSortSel');
    if (sel) sel.addEventListener('change', () => { currentSort = sel.value; render(); });

    // Period tabs
    document.querySelectorAll('.prov-period-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.prov-period-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentPeriod = btn.getAttribute('data-period');
        render();
      });
    });
  });
})();
