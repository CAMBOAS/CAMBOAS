const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzd1g4M2oIFIl5MYkUnVd-WtxTzaEgXXepuIXYJ-KZboRNJGIOXfPOd8ANWX-dzay-ynQ/exec';

const DEMO_ORDERS = [
  {
    id: 'ORD-2026-005', 
    date: '2026-03-04', 
    customer: 'Helen', 
    phone: '015586878', 
    page: 'Brand1 CCR', 
    closeBy: 'Admin', 
    province: 'ភ្នំពេញ', 
    address: 'ភ្នំពេញ', 
    deliveryName: 'ABA', 
    payment: 'ABA', 
    status: 'Delivered', 
    note: '', 
    deliveryFee: 1.5, 
    showQrEnabled: true, 
    receiptNo: '',
    products: [
      { name: 'សាប៊ូកក់សក់ និងម៉ាសសក់ Premium CCR', qty: 2, price: 16, discount: 0 },
      { name: 'CC Serum JELY', qty: 1, price: 15, discount: 1 }
    ]
  }
];

let currentOrders = [];
let selectedOrderId = null;
let selectedIsNew = false;
let currentServerMode = 'latest';
let reloadTimer = null;
let showQrEnabled = true;

const qs = id => document.getElementById(id);
const fmtMoney = value => `$${Number(value || 0).toFixed(2)}`;

function showNotice(message, type = 'info') {
  const bar = qs('noticeBar');
  if (!bar) return;
  bar.textContent = message;
  bar.className = `notice-bar show ${type}`;
}

function clearNotice() {
  const bar = qs('noticeBar');
  if (!bar) return;
  bar.className = 'notice-bar';
  bar.textContent = '';
}

function escapeHtml(text) {
  return String(text ?? '').replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));
}

function normalizeDate(value) {
  if (!value) return '';
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const dt = new Date(text);
  if (!Number.isNaN(dt.getTime())) {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return '';
}

function calcSubtotal(line) {
  return (Number(line.qty || 0) * Number(line.price || 0)) - Number(line.discount || 0);
}

function calcOrderTotal(order) {
  const products = Array.isArray(order.products) ? order.products : [];
  return products.reduce((sum, line) => sum + calcSubtotal(line), 0) + Number(order.deliveryFee || 0);
}

function getDateRangeFilters() {
  return {
    startDate: qs('startDateFilter')?.value || '',
    endDate: qs('endDateFilter')?.value || ''
  };
}

function getFilters() {
  const { startDate, endDate } = getDateRangeFilters();
  return {
    text: qs('searchInput')?.value.trim().toLowerCase() || '',
    status: qs('statusFilter')?.value || '',
    page: qs('pageFilter')?.value || '',
    closeBy: qs('closeByFilter')?.value || '',
    startDate,
    endDate
  };
}

function orderInDateRange(order, startDate, endDate) {
  const orderDate = normalizeDate(order.date || order.dateTime);
  if (startDate && orderDate < startDate) return false;
  if (endDate && orderDate > endDate) return false;
  return true;
}

function normalizeOrder(order) {
  return {
    id: order.id || order.orderId || '',
    date: normalizeDate(order.date || order.dateTime),
    customer: order.customer || '',
    phone: order.phone || '',
    page: order.page || '',
    closeBy: order.closeBy || '',
    province: order.province || '',
    address: order.address || order.detailAddress || '',
    deliveryName: order.deliveryName || '',
    payment: order.payment || '',
    status: order.status || 'Pending',
    note: order.note || '',
    deliveryFee: Number(order.deliveryFee || 0),
    receiptNo: order.receiptNo || '',
    showQrEnabled: order.showQrEnabled !== false,
    products: Array.isArray(order.products) ? order.products.map((p, index) => ({
      name: p.name || p.product || '',
      qty: Number(p.qty || 1),
      price: Number(p.price || 0),
      discount: Number(p.discount || 0),
      subtotal: Number(p.subtotal || 0),
      number: Number(p.number || index + 1)
    })) : []
  };
}

function filterOrders() {
  const filters = getFilters();
  return currentOrders.filter(order => {
    const productNames = (order.products || []).map(p => p.name).join(' ');
    const hay = [order.id, order.customer, order.phone, order.page, order.closeBy, order.province, order.payment, productNames].join(' ').toLowerCase();
    if (filters.text && !hay.includes(filters.text)) return false;
    if (filters.status && order.status !== filters.status) return false;
    if (filters.page && order.page !== filters.page) return false;
    if (filters.closeBy && order.closeBy !== filters.closeBy) return false;
    if (!orderInDateRange(order, filters.startDate, filters.endDate)) return false;
    return true;
  });
}

function renderFilterOptions() {
  const pageValues = [...new Set(currentOrders.map(o => o.page).filter(Boolean))].sort();
  const closeByValues = [...new Set(currentOrders.map(o => o.closeBy).filter(Boolean))].sort();
  const pageFilter = qs('pageFilter');
  const closeByFilter = qs('closeByFilter');
  const currentPage = pageFilter?.value || '';
  const currentCloseBy = closeByFilter?.value || '';

  if (pageFilter) {
    pageFilter.innerHTML = '<option value="">All Pages</option>' + pageValues.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
    pageFilter.value = currentPage;
  }
  if (closeByFilter) {
    closeByFilter.innerHTML = '<option value="">All CloseBy</option>' + closeByValues.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
    closeByFilter.value = currentCloseBy;
  }
}

function statusClass(status) {
  return String(status || '').toLowerCase();
}

function buildResultText(count) {
  const range = getDateRangeFilters();
  if (range.startDate || range.endDate) return `Showing ${count} record${count === 1 ? '' : 's'} in selected date range`;
  if (currentServerMode === 'latest') return `Showing latest ${count} record${count === 1 ? '' : 's'}`;
  return `Showing ${count} record${count === 1 ? '' : 's'}`;
}

function buildFilterText() {
  const filters = getFilters();
  const tags = [];
  if (filters.startDate || filters.endDate) {
    tags.push(`${filters.startDate || '...'} → ${filters.endDate || filters.startDate || '...'}`);
  } else if (currentServerMode === 'latest') {
    tags.push('Latest 20 records');
  }
  if (filters.status) tags.push(filters.status);
  if (filters.page) tags.push(filters.page);
  if (filters.closeBy) tags.push(filters.closeBy);
  if (filters.text) tags.push('Search active');
  return tags.length ? tags.join(' • ') : 'No filters';
}

function renderStats(rows) {
  const revenue = rows.reduce((sum, order) => sum + calcOrderTotal(order), 0);
  qs('totalRecords').textContent = rows.length;
  qs('pendingCount').textContent = rows.filter(o => o.status === 'Pending').length;
  qs('deliveredCount').textContent = rows.filter(o => o.status === 'Delivered').length;
  qs('revenueCount').textContent = fmtMoney(revenue);
}

function renderTable() {
  const rows = filterOrders();
  const body = qs('resultsBody');
  if (!body) return;

  if (!rows.length) {
    body.innerHTML = '<tr><td colspan="11" class="muted">No orders found.</td></tr>';
  } else {
    body.innerHTML = rows.map(order => {
      const firstProduct = order.products?.[0]?.name || '-';
      const moreCount = Math.max((order.products?.length || 0) - 1, 0);
      return `
        <tr>
          <td>${escapeHtml(order.date)}</td>
          <td><button class="customer-link" data-edit="${escapeHtml(order.id)}">${escapeHtml(order.customer || '-')}</button></td>
          <td>${escapeHtml(order.phone || '-')}</td>
          <td>${escapeHtml(order.page || '-')}</td>
          <td>${escapeHtml(order.closeBy || '-')}</td>
          <td>${escapeHtml(order.province || '-')}</td>
          <td><div>${escapeHtml(firstProduct)}</div>${moreCount ? `<div class="muted">+ ${moreCount} more</div>` : ''}</td>
          <td class="money">${fmtMoney(calcOrderTotal(order))}</td>
          <td>${escapeHtml(order.payment || '-')}</td>
          <td><span class="badge ${statusClass(order.status)}">${escapeHtml(order.status || '-')}</span></td>
          <td><div class="action-stack"><button class="icon-action" data-edit="${escapeHtml(order.id)}" title="Edit">✏️</button></div></td>
        </tr>`;
    }).join('');
  }

  qs('resultText').textContent = buildResultText(rows.length);
  qs('activeFiltersText').textContent = buildFilterText();
  renderStats(rows);
}

function makeBlankOrder() {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: 'AUTO',
    date: today,
    customer: '',
    phone: '',
    page: '',
    closeBy: '',
    province: '',
    address: '',
    deliveryName: '',
    payment: '',
    status: 'Pending',
    note: '',
    deliveryFee: 0,
    receiptNo: '',
    showQrEnabled: true,
    products: [{ name: '', qty: 1, price: 0, discount: 0 }]
  };
}

function setQrButtonState(enabled) {
  showQrEnabled = !!enabled;
  const btn = qs('qrToggleBtn');
  if (!btn) return;
  btn.textContent = showQrEnabled ? 'QR Code ON' : 'QR Code OFF';
  btn.classList.toggle('off', !showQrEnabled);
  btn.setAttribute('aria-pressed', String(showQrEnabled));
}

function fillOrderForm(order) {
  qs('detailOrderIdText').textContent = order.id || 'AUTO';
  qs('detailStatusText').textContent = order.status || 'Pending';
  qs('detailGrandTotalText').textContent = fmtMoney(calcOrderTotal(order));
  qs('editOrderId').value = order.id || 'AUTO';
  qs('editDate').value = normalizeDate(order.date);
  qs('editCustomer').value = order.customer || '';
  qs('editPhone').value = order.phone || '';
  qs('editPage').value = order.page || '';
  qs('editCloseBy').value = order.closeBy || '';
  qs('editProvince').value = order.province || '';
  qs('editDeliveryName').value = order.deliveryName || '';
  qs('editAddress').value = order.address || '';
  qs('editPayment').value = order.payment || '';
  qs('editStatus').value = order.status || 'Pending';
  qs('editDeliveryFee').value = Number(order.deliveryFee || 0);
  qs('editGrandTotal').value = fmtMoney(calcOrderTotal(order));
  qs('editNote').value = order.note || '';
  qs('receiptNoInput').value = order.receiptNo || '';
  setQrButtonState(order.showQrEnabled !== false);
  renderProductLines(order);
}

function openDrawer(orderId, isNew = false) {
  const order = isNew ? makeBlankOrder() : currentOrders.find(item => item.id === orderId);
  if (!order) return;
  selectedOrderId = isNew ? '__NEW__' : order.id;
  selectedIsNew = isNew;
  qs('detailDrawer').classList.add('open');
  document.body.style.overflow = 'hidden';
  fillOrderForm(order);
}

function closeDrawer() {
  qs('detailDrawer').classList.remove('open');
  document.body.style.overflow = '';
}

function renderProductLines(order) {
  const body = qs('productLines');
  if (!body) return;
  const products = Array.isArray(order.products) && order.products.length ? order.products : [{ name: '', qty: 1, price: 0, discount: 0 }];
  body.innerHTML = products.map((line, index) => `
    <tr>
      <td><input class="line-input" data-line="${index}" data-key="name" value="${escapeHtml(line.name || '')}"></td>
      <td><input class="line-input" data-line="${index}" data-key="qty" type="number" min="1" step="1" value="${Number(line.qty || 1)}"></td>
      <td><input class="line-input" data-line="${index}" data-key="price" type="number" min="0" step="0.01" value="${Number(line.price || 0)}"></td>
      <td><input class="line-input" data-line="${index}" data-key="discount" type="number" min="0" step="0.01" value="${Number(line.discount || 0)}"></td>
      <td class="money">${fmtMoney(calcSubtotal(line))}</td>
      <td><button class="line-remove" data-remove-line="${index}" type="button">Remove</button></td>
    </tr>`).join('');
}

function readOrderFromForm() {
  const lineRows = [...qs('productLines').querySelectorAll('tr')];
  const products = lineRows.map(tr => ({
    name: tr.querySelector('[data-key="name"]')?.value?.trim() || '',
    qty: Number(tr.querySelector('[data-key="qty"]')?.value || 1),
    price: Number(tr.querySelector('[data-key="price"]')?.value || 0),
    discount: Number(tr.querySelector('[data-key="discount"]')?.value || 0)
  })).filter(line => line.name || line.qty || line.price || line.discount);

  const order = {
    id: qs('editOrderId').value || 'AUTO',
    date: qs('editDate').value,
    customer: qs('editCustomer').value.trim(),
    phone: qs('editPhone').value.trim(),
    page: qs('editPage').value.trim(),
    closeBy: qs('editCloseBy').value.trim(),
    province: qs('editProvince').value.trim(),
    address: qs('editAddress').value.trim(),
    deliveryName: qs('editDeliveryName').value.trim(),
    payment: qs('editPayment').value.trim(),
    status: qs('editStatus').value,
    note: qs('editNote').value.trim(),
    deliveryFee: Number(qs('editDeliveryFee').value || 0),
    receiptNo: qs('receiptNoInput').value.trim(),
    showQrEnabled,
    products: products.length ? products : [{ name: '', qty: 1, price: 0, discount: 0 }]
  };
  order.grandTotal = calcOrderTotal(order);
  return order;
}

function refreshDrawerTotals() {
  const order = readOrderFromForm();
  qs('detailStatusText').textContent = order.status || 'Pending';
  qs('detailGrandTotalText').textContent = fmtMoney(calcOrderTotal(order));
  qs('editGrandTotal').value = fmtMoney(calcOrderTotal(order));
}

function buildShareText(order) {
  const lines = [];
  lines.push(`Order: ${order.id || 'AUTO'}`);
  lines.push(`Date: ${order.date || '-'}`);
  lines.push(`Customer: ${order.customer || '-'}`);
  lines.push(`Phone: ${order.phone || '-'}`);
  lines.push(`Page: ${order.page || '-'}`);
  lines.push(`Payment: ${order.payment || '-'}`);
  lines.push(`QR Code: ${order.showQrEnabled ? 'ON' : 'OFF'}`);
  if (order.receiptNo) lines.push(`Receipt No: ${order.receiptNo}`);
  lines.push(`Total: ${fmtMoney(calcOrderTotal(order))}`);
  lines.push('Products:');
  (order.products || []).forEach((line, index) => {
    lines.push(`${index + 1}. ${line.name || '-'} | ${Number(line.qty || 0)} x ${fmtMoney(line.price || 0)} = ${fmtMoney(calcSubtotal(line))}`);
  });
  return lines.join('\n');
}


function formatDisplayMoney(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return '$0';
  return `$${num % 1 === 0 ? num.toFixed(0) : num.toFixed(2).replace(/\.00$/, '')}`;
}

function formatDateForShare(value) {
  const date = normalizeDate(value);
  if (!date) return '-';
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y}`;
}

function getSelectedQrMeta(order) {
  if (!order.showQrEnabled) return null;
  const method = String(order.payment || '').trim().toUpperCase();
  const fileMap = {
    ABA: { src: '../images/qr/ABA.png', name: 'CHEA CHANROTHA' },
    AC: { src: '../images/qr/AC.png', name: 'CHEA CHANROTHA' }
  };
  if (!fileMap[method]) return null;
  return {
    label: method,
    src: fileMap[method].src,
    name: fileMap[method].name || ''
  };
}

function buildShareReceiptHTML(order) {
  const province = (order.province || '').trim();
  const detailAddress = (order.address || '').trim();
  const fullAddress = [detailAddress, province].filter(Boolean).join(' : ') || '-';
  const deliveryFee = Math.max(0, Number(order.deliveryFee || 0));
  const itemsTotal = (order.products || []).reduce((sum, item) => sum + calcSubtotal(item), 0);
  const grand = itemsTotal + deliveryFee;
  const grandRiel = Math.round(grand * 4100);
  const paymentText = (order.payment || '-').trim() || '-';
  const pageText = (order.page || '-').trim() || '-';
  const closeByText = (order.closeBy || '-').trim() || '-';
  const noteText = (order.note || '-').trim() || '-';
  const customerText = (order.customer || '-').trim() || '-';
  const phoneText = (order.phone || '-').trim() || '-';
  const deliveryNameText = (order.deliveryName || '-').trim() || '-';
  const dateText = formatDateForShare(order.date);
  const receiptNo = (order.receiptNo || '').trim();
  const qrMeta = getSelectedQrMeta(order);
  const hasBottomBlock = !!(qrMeta || receiptNo);

  const rows = (order.products || []).map((it, i) => `
    <div class="share-item-row">
      <div class="share-col-product">${i + 1}. ${escapeHtml(it.name || '-')}</div>
      <div class="share-col-qty">${escapeHtml(String(it.qty || 0))}​ ឈុត</div>
      <div class="share-col-price">${escapeHtml(formatDisplayMoney(it.price || 0))}</div>
      <div class="share-col-subtotal">${escapeHtml(formatDisplayMoney(calcSubtotal(it)))}</div>
    </div>
  `).join('');

  const bottomBlock = hasBottomBlock ? `
    <div class="share-dash share-bottom-separator"></div>
    <div class="share-bottom-grid ${!qrMeta ? 'no-qr' : ''} ${!receiptNo ? 'no-number' : ''}">
      ${qrMeta ? `
        <div class="share-qr-side">
          <div class="share-qr-box">
            <img class="share-qr-image" src="${escapeHtml(qrMeta.src)}" alt="${escapeHtml(qrMeta.label)} QR Code" />
          </div>
          <div class="share-qr-label">${escapeHtml(qrMeta.label)}</div>
          ${qrMeta.name ? `<div class="share-qr-name">${escapeHtml(qrMeta.name)}</div>` : ''}
        </div>
      ` : ''}
      ${receiptNo ? `
        <div class="share-receipt-side">
          <div class="share-receipt-number">${escapeHtml(receiptNo)}</div>
        </div>
      ` : ''}
    </div>
  ` : `<div class="share-tail-space"></div>`;

  return `
    <div class="share-poster ${hasBottomBlock ? 'has-bottom-block' : 'trim-bottom'}">
      <div class="share-content">
        <div class="share-head">
          <div class="share-title">វិក័យប័ត្រ</div>
          <div class="share-date">កាលបរិច្ឆេទ: ${escapeHtml(dateText)}</div>
        </div>

        <div class="share-dash"></div>

        <div class="share-info-grid">
          <div class="share-info-labels">
            <div>ឈ្មោះ:</div>
            <div>លេខទូរសព្ទ:</div>
            <div>ទីតាំង:</div>
            <div>អ្នកដឹកជញ្ជូន:</div>
            <div>Note:</div>
          </div>
            <div class="share-info-values">
            <div><h3>${escapeHtml(customerText)}</h3></div>
            <div><h3>${escapeHtml(phoneText)}</h3></div>
            <div>${escapeHtml(fullAddress)}</div>
            <div>${escapeHtml(deliveryNameText)}</div>
            <div>${escapeHtml(noteText)}</div>
        </div>

        </div>

        <div class="share-dash"></div>

        <div class="share-table-head">
          <div class="share-col-product">ផលិតផល</div>
          <div class="share-col-qty">ចំនួន</div>
          <div class="share-col-price">តម្លៃ</div>
          <div class="share-col-subtotal">សរុប</div>
        </div>
        <div class="share-table-line"></div>
        <div class="share-items-wrap">${rows}</div>

        <div class="share-dash"></div>

        <div class="share-total-row"><span>ការទូទាត់</span><span>${escapeHtml(formatDisplayMoney(itemsTotal))}</span></div>
        <div class="share-total-row"><span>សេវាដឹក</span><span>${deliveryFee === 0 ? 'ហ្វ្រីដឹក' : escapeHtml(formatDisplayMoney(deliveryFee))}</span></div>
        <div class="share-pay-row">
          <div class="share-pay-left">ការទូទាត់ <strong>${escapeHtml(paymentText)}</strong></div>
          <div class="share-grand-wrap">
            <div class="share-grand-total">${escapeHtml(formatDisplayMoney(grand))}</div>
          </div>
        </div>
        <div class="share-riel-row"><span>ប្រាក់រៀល</span><span>${escapeHtml(grandRiel.toLocaleString())}៛</span></div>

        <div class="share-dash"></div>

        <div class="share-mini-meta">Page: ${escapeHtml(pageText)} | CloseBy: ${escapeHtml(closeByText)}</div>
        <div class="share-service-row">
          <span>លេខបម្រើអតិថិជន:</span>
          <span>015 58 68 78 / 089 58 68 78</span>
        </div>

        ${bottomBlock}
      </div>
    </div>
  `;
}

function getShareReceiptStyles() {
  return `
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #ffffff; }
    body {
      font-family: "Kantumruy Pro", sans-serif;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
      color: #045f80;
    }
    .share-capture-stage {
      width: fit-content;
      margin: 0 auto;
      background: #ffffff;
    }
    .share-capture-shell,
    .share-poster {
      width: 1080px;
      background: #f3f7f9;
      position: relative;
      overflow: hidden;
    }
    .share-content {
      width: 1080px;
      position: relative;
      z-index: 2;
      padding: 54px 50px 50px;
      display: flex;
      flex-direction: column;
    }
    .trim-bottom .share-content { padding-bottom: 50px; }
    .share-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }
    .share-title { font-size: 100px; font-weight: 800; line-height: 0.88; color: #045f80; }
    .share-date { padding-top: 18px; font-size: 27px; font-weight: 500; color: #9ab6c4; white-space: nowrap; }
    .share-dash { margin: 26px 0 18px; border-top: 2px dashed #5f99ae; }
    .share-info-grid { display: grid; grid-template-columns: 245px minmax(0, 1fr); gap: 8px 36px; font-size: 34px; line-height: 1.26; color: #045f80; }
    .share-info-labels, .share-info-values { display: grid; gap: 5px; font-weight: 500; }
    .share-table-head, .share-item-row { display: grid; grid-template-columns: minmax(0, 1fr) 130px 130px 130px; column-gap: 16px; align-items: start; }
    .share-table-head { color: #045f80; font-size: 31px; font-weight: 800; padding: 0 0 6px; }
    .share-table-line { border-top: 4px solid #045f80; margin-bottom: 10px; }
    .share-item-row { padding: 8px 0; color: #045f80; font-size: 28px; line-height: 1.28; }
    .share-col-product { text-align: left; padding-right: 8px; word-break: break-word; }
    .share-col-qty, .share-col-price, .share-col-subtotal { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .share-total-row, .share-pay-row, .share-riel-row, .share-service-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; color: #045f80; font-size: 28px; line-height: 1.25; }
    .share-total-row { margin: 4px 0; }
    .share-pay-row { margin-top: 10px; }
    .share-pay-left { font-size: 28px; line-height: 1.2; }
    .share-pay-left strong { display: inline-block; margin-left: 16px; font-size: 50px; line-height: 0.95; font-weight: 800; }
    .share-grand-wrap { text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
    .share-grand-label { font-size: 28px; line-height: 1; }
    .share-grand-total { font-size: 45px; line-height: 0.95; font-weight: 800; }
    .share-riel-row { margin-top: 10px; font-size: 25px; color: #2c7f9c; }
    .share-mini-meta { color: #2c7f9c; font-size: 24px; line-height: 1.25; margin-bottom: 10px; }
    .share-service-row { font-size: 24px; color: #2c7f9c; align-items: center; }
    .share-bottom-separator { margin-top: 18px; margin-bottom: 20px; }
    .share-bottom-grid { display: grid; grid-template-columns: 430px minmax(0, 1fr); column-gap: 36px; align-items: end; min-height: 500px; }
    .share-bottom-grid.no-qr { grid-template-columns: minmax(0, 1fr); }
    .share-bottom-grid.no-number { grid-template-columns: 430px; justify-content: start; }
    .share-qr-side { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; }
    .share-qr-box { width: 470px; max-width: 100%; aspect-ratio: 1 / 1; display: flex; align-items: center; justify-content: center; overflow: hidden; background: transparent; }
    .share-qr-image { width: 100%; height: 100%; object-fit: contain; display: block; }
    .share-qr-label { margin-top: 16px; font-size: 76px; line-height: 0.96; font-weight: 800; color: #045f80; text-align: center; }
    .share-qr-name { margin-top: 6px; font-size: 44px; line-height: 1.08; font-weight: 800; color: #045f80; text-align: center; text-transform: uppercase; word-break: break-word; }
    .share-receipt-side { min-height: 470px; border-left: 2px dashed #5f99ae; display: flex; align-items: center; justify-content: center; padding-left: 26px; padding-bottom: 20px; }
    .share-bottom-grid.no-qr .share-receipt-side { border-left: none; padding-left: 0; justify-content: flex-start; }
    .share-receipt-number { font-size: 190px; line-height: 0.88; font-weight: 800; color: #045f80; font-variant-numeric: tabular-nums; }
    .share-tail-space { height: 50px; }
  `;
}

function waitForImages(scope) {
  const images = [...scope.querySelectorAll('img')];
  if (!images.length) return Promise.resolve();
  return Promise.all(images.map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise(resolve => {
      img.onload = resolve;
      img.onerror = resolve;
    });
  }));
}

function dataUrlToFile(dataUrl, filename) {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}

async function shareCurrentOrder() {
  const order = readOrderFromForm();
  if (!order.products.some(line => line.name)) {
    showNotice('សូមបញ្ចូលផលិតផលជាមុនសិន។', 'error');
    return;
  }
  if (typeof html2canvas !== 'function') {
    const text = buildShareText(order);
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
    showNotice('Share capture not ready. Summary copied instead.', 'error');
    return;
  }

  showNotice('Preparing share capture...', 'info');
  const stage = document.createElement('div');
  stage.className = 'share-capture-stage';
  stage.style.position = 'fixed';
  stage.style.left = '-99999px';
  stage.style.top = '0';
  stage.style.zIndex = '-1';
  stage.innerHTML = `<style>${getShareReceiptStyles()}</style><div class="share-capture-shell">${buildShareReceiptHTML(order)}</div>`;
  document.body.appendChild(stage);

  try {
    await waitForImages(stage);
    const canvas = await html2canvas(stage.querySelector('.share-capture-shell'), {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false
    });
    const dataUrl = canvas.toDataURL('image/png');
    const safeName = (order.customer || order.id || 'receipt').replace(/[^a-z0-9\-_]+/gi, '_');
    const filename = `receipt_${safeName}.png`;

    if (navigator.canShare && navigator.share) {
      const file = dataUrlToFile(dataUrl, filename);
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: order.customer ? `Receipt - ${order.customer}` : 'Receipt',
          files: [file]
        });
        showNotice('Share capture ready.', 'success');
        setTimeout(clearNotice, 1800);
        return;
      }
    }

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    showNotice('Receipt capture downloaded as PNG.', 'success');
    setTimeout(clearNotice, 2200);
  } finally {
    stage.remove();
  }
}



function buildPrintInvoiceHTML(order, index = 0, total = 1) {
  const province = (order.province || '').trim();
  const detailAddress = (order.address || '').trim();
  const fullAddress = [detailAddress, province].filter(Boolean).join(' : ') || '-';

  const deliveryFee = Math.max(0, Number(order.deliveryFee || 0));
  const itemsTotal = (order.products || []).reduce((sum, item) => sum + calcSubtotal(item), 0);
  const grand = itemsTotal + deliveryFee;
  const grandRiel = Math.round(grand * 4100);

  const paymentText = (order.payment || '-').trim() || '-';
  const pageText = (order.page || '-').trim() || '-';
  const closeByText = (order.closeBy || '-').trim() || '-';
  const noteText = (order.note || '-').trim() || '-';
  const customerText = (order.customer || '-').trim() || '-';
  const phoneText = (order.phone || '-').trim() || '-';
  const deliveryNameText = (order.deliveryName || '-').trim() || '-';
  const dateText = formatDateForShare(order.date);
  const receiptNo = (order.receiptNo || '').trim();
  const qrMeta = getSelectedQrMeta(order);

  const rows = (order.products || []).map((it, i) => `
    <div class="receipt-item-row">
      <div class="receipt-col-product">${i + 1}. ${escapeHtml(it.name || '-')}</div>
      <div class="receipt-col-qty">${escapeHtml(String(it.qty || 0))} ឈុត</div>
      <div class="receipt-col-price">${escapeHtml(formatDisplayMoney(it.price || 0))}</div>
      <div class="receipt-col-subtotal">${escapeHtml(formatDisplayMoney(calcSubtotal(it)))}</div>
    </div>
  `).join('');

  return `
    <section class="receipt-print ${index < total - 1 ? 'page-break' : ''}">
      <div class="receipt-head">
        <div class="receipt-title">វិក័យប័ត្រ</div>
        <div class="receipt-date">កាលបរិច្ឆេទ: ${escapeHtml(dateText)}</div>
      </div>

      <div class="receipt-dash"></div>

      <div class="receipt-info-grid">
        <div class="receipt-info-labels">
          <div>ឈ្មោះ:</div>
          <div>លេខទូរសព្ទ:</div>
          <div>ទីតាំង:</div>
          <div>អ្នកដឹកជញ្ជូន:</div>
          <div>Note:</div>
        </div>
        <div class="receipt-info-values">
          <div><strong>${escapeHtml(customerText)}</strong></div>
          <div><strong>${escapeHtml(phoneText)}</strong></div>
          <div>${escapeHtml(fullAddress)}</div>
          <div>${escapeHtml(deliveryNameText)}</div>
          <div>${escapeHtml(noteText)}</div>
        </div>
      </div>

      <div class="receipt-dash"></div>

      <div class="receipt-table-head">
        <div class="receipt-col-product">ផលិតផល</div>
        <div class="receipt-col-qty">ចំនួន</div>
        <div class="receipt-col-price">តម្លៃ</div>
        <div class="receipt-col-subtotal">សរុប</div>
      </div>
      <div class="receipt-table-line"></div>

      <div class="receipt-items-wrap">
        ${rows || `
          <div class="receipt-item-row">
            <div class="receipt-col-product">-</div>
            <div class="receipt-col-qty">0 ឈុត</div>
            <div class="receipt-col-price">$0</div>
            <div class="receipt-col-subtotal">$0</div>
          </div>
        `}
      </div>

      <div class="receipt-dash"></div>

      <div class="receipt-total-row">
        <span>តម្លៃទំនិញ</span>
        <span>${escapeHtml(formatDisplayMoney(itemsTotal))}</span>
      </div>

      <div class="receipt-total-row">
        <span>សេវាដឹក</span>
        <span>${deliveryFee === 0 ? 'ហ្វ្រីដឹក' : escapeHtml(formatDisplayMoney(deliveryFee))}</span>
      </div>

      <div class="receipt-pay-row">
        <div class="receipt-pay-left">ការទូទាត់: <strong>${escapeHtml(paymentText)}</strong></div>
        <div class="receipt-grand-total">${escapeHtml(formatDisplayMoney(grand))}</div>
      </div>

      <div class="receipt-riel-row">
        <span>ប្រាក់រៀល:</span>
        <span><strong>${escapeHtml(grandRiel.toLocaleString())}៛</strong></span>
      </div>

      <div class="receipt-dash"></div>

      <div class="receipt-meta">Page: <strong>${escapeHtml(pageText)}</strong> | CloseBy: <strong>${escapeHtml(closeByText)}</strong></div>
      <div class="receipt-service">លេខបម្រើអតិថិជន 015 58 68 78 / 089 58 68 78</div>

      ${(qrMeta || receiptNo) ? `
        <div class="receipt-dash"></div>
        <div class="receipt-bottom ${!qrMeta ? 'no-qr' : ''} ${!receiptNo ? 'no-number' : ''}">
          ${qrMeta ? `
            <div class="receipt-qr-side">
              <div class="receipt-qr-box">
                <img class="receipt-qr-image" src="${escapeHtml(qrMeta.src)}" alt="${escapeHtml(qrMeta.label)} QR Code" />
              </div>
              <div class="receipt-qr-label">${escapeHtml(qrMeta.label)}</div>
              ${qrMeta.name ? `<div class="receipt-qr-name">${escapeHtml(qrMeta.name)}</div>` : ''}
            </div>
          ` : ''}

          ${receiptNo ? `
            <div class="receipt-number-side">
              <div class="receipt-number">${escapeHtml(receiptNo)}</div>
            </div>
          ` : ''}
        </div>
      ` : ''}
    </section>
  `;
}

function getPrintDocumentStyles() {
  return `
    @page {
      size: 80mm auto;
      margin: 0;
    }

    * {
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
    }

    body {
      width: 80mm;
      font-family: "Kantumruy Pro", sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      color: #111827;
      font-size: 11px;
    }

    .print-root {
      width: 80mm;
      margin: 0 auto;
      padding: 0;
    }

    .receipt-print {
      width: 80mm;
      margin: 0 auto;
      padding: 4mm 3.2mm 4mm;
      background: #fff;
      page-break-inside: avoid;
    }

    .page-break {
      page-break-after: always;
    }

    .receipt-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
    }

    .receipt-title {
      font-size: 30px;
      font-weight: 800;
      line-height: 0.95;
      color: #000;
    }

    .receipt-date {
      font-size: 10.5px;
      line-height: 1.3;
      color: #6b7280;
      text-align: right;
      white-space: nowrap;
      padding-top: 1.2mm;
    }

    .receipt-dash {
      border-top: 1px dashed #6b7280;
      margin: 2.6mm 0;
    }

    .receipt-info-grid {
      display: grid;
      grid-template-columns: 24mm minmax(0, 1fr);
      gap: 1.2mm 2.2mm;
      font-size: 12px;
      line-height: 1.45;
    }

    .receipt-info-labels,
    .receipt-info-values {
      display: grid;
      gap: 1mm;
    }

    .receipt-info-labels {
      font-weight: 700;
      color: #111;
    }

    .receipt-info-values {
      color: #111;
      word-break: break-word;
    }

    .receipt-table-head,
    .receipt-item-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 13mm 13mm 13mm;
      column-gap: 1.6mm;
      align-items: start;
    }

    .receipt-table-head {
      font-size: 10.8px;
      font-weight: 800;
      color: #000;
    }

    .receipt-table-line {
      border-top: 1px solid #111;
      margin: 1.4mm 0 1.7mm;
    }

    .receipt-item-row {
      font-size: 10.8px;
      line-height: 1.45;
      padding: 1mm 0;
      color: #111;
    }

    .receipt-col-product {
      text-align: left;
      word-break: break-word;
      padding-right: 1mm;
    }

    .receipt-col-qty,
    .receipt-col-price,
    .receipt-col-subtotal {
      text-align: right;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }

    .receipt-total-row,
    .receipt-pay-row,
    .receipt-riel-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
      font-size: 11px;
      line-height: 1.5;
      color: #111;
      margin: 0.8mm 0;
    }

    .receipt-pay-row {
      align-items: flex-end;
      margin-top: 1.5mm;
    }

    .receipt-pay-left {
      font-size: 11px;
      line-height: 1.4;
    }

    .receipt-pay-left strong {
      font-size: 15px;
      font-weight: 800;
    }

    .receipt-grand-total {
      font-size: 18px;
      font-weight: 800;
      line-height: 1;
      white-space: nowrap;
    }

    .receipt-riel-row {
      color: #000000;
      font-size: 10.5px;
    }

    .receipt-meta {
      font-size: 10.8px;
      color: #111;
      line-height: 1.45;
      margin-bottom: 1.2mm;
      word-break: break-word;
    }

    .receipt-service {
      font-size: 10px;
      color: #6b7280;
      line-height: 1.45;
      word-break: break-word;
    }

    .receipt-bottom {
      display: grid;
      grid-template-columns: 1fr 20mm;
      gap: 2.2mm;
      align-items: stretch;
      margin-top: 1.5mm;
    }

    .receipt-bottom.no-number {
      grid-template-columns: 1fr;
    }

    .receipt-bottom.no-qr {
      grid-template-columns: 1fr;
    }

    .receipt-qr-side {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .receipt-qr-box {
      width: 100%;
      max-width: 35mm;
      aspect-ratio: 1 / 1;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .receipt-qr-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }

    .receipt-qr-label {
      margin-top: 1.2mm;
      font-size: 15px;
      font-weight: 800;
      line-height: 1;
      text-align: center;
      color: #000;
    }

    .receipt-qr-name {
      margin-top: 1mm;
      font-size: 11px;
      font-weight: 800;
      line-height: 1.2;
      text-align: center;
      color: #000;
      text-transform: uppercase;
      word-break: break-word;
    }

    .receipt-number-side {
      border-left: 1px solid #111;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 35mm;
      padding-left: 2.2mm;
    }

    .receipt-bottom.no-qr .receipt-number-side {
      border-left: none;
      padding-left: 0;
      min-height: auto;
      justify-content: flex-start;
    }

    .receipt-number {
      font-size: 42px;
      font-weight: 800;
      line-height: 0.95;
      color: #000;
      font-variant-numeric: tabular-nums;
      text-align: center;
    }

    img {
      image-rendering: crisp-edges;
    }
  `;
}


function openPrintWindow(title, contentHtml) {
  const printWindow = window.open('', '_blank', 'width=1100,height=900');
  if (!printWindow) {
    showNotice('Browser blocked the print window. Please allow popups and try again.', 'error');
    return;
  }
  printWindow.document.open();
  printWindow.document.write(`<!DOCTYPE html>
    <html lang="km">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(title)}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Kantumruy+Pro:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <style>${getPrintDocumentStyles()}</style>
      </head>
      <body>
        <div class="print-root">${contentHtml}</div>
        <script>
          window.addEventListener('load', function () {
            setTimeout(function () {
              window.focus();
              window.print();
            }, 250);
          });
        <\/script>
      </body>
    </html>`);
  printWindow.document.close();
}

function printOrdersCollection(orders, title = 'Print Orders') {
  if (!Array.isArray(orders) || !orders.length) {
    showNotice('មិនមានទិន្នន័យសម្រាប់ព្រីនទេ។', 'error');
    return;
  }
  const html = orders.map((order, index) => buildPrintInvoiceHTML(order, index, orders.length)).join('');
  openPrintWindow(title, html);
}

function printFilteredOrders() {
  const rows = filterOrders();
  if (!rows.length) {
    showNotice('មិនមានទិន្នន័យក្រោយ filter សម្រាប់ព្រីនទេ។', 'error');
    return;
  }
  printOrdersCollection(rows, `Print ${rows.length} Orders`);
}

function printCurrentOrderDetail() {
  const order = readOrderFromForm();
  if (!order.products.some(line => line.name)) {
    showNotice('សូមបញ្ចូលផលិតផលជាមុនសិន។', 'error');
    return;
  }
  printOrdersCollection([order], `Print ${order.customer || order.id || 'Order'}`);
}


async function apiGet(params) {
  if (!WEB_APP_URL || WEB_APP_URL.includes('PASTE_YOUR')) throw new Error('សូមដាក់ Web App URL ជាមុនសិន នៅក្នុង assets/js/search-edit.js');
  const url = new URL(WEB_APP_URL);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString(), { method: 'GET' });
  const data = await res.json();
  if (data.ok === false) throw new Error(data.message || 'Request failed');
  return data;
}

async function apiPost(payload) {
  if (!WEB_APP_URL || WEB_APP_URL.includes('PASTE_YOUR')) throw new Error('សូមដាក់ Web App URL ជាមុនសិន នៅក្នុង assets/js/search-edit.js');
  const res = await fetch(WEB_APP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (data.ok === false) throw new Error(data.message || 'Request failed');
  return data;
}

function extractOrders(payload) {
  if (Array.isArray(payload?.orders)) return payload.orders;
  if (Array.isArray(payload?.data?.orders)) return payload.data.orders;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function buildServerParams() {
  const { startDate, endDate } = getDateRangeFilters();
  if (startDate && !endDate) return { action: 'list', startDate, endDate: startDate };
  if (!startDate && endDate) return { action: 'list', startDate: endDate, endDate };
  if (startDate || endDate) return { action: 'list', startDate, endDate };
  return { action: 'list', limit: 20 };
}

async function loadOrders() {
  const params = buildServerParams();
  currentServerMode = params.limit ? 'latest' : 'range';
  showNotice(currentServerMode === 'latest' ? 'Loading latest orders...' : 'Loading selected date range...', 'info');
  const data = await apiGet(params);
  currentOrders = extractOrders(data).map(normalizeOrder);
  renderFilterOptions();
  renderTable();
  showNotice(`Loaded ${currentOrders.length} orders successfully.`, 'success');
  setTimeout(clearNotice, 1800);
}

async function saveCurrentOrder() {
  const order = readOrderFromForm();
  if (!order.customer) throw new Error('សូមបញ្ចូលឈ្មោះអតិថិជន');
  if (!order.phone) throw new Error('សូមបញ្ចូលលេខទូរសព្ទ');
  if (!order.products.some(p => p.name)) throw new Error('សូមបញ្ចូលផលិតផលយ៉ាងហោចណាស់ 1');

  showNotice('Saving order...', 'info');
  if (selectedIsNew) {
    await apiPost({ action: 'add', order });
  } else {
    await apiPost({ action: 'update', orderId: selectedOrderId, order });
  }
  await loadOrders();
  closeDrawer();
  showNotice('Saved successfully.', 'success');
  setTimeout(clearNotice, 2200);
}

function triggerServerReload() {
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => {
    loadOrders().catch(error => {
      console.error(error);
      showNotice(error.message || 'Cannot load Google Sheet data.', 'error');
    });
  }, 160);
}

function bindEvents() {
  ['searchInput','statusFilter','pageFilter','closeByFilter'].forEach(id => {
    qs(id)?.addEventListener('input', renderTable);
    qs(id)?.addEventListener('change', renderTable);
  });

  ['startDateFilter','endDateFilter'].forEach(id => {
    qs(id)?.addEventListener('change', triggerServerReload);
  });

  qs('clearFiltersBtn')?.addEventListener('click', () => {
    ['searchInput','statusFilter','pageFilter','closeByFilter','startDateFilter','endDateFilter','globalSearch'].forEach(id => {
      const el = qs(id);
      if (el) el.value = '';
    });
    renderTable();
    triggerServerReload();
  });

  qs('resultsBody')?.addEventListener('click', event => {
    const target = event.target.closest('[data-edit]');
    if (!target) return;
    openDrawer(target.dataset.edit, false);
  });

  qs('drawerBackdrop')?.addEventListener('click', closeDrawer);
  qs('closeDrawerBtn')?.addEventListener('click', closeDrawer);
  qs('cancelEditBtn')?.addEventListener('click', closeDrawer);

  ['editDate','editCustomer','editPhone','editPage','editCloseBy','editProvince','editDeliveryName','editAddress','editPayment','editStatus','editDeliveryFee','editNote','receiptNoInput']
    .forEach(id => qs(id)?.addEventListener('input', refreshDrawerTotals));

  qs('qrToggleBtn')?.addEventListener('click', () => {
    setQrButtonState(!showQrEnabled);
    refreshDrawerTotals();
  });

  qs('productLines')?.addEventListener('input', refreshDrawerTotals);
  qs('productLines')?.addEventListener('click', event => {
    const removeBtn = event.target.closest('[data-remove-line]');
    if (!removeBtn) return;
    removeBtn.closest('tr')?.remove();
    if (!qs('productLines').children.length) renderProductLines(makeBlankOrder());
    refreshDrawerTotals();
  });

  qs('addLineBtn')?.addEventListener('click', () => {
    const order = readOrderFromForm();
    order.products.push({ name: '', qty: 1, price: 0, discount: 0 });
    renderProductLines(order);
    refreshDrawerTotals();
  });

  qs('shareDetailBtn')?.addEventListener('click', async () => {
    try {
      await shareCurrentOrder();
    } catch (error) {
      if (error?.name !== 'AbortError') showNotice(error.message || 'Share failed.', 'error');
    }
  });

  qs('saveEditBtn')?.addEventListener('click', async () => {
    try {
      await saveCurrentOrder();
      alert('✅ Save Successed!');
    } catch (error) {
      showNotice(error.message || 'Save failed', 'error');
    }
  });

  qs('deleteOrderBtn')?.addEventListener('click', async () => {
    if (!selectedOrderId || selectedIsNew) {
      showNotice('Cannot delete a new record.', 'error');
      return;
    }

    const ok = window.confirm('តើអ្នកប្រាកដថាចង់ Delete Order នេះមែនទេ?');
    if (!ok) return;

    try {
      showNotice('Deleting order...', 'info');
      await apiPost({ action: 'delete', orderId: selectedOrderId });
      await loadOrders();
      closeDrawer();
      alert('✅ Delete Successed!');
      showNotice('Deleted successfully.', 'success');
      setTimeout(clearNotice, 2200);
    } catch (error) {
      showNotice(error.message || 'Delete failed', 'error');
    }
  });

  qs('newRecordBtn')?.addEventListener('click', () => openDrawer('', true));
  qs('printTableBtn')?.addEventListener('click', printFilteredOrders);
  qs('printDetailBtn')?.addEventListener('click', printCurrentOrderDetail);
}

async function bootSearchEditPage() {
  if (!qs('resultsBody')) return;
  bindEvents();
  try {
    await loadOrders();
  } catch (error) {
    console.error(error);
    currentOrders = DEMO_ORDERS.map(normalizeOrder);
    renderFilterOptions();
    renderTable();
    showNotice('Google Sheet data failed to load. UI is ready and showing demo data for preview.', 'error');
  }
}

document.addEventListener('DOMContentLoaded', bootSearchEditPage);
