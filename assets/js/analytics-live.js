
let analyticsChart;

function groupBy(arr, getKey){
  return arr.reduce((acc, item) => {
    const key = getKey(item);
    acc[key] = (acc[key] || []).concat(item);
    return acc;
  }, {});
}
function sum(list, fn){ return list.reduce((s, item) => s + fn(item), 0); }

/* ── Mini list (Products / Pages) with rank + bar ── */
function setMiniList(id, entries, formatter){
  const wrap = document.getElementById(id);
  if (!wrap) return;
  if (!entries.length){
    wrap.innerHTML = '<div style="text-align:center;padding:24px;color:var(--muted);font-size:13px">មិនមានទិន្នន័យ</div>';
    return;
  }
  wrap.innerHTML = entries.map(formatter).join('');
}

/* ── Status / Priority progress bars ── */
function setProgressList(id, data, colorClasses){
  const wrap = document.getElementById(id);
  if (!wrap) return;
  const total = Object.values(data).reduce((s, v) => s + v, 0) || 1;
  wrap.innerHTML = Object.entries(data).map(([key, val], idx) => {
    const pct = Math.round((val / total) * 100);
    const cls = colorClasses[idx] || '';
    return `<div class="sb-row ${cls}">
      <div class="sb-head">
        <span class="sb-label">${key}</span>
        <span class="sb-count">${val.toLocaleString()} <span style="font-size:10px;opacity:.6">(${pct}%)</span></span>
      </div>
      <div class="sb-track"><div class="sb-fill" style="width:${pct}%"></div></div>
    </div>`;
  }).join('') || '<div style="color:var(--muted);font-size:12px;padding:8px 0">No data</div>';
}

function dateBounds(rows){
  const ds = rows.map(r => CamboOrdersData.toYMD(r.date)).filter(Boolean).sort();
  return { start: ds[0] || '', end: ds[ds.length - 1] || '' };
}

function filterRows(rows){
  const start = document.getElementById('analyticsStart')?.value || '';
  const end   = document.getElementById('analyticsEnd')?.value   || '';
  const page  = document.getElementById('analyticsPage')?.value  || '';
  return rows.filter(r => {
    const d = CamboOrdersData.toYMD(r.date);
    if (start && d && d < start) return false;
    if (end   && d && d > end)   return false;
    if (page  && r.page !== page) return false;
    return true;
  });
}

/* ── Rank badge class ── */
function rankCls(i){ return i === 0 ? 'r1' : i === 1 ? 'r2' : i === 2 ? 'r3' : ''; }

function renderAnalytics(rows){
  const filtered = filterRows(rows);
  const totalRevenue    = sum(filtered, CamboOrdersData.calcOrderTotal);
  const totalOrders     = filtered.length;
  const uniqueCustomers = new Set(filtered.map(r => r.customer).filter(Boolean)).size;

  document.getElementById('kpiRevenue').textContent   = CamboOrdersData.formatMoney(totalRevenue);
  document.getElementById('kpiOrders').textContent    = String(totalOrders);
  document.getElementById('kpiCustomers').textContent = String(uniqueCustomers);
  document.getElementById('kpiAverage').textContent   = CamboOrdersData.formatMoney(totalOrders ? totalRevenue / totalOrders : 0);
  document.getElementById('kpiRevenueNote').textContent = `${filtered.length} filtered orders`;
  document.getElementById('kpiOrdersNote').textContent  = filtered.length
    ? `${CamboOrdersData.formatDate(filtered[0].date)} → ${CamboOrdersData.formatDate(filtered[filtered.length - 1].date)}`
    : 'No orders in selected range';

  /* ── Chart ── */
  const daily  = groupBy(filtered, r => CamboOrdersData.toYMD(r.date));
  const labels = Object.keys(daily).sort();
  const totals = labels.map(day => sum(daily[day], CamboOrdersData.calcOrderTotal));
  const ctx = document.getElementById('revenueAnalyticsChart');
  if (ctx && window.Chart){
    if (analyticsChart) analyticsChart.destroy();
    analyticsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.map(l => CamboOrdersData.formatDate(l)),
        datasets: [{ label: 'Revenue', data: totals, borderWidth: 0, borderRadius: 8, backgroundColor: 'rgba(139,92,246,.72)' }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#94a3b8', maxRotation: 45 }, grid: { display: false } },
          y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,.08)' } }
        }
      }
    });
  }

  /* ── Top Products ── */
  const products = {};
  filtered.forEach(order => (order.products || []).forEach(p => {
    const key = p.name || 'Unknown';
    if (!products[key]) products[key] = { qty: 0, revenue: 0 };
    products[key].qty     += Number(p.qty || 0);
    products[key].revenue += (Number(p.qty || 0) * Number(p.price || 0)) - Number(p.discount || 0);
  }));
  const topProducts = Object.entries(products).sort((a, b) => b[1].qty - a[1].qty).slice(0, 7);
  const maxQty = topProducts[0]?.[1].qty || 1;
  setMiniList('topProductsList', topProducts, ([name, info], i) => {
    const pct = Math.round((info.qty / maxQty) * 100);
    return `<div class="ml-item">
      <div class="ml-rank ${rankCls(i)}">${i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}</div>
      <div class="ml-info">
        <div class="ml-name" title="${name}">${name}</div>
        <div class="ml-sub">${info.qty.toLocaleString()} qty</div>
        <div class="ml-bar-wrap"><div class="ml-bar" style="width:${pct}%"></div></div>
      </div>
      <div class="ml-amt">${CamboOrdersData.formatMoney(info.revenue)}</div>
    </div>`;
  });

  /* ── Top Pages ── */
  const pages = {};
  filtered.forEach(o => {
    const key = (o.page || '').trim() || '—';
    if (!pages[key]) pages[key] = { revenue: 0, orders: 0 };
    pages[key].revenue += CamboOrdersData.calcOrderTotal(o);
    pages[key].orders  += 1;
  });
  const topPages = Object.entries(pages).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 7);
  const maxRev = topPages[0]?.[1].revenue || 1;
  setMiniList('topPagesList', topPages, ([name, info], i) => {
    const pct    = Math.round((info.revenue / maxRev) * 100);
    const avg    = info.orders ? CamboOrdersData.formatMoney(info.revenue / info.orders) : '$0';
    return `<div class="ml-item">
      <div class="ml-rank ${rankCls(i)}">${i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}</div>
      <div class="ml-info">
        <div class="ml-name" title="${name}">${name}</div>
        <div class="ml-sub" style="display:flex;align-items:center;gap:8px">
          <span>📦 ${info.orders.toLocaleString()} orders</span>
          <span style="opacity:.55">·</span>
          <span style="color:#a78bfa">avg ${avg}</span>
        </div>
        <div class="ml-bar-wrap"><div class="ml-bar" style="width:${pct}%"></div></div>
      </div>
      <div class="ml-amt">${CamboOrdersData.formatMoney(info.revenue)}</div>
    </div>`;
  });

  /* ── Customer Health (RFM) — use full dataset for recency ── */
  const rfmPage = document.getElementById('analyticsPage')?.value || '';
  const rfmRows = rfmPage ? rows.filter(r => r.page === rfmPage) : rows;
  const custMap = {};
  rfmRows.forEach(o => {
    const name = (o.customer || '').trim() || '—';
    const d = o.date ? new Date(o.date) : null;
    if (!custMap[name]) custMap[name] = { lastDate: null, firstDate: null, orders: 0, revenue: 0 };
    custMap[name].orders++;
    custMap[name].revenue += CamboOrdersData.calcOrderTotal(o);
    if (d) {
      if (!custMap[name].lastDate  || d > custMap[name].lastDate)  custMap[name].lastDate  = d;
      if (!custMap[name].firstDate || d < custMap[name].firstDate) custMap[name].firstDate = d;
    }
  });
  /* dynamic thresholds based on actual data span */
  const allDates = Object.values(custMap).map(c => c.lastDate).filter(Boolean);
  const latestDate  = allDates.reduce((a, b) => a > b ? a : b, allDates[0] || new Date());
  const earliestDate = allDates.reduce((a, b) => a < b ? a : b, allDates[0] || new Date());
  const spanDays = Math.max(1, Math.floor((latestDate - earliestDate) / 86400000));
  const recentThreshold  = Math.max(3, Math.round(spanDays * 0.25));
  const atriskThreshold  = Math.max(6, Math.round(spanDays * 0.60));
  const rfm = { vip: 0, regular: 0, atrisk: 0, lost: 0 };
  Object.values(custMap).forEach(c => {
    const days = c.lastDate ? Math.floor((latestDate - c.lastDate) / 86400000) : 999;
    if (days <= recentThreshold && c.orders >= 2) rfm.vip++;
    else if (days <= recentThreshold)              rfm.regular++;
    else if (days <= atriskThreshold)              rfm.atrisk++;
    else                                           rfm.lost++;
  });
  const rfmTotal = rfm.vip + rfm.regular + rfm.atrisk + rfm.lost;
  const segs = [
    { key:'vip',     cls:'rfm-vip',     icon:'👑', label:'VIP',      count:rfm.vip,     desc:'ទិញញឹក · ទើបទិញ' },
    { key:'regular', cls:'rfm-regular', icon:'🟢', label:'Regular',  count:rfm.regular, desc:'active · ≤ 30 ថ្ងៃ' },
    { key:'atrisk',  cls:'rfm-atrisk',  icon:'⚠️', label:'At-Risk',  count:rfm.atrisk,  desc:`${recentThreshold+1}-${atriskThreshold} ថ្ងៃ · ត្រូវ call!` },
    { key:'lost',    cls:'rfm-lost',    icon:'💀', label:'Lost',     count:rfm.lost,    desc:`${atriskThreshold+1}+ ថ្ងៃ · win-back` },
  ];
  const segWrap = document.getElementById('rfmSegments');
  if (segWrap) segWrap.innerHTML = segs.map(s => `
    <div class="rfm-seg ${s.cls}">
      <div class="rfm-seg-top"><span class="rfm-icon">${s.icon}</span><span class="rfm-label">${s.label}</span></div>
      <div class="rfm-count">${s.count.toLocaleString()}</div>
      <div class="rfm-desc">${s.desc}</div>
    </div>`).join('');
  const barWrap = document.getElementById('rfmBar');
  if (barWrap && rfmTotal) {
    const colors = ['#f59e0b','#10b981','#f97316','#ef4444'];
    barWrap.innerHTML = segs.map((s, i) =>
      `<div class="rfm-bar-seg" style="width:${Math.round(s.count/rfmTotal*100)}%;background:${colors[i]}"></div>`
    ).join('');
  }
  const rfmTotalEl = document.getElementById('rfmTotal');
  if (rfmTotalEl) rfmTotalEl.textContent = rfmTotal.toLocaleString();
}

async function initAnalytics(){
  const [rows, saleInforRes] = await Promise.all([
    CamboOrdersData.fetchOrders(),
    window.CamboAPI ? window.CamboAPI.get({ action: 'saleinfor' }).catch(() => null) : Promise.resolve(null)
  ]);

  const pageSelect = document.getElementById('analyticsPage');
  if (pageSelect){
    const siPages = saleInforRes && saleInforRes.ok && saleInforRes.saleinfor && saleInforRes.saleinfor.pages;
    const pages = (siPages && siPages.length)
      ? siPages
      : [...new Set(rows.map(r => r.page).filter(Boolean))].sort();
    pages.forEach(page => {
      const op = document.createElement('option');
      op.value = page; op.textContent = page;
      pageSelect.appendChild(op);
    });
  }

  const bounds = dateBounds(rows);
  document.getElementById('analyticsStart').value = bounds.start;
  document.getElementById('analyticsEnd').value   = bounds.end;
  renderAnalytics(rows);

  ['analyticsStart', 'analyticsEnd', 'analyticsPage'].forEach(id =>
    document.getElementById(id)?.addEventListener('input', () => renderAnalytics(rows))
  );
  document.getElementById('analyticsRefresh')?.addEventListener('click', async () =>
    renderAnalytics(await CamboOrdersData.fetchOrders())
  );
}

document.addEventListener('DOMContentLoaded', initAnalytics);
