const ASSET_ROOT = '../assets';
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzd1g4M2oIFIl5MYkUnVd-WtxTzaEgXXepuIXYJ-KZboRNJGIOXfPOd8ANWX-dzay-ynQ/exec';
const STORAGE_KEY = 'cambo_search_edit_orders_v3';
const EXCHANGE_RATE = 4100;

const sampleOrders = [
  {
    id: 'A001',
    date: '2026-03-12',
    customer: 'Ny Soriya',
    phone: '17338533',
    page: 'ហេឡេន CCR',
    closeBy: 'John Wick',
    province: 'ខេត្តកំពង់ចាម',
    address: 'ភូមិថ្មី',
    payment: 'ABA',
    status: 'Pending',
    deliveryName: 'វិរៈ ប៊ុនថាំ',
    deliveryFee: 2,
    note: '',
    receiptNo: '',
    showQrEnabled: true,
    products: [
      { name: 'សាប៊ូកក់សក់ CCR', qty: 1, price: 18, discount: 0 },
      { name: 'ម៉ាសសក់ CCR', qty: 1, price: 18, discount: 0 }
    ]
  },
  {
    id: 'A002',
    date: '2026-03-12',
    customer: 'SouMey Love',
    phone: '16909933',
    page: 'ហេឡេន CCR',
    closeBy: 'John Wick',
    province: 'ខេត្តកណ្ដាល',
    address: 'តាខ្មៅ',
    payment: 'ABA',
    status: 'Pending',
    deliveryName: 'J&T',
    deliveryFee: 2,
    note: '',
    receiptNo: '',
    showQrEnabled: true,
    products: [
      { name: 'សាប៊ូកក់សក់ CCR', qty: 1, price: 18, discount: 0 },
      { name: 'ម៉ាសសក់ CCR', qty: 1, price: 18, discount: 0 }
    ]
  },
  {
    id: 'A003',
    date: '2026-03-12',
    customer: 'Ro Ya',
    phone: '86487221',
    page: 'ហេឡេន CCR',
    closeBy: 'John Wick',
    province: 'ខេត្តព្រះសីហនុ',
    address: 'ស្មាច់ដែក',
    payment: 'ABA',
    status: 'Pending',
    deliveryName: 'DRSB',
    deliveryFee: 2,
    note: '',
    receiptNo: '',
    showQrEnabled: true,
    products: [
      { name: 'សក់កក់ និង ម៉ាស CCR', qty: 1, price: 16, discount: 0 }
    ]
  },
  {
    id: 'A004',
    date: '2026-03-10',
    customer: 'ម៉េង លីម',
    phone: '71340764',
    page: 'ហេឡេន CCR',
    closeBy: 'John Wick',
    province: 'ខេត្តកំពត',
    address: 'កំពត',
    payment: 'ABA',
    status: 'Pending',
    deliveryName: 'ដឹកខ្លួនឯង',
    deliveryFee: 0,
    priority: 'Medium',
    note: '',
    receiptNo: '',
    showQrEnabled: true,
    products: [
      { name: 'កាហ្វេសម្រក CCR', qty: 1, price: 20, discount: 0 }
    ]
  }
];

let orders = [];
let editingOrderId = null;
let selectedIsNew = false;
let drawerQrEnabled = true;
let serverAvailable = false;
const selectedIds = new Set();
const dateFilterState = {
  start: '',
  end: '',
  preset: 'today',
  appliedLabel: 'Today'
};
const dateDraftState = {
  start: '',
  end: '',
  preset: 'today',
  label: 'Today'
};

const qs = (id) => document.getElementById(id);
const tbody = qs('ordersTbody');

const filterIds = ['globalSearch', 'tableSearch', 'deliveryFilter', 'provinceFilter', 'statusFilter', 'pageFilter', 'priorityFilter', 'closeByFilter'];
filterIds.forEach((id) => {
  const el = qs(id);
  if (!el) return;
  el.addEventListener('input', render);
  el.addEventListener('change', render);
});

qs('resetBtn')?.addEventListener('click', resetFilters);
qs('selectAll')?.addEventListener('change', handleSelectAll);
qs('qrToggle')?.addEventListener('click', toggleListQr);
qs('printTableBtn')?.addEventListener('click', printFilteredOrders);
qs('exportTablePdfBtn')?.addEventListener('click', exportFilteredOrdersPdf);
qs('printSelectedBtn')?.addEventListener('click', printSelectedOrders);
qs('shareImageBtn')?.addEventListener('click', shareFilteredOrdersAsImage);
qs('addRecordBtn')?.addEventListener('click', addRecord);
qs('drawerBackdrop')?.addEventListener('click', closeDrawer);
qs('closeDrawerBtn')?.addEventListener('click', closeDrawer);
qs('saveEditBtn')?.addEventListener('click', saveDrawerChanges);
qs('deleteOrderBtn')?.addEventListener('click', deleteCurrentOrder);
qs('addLineBtn')?.addEventListener('click', addProductLine);
qs('copyDetailBtn')?.addEventListener('click', copyCurrentOrderText);
qs('qrToggleBtn')?.addEventListener('click', toggleDrawerQr);
qs('shareDetailBtn')?.addEventListener('click', shareCurrentOrderAsImage);
qs('printDetailBtn')?.addEventListener('click', printCurrentOrderDetail);
qs('pdfDetailBtn')?.addEventListener('click', exportCurrentOrderPdf);
qs('dateRangeTrigger')?.addEventListener('click', toggleDatePopover);
qs('dateRangeCancel')?.addEventListener('click', closeDatePopover);
qs('dateRangeApply')?.addEventListener('click', applyDateRangeFromPopover);
qs('dateStartInput')?.addEventListener('input', handleCustomDateInput);
qs('dateEndInput')?.addEventListener('input', handleCustomDateInput);
document.querySelectorAll('[data-range]').forEach((btn) => btn.addEventListener('click', () => selectQuickRange(btn.dataset.range)));

[
  'editDate', 'editCustomer', 'editPhone', 'editPage', 'editCloseBy', 'editProvince', 'editDeliveryName',
  'editAddress', 'editPayment', 'editStatus', 'editDeliveryFee', 'editPriority', 'editNote', 'receiptNoInput'
].forEach((id) => qs(id)?.addEventListener('input', refreshDrawerTotals));

qs('listReceiptStart')?.addEventListener('input', render);
qs('listReceiptEnd')?.addEventListener('input', render);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && qs('detailDrawer')?.classList.contains('open')) closeDrawer();
  if (e.key === 'Escape' && qs('dateFilterWrap')?.classList.contains('open')) closeDatePopover();
});

document.addEventListener('click', (e) => {
  const wrap = qs('dateFilterWrap');
  if (!wrap || !wrap.classList.contains('open')) return;
  if (!wrap.contains(e.target)) closeDatePopover();
});


function toast(message, type = 'info') {
  const node = document.createElement('div');
  node.textContent = message;
  node.style.cssText = `position:fixed;top:18px;right:18px;z-index:9999;padding:12px 14px;border-radius:12px;font:600 13px Inter,sans-serif;box-shadow:0 10px 30px rgba(15,23,42,.16);color:#0f172a;background:${type === 'error' ? '#fee2e2' : type === 'success' ? '#dcfce7' : '#ffffff'};border:1px solid ${type === 'error' ? '#fecaca' : type === 'success' ? '#bbf7d0' : '#e2e8f0'};`;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 2200);
}

function escapeHtml(text) {
  return String(text ?? '').replace(/[&<>"']/g, (s) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));
}

function money(v) {
  const n = Number(v || 0);
  return `$${n.toFixed(2).replace(/\.00$/, '')}`;
}

function formatDate(value) {
  if (!value) return '-';
  const [y, m, d] = String(value).slice(0, 10).split('-');
  return y && m && d ? `${d}/${m}/${y}` : String(value);
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function toYMD(value) {
  if (!value) return '';
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return '';
  return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`;
}

function formatDateChip(value) {
  const ymd = toYMD(value);
  if (!ymd) return 'Select Date';
  const [y, m, d] = ymd.split('-');
  return `${d}/${m}/${y}`;
}

function todayYMD() {
  return toYMD(new Date());
}

function monthBounds(baseDate = new Date()) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return { start: toYMD(start), end: toYMD(end) };
}

function shiftDate(ymd, days) {
  const base = new Date(`${ymd}T00:00:00`);
  base.setDate(base.getDate() + days);
  return toYMD(base);
}

function getPresetRange(preset) {
  const today = todayYMD();
  const now = new Date(`${today}T00:00:00`);
  if (preset === 'today') return { start: today, end: today, label: 'Today' };
  if (preset === 'yesterday') {
    const day = shiftDate(today, -1);
    return { start: day, end: day, label: 'Yesterday' };
  }
  if (preset === 'last7') return { start: shiftDate(today, -6), end: today, label: 'Last 7 days' };
  if (preset === 'last30') return { start: shiftDate(today, -29), end: today, label: 'Last 30 days' };
  if (preset === 'lastMonth') {
    const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const bounds = monthBounds(previous);
    return { ...bounds, label: 'Last Month' };
  }
  if (preset === 'all') return { start: '', end: '', label: 'Select Date' };
  const bounds = monthBounds(now);
  return { ...bounds, label: 'This Month' };
}

function setAppliedDateRange(preset = 'today', start = '', end = '', label = '') {
  if (preset === 'custom') {
    dateFilterState.start = start || '';
    dateFilterState.end = end || '';
    dateFilterState.preset = 'custom';
    dateFilterState.appliedLabel = label || 'Custom';
    return;
  }
  const presetData = getPresetRange(preset);
  dateFilterState.start = start || presetData.start || '';
  dateFilterState.end = end || presetData.end || '';
  dateFilterState.preset = preset;
  dateFilterState.appliedLabel = label || presetData.label;
}

function syncDatePopoverUi() {
  const startInput = qs('dateStartInput');
  const endInput = qs('dateEndInput');
  if (startInput) startInput.value = dateDraftState.start || '';
  if (endInput) endInput.value = dateDraftState.end || '';
  document.querySelectorAll('[data-range]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.range === dateDraftState.preset);
  });
}

function updateDateTriggerText() {
  const trigger = qs('dateRangeTrigger');
  const chip = qs('rangeChip');
  if (trigger) trigger.textContent = dateFilterState.appliedLabel || 'Select Date';
  if (chip) {
    chip.textContent = dateFilterState.start && dateFilterState.end
      ? `${formatDateChip(dateFilterState.start)} → ${formatDateChip(dateFilterState.end)}`
      : 'All Dates';
  }
}

function positionDatePopover() {
  const wrap = qs('dateFilterWrap');
  const popover = qs('dateRangePopover');
  if (!wrap || !popover || popover.hidden) return;

  wrap.classList.remove('drop-up', 'align-left');

  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
  const wrapRect = wrap.getBoundingClientRect();

  if (wrapRect.right - 320 < 12) wrap.classList.add('align-left');
  if (viewportHeight - wrapRect.bottom < 320 && wrapRect.top > 340) wrap.classList.add('drop-up');
}

function openDatePopover() {
  const wrap = qs('dateFilterWrap');
  const popover = qs('dateRangePopover');
  const trigger = qs('dateRangeTrigger');
  if (!wrap || !popover) return;
  dateDraftState.start = dateFilterState.start || '';
  dateDraftState.end = dateFilterState.end || '';
  dateDraftState.preset = dateFilterState.preset || 'today';
  dateDraftState.label = dateFilterState.appliedLabel || 'Today';
  wrap.classList.add('open');
  popover.hidden = false;
  if (trigger) trigger.setAttribute('aria-expanded', 'true');
  syncDatePopoverUi();
  requestAnimationFrame(positionDatePopover);
}

function closeDatePopover() {
  const wrap = qs('dateFilterWrap');
  const popover = qs('dateRangePopover');
  const trigger = qs('dateRangeTrigger');
  if (!wrap || !popover) return;
  wrap.classList.remove('open', 'drop-up', 'align-left');
  popover.hidden = true;
  popover.style.width = '';
  popover.style.maxWidth = '';
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
}

function toggleDatePopover() {
  const wrap = qs('dateFilterWrap');
  if (!wrap) return;
  if (wrap.classList.contains('open')) closeDatePopover();
  else openDatePopover();
}

function selectQuickRange(rangeKey) {
  const picked = getPresetRange(rangeKey);
  dateDraftState.start = picked.start;
  dateDraftState.end = picked.end;
  dateDraftState.preset = rangeKey;
  dateDraftState.label = picked.label;
  syncDatePopoverUi();
}

function handleCustomDateInput() {
  const start = qs('dateStartInput')?.value || '';
  const end = qs('dateEndInput')?.value || '';
  dateDraftState.start = start;
  dateDraftState.end = end;
  dateDraftState.preset = 'custom';
  dateDraftState.label = 'Custom';
  syncDatePopoverUi();
}

function applyDateRangeFromPopover() {
  let start = qs('dateStartInput')?.value || dateDraftState.start || '';
  let end = qs('dateEndInput')?.value || dateDraftState.end || '';
  if (start && end && start > end) [start, end] = [end, start];
  if (!start && end) start = end;
  if (!end && start) end = start;

  if (dateDraftState.preset === 'custom') {
    setAppliedDateRange(start || end ? 'custom' : 'all', start, end, start || end ? 'Custom' : 'Select Date');
  } else {
    setAppliedDateRange(dateDraftState.preset || 'today', start, end, dateDraftState.label);
  }

  updateDateTriggerText();
  closeDatePopover();
  render();
}

function initDateFilter() {
  setAppliedDateRange('today');
  updateDateTriggerText();
  syncDatePopoverUi();
}

function provinceGroup(text) {
  const clean = String(text || '').replace(/\s+/g, '');
  return clean.includes('ភ្នំពេញ') ? 'ភ្នំពេញ' : 'ខេត្ត';
}

function normalizeLooseText(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[​-‍﻿]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function compactCompareText(value) {
  return normalizeLooseText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

function normalizeDeliveryName(value) {
  const clean = compactCompareText(value);
  if (!clean) return '';
  if (clean.includes('វិរៈប៊ុនថាំ') || clean.includes('វិរៈប៊ុនធាំ') || clean.includes('វិរៈប៊ុនថម') || clean.includes('virakbuntham') || clean.includes('vireakbuntham') || clean.includes('virak') || clean.includes('vireak')) return 'វិរៈ ប៊ុនថាំ';
  if (clean.includes('ភ្នំពេញតាធំ')) return 'ភ្នំពេញ តាធំ';
  if (clean.includes('ភ្នំពេញតាតូច')) return 'ភ្នំពេញ តាតូច';
  if (clean.includes('ដឹកខ្លួនឯង')) return 'ដឹកខ្លួនឯង';
  if (clean.includes('drsb')) return 'DRSB';
  if (clean.includes('jt')) return 'J&T';
  return normalizeLooseText(value);
}

function normalizePriority(value) {
  const text = String(value || '').trim().toLowerCase();
  if (text === 'high') return 'High';
  if (text === 'low') return 'Low';
  return 'Medium';
}

function sameLooseText(left, right) {
  return compactCompareText(left) === compactCompareText(right);
}

function pickFirst(obj, keys, fallback = '') {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
  }
  return fallback;
}

function toNumber(value, fallback = 0) {
  const n = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : fallback;
}

function aggregateServerOrders(rows) {
  if (!Array.isArray(rows) || !rows.length) return [];

  const hasNestedOrders = rows.some((row) => Array.isArray(row?.products));
  if (hasNestedOrders) return rows;

  const grouped = new Map();

  rows.forEach((raw, index) => {
    const orderId = normalizeLooseText(pickFirst(raw, ['id', 'orderId', 'OrderID', 'orderID'], `ROW-${index + 1}`));
    const productName = normalizeLooseText(pickFirst(raw, ['product', 'Product', 'productName', 'ProductName', 'name', 'Name'], ''));
    const qty = toNumber(pickFirst(raw, ['qty', 'QTY', 'quantity', 'Quantity'], 1), 1);
    const price = toNumber(pickFirst(raw, ['price', 'Price'], 0), 0);
    const discount = toNumber(pickFirst(raw, ['discount', 'Discount'], 0), 0);

    if (!grouped.has(orderId)) {
      grouped.set(orderId, {
        id: orderId,
        date: pickFirst(raw, ['date', 'dateTime', 'DateTime', 'datetime'], ''),
        customer: pickFirst(raw, ['customer', 'Customer'], ''),
        phone: pickFirst(raw, ['phone', 'Phone'], ''),
        page: pickFirst(raw, ['page', 'Page'], ''),
        closeBy: pickFirst(raw, ['closeBy', 'CloseBy'], ''),
        province: pickFirst(raw, ['province', 'Province'], ''),
        address: pickFirst(raw, ['address', 'detailAddress', 'Detail Address', 'detail_address'], ''),
        payment: pickFirst(raw, ['payment', 'Payment'], ''),
        status: pickFirst(raw, ['status', 'Status'], 'Pending'),
        priority: pickFirst(raw, ['priority', 'Priority'], 'Medium'),
        deliveryName: pickFirst(raw, ['deliveryName', 'delivery', 'DeliveryName', 'Delivery Name', 'delivery_name'], ''),
        deliveryFee: pickFirst(raw, ['deliveryFee', 'DeliveryFee'], 0),
        note: pickFirst(raw, ['note', 'Note'], ''),
        receiptNo: pickFirst(raw, ['receiptNo', 'ReceiptNo', 'receipt_no'], ''),
        products: []
      });
    }

    const target = grouped.get(orderId);
    if (!target.date) target.date = pickFirst(raw, ['date', 'dateTime', 'DateTime', 'datetime'], '');
    if (!target.customer) target.customer = pickFirst(raw, ['customer', 'Customer'], '');
    if (!target.phone) target.phone = pickFirst(raw, ['phone', 'Phone'], '');
    if (!target.page) target.page = pickFirst(raw, ['page', 'Page'], '');
    if (!target.closeBy) target.closeBy = pickFirst(raw, ['closeBy', 'CloseBy'], '');
    if (!target.province) target.province = pickFirst(raw, ['province', 'Province'], '');
    if (!target.address) target.address = pickFirst(raw, ['address', 'detailAddress', 'Detail Address', 'detail_address'], '');
    if (!target.payment) target.payment = pickFirst(raw, ['payment', 'Payment'], '');
    if (!target.status) target.status = pickFirst(raw, ['status', 'Status'], 'Pending');
    if (!target.deliveryName) target.deliveryName = pickFirst(raw, ['deliveryName', 'delivery', 'DeliveryName', 'Delivery Name', 'delivery_name'], '');
    if (!Number(target.deliveryFee)) target.deliveryFee = pickFirst(raw, ['deliveryFee', 'DeliveryFee'], 0);
    if (!target.note) target.note = pickFirst(raw, ['note', 'Note'], '');
    if (!target.receiptNo) target.receiptNo = pickFirst(raw, ['receiptNo', 'ReceiptNo', 'receipt_no'], '');

    if (productName) {
      const duplicate = target.products.some((item) =>
        sameLooseText(item.name, productName) && Number(item.qty || 0) === qty && Number(item.price || 0) === price && Number(item.discount || 0) === discount
      );
      if (!duplicate) target.products.push({ name: productName, qty, price, discount });
    }
  });

  return [...grouped.values()];
}

function statusClass(status) {
  const key = String(status || '').toLowerCase();
  if (key === 'delivered') return 'status-delivered';
  if (key === 'cancelled' || key === 'cancel') return 'status-cancelled';
  return 'status-pending';
}

function calcSubtotal(line) {
  return (Number(line.qty || 0) * Number(line.price || 0)) - Number(line.discount || 0);
}

function calcOrderTotal(order) {
  const itemsTotal = (order.products || []).reduce((sum, line) => sum + calcSubtotal(line), 0);
  return itemsTotal + Number(order.deliveryFee || 0);
}

function generateOrderId() {
  const max = orders.reduce((m, o) => {
    const n = Number(String(o.id || '').replace(/\D/g, ''));
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);
  return `A${String(max + 1).padStart(3, '0')}`;
}

function normalizeOrder(order, i = 0) {
  const dateValue = pickFirst(order, ['date', 'dateTime', 'DateTime', 'datetime'], new Date().toISOString().slice(0, 10));
  const normalizedProducts = (Array.isArray(order.products) ? order.products : []).map((p) => typeof p === 'string' ? { name: p, qty: 1, price: 0, discount: 0 } : {
    name: normalizeLooseText(p.name || p.product || p.Product || ''),
    qty: toNumber(p.qty ?? p.QTY ?? p.quantity, 1),
    price: toNumber(p.price ?? p.Price, 0),
    discount: toNumber(p.discount ?? p.Discount, 0)
  }).filter((line) => line.name || line.qty || line.price || line.discount);

  if (!normalizedProducts.length) {
    const singleName = normalizeLooseText(pickFirst(order, ['product', 'Product', 'productName', 'ProductName', 'name', 'Name'], ''));
    if (singleName) {
      normalizedProducts.push({
        name: singleName,
        qty: toNumber(pickFirst(order, ['qty', 'QTY', 'quantity', 'Quantity'], 1), 1),
        price: toNumber(pickFirst(order, ['price', 'Price'], 0), 0),
        discount: toNumber(pickFirst(order, ['discount', 'Discount'], 0), 0)
      });
    }
  }

  return {
    id: pickFirst(order, ['id', 'orderId', 'OrderID', 'orderID'], generateOrderId() || `A${String(i + 1).padStart(3, '0')}`),
    date: toYMD(dateValue) || String(dateValue).slice(0, 10),
    customer: normalizeLooseText(pickFirst(order, ['customer', 'Customer'], '')),
    phone: normalizeLooseText(pickFirst(order, ['phone', 'Phone'], '')),
    page: normalizeLooseText(pickFirst(order, ['page', 'Page'], '')),
    closeBy: normalizeLooseText(pickFirst(order, ['closeBy', 'CloseBy'], '')),
    province: normalizeLooseText(pickFirst(order, ['province', 'Province'], '')),
    address: normalizeLooseText(pickFirst(order, ['address', 'detailAddress', 'Detail Address', 'detail_address'], '')),
    payment: normalizeLooseText(pickFirst(order, ['payment', 'Payment'], '')),
    status: normalizeLooseText(pickFirst(order, ['status', 'Status'], 'Pending')) || 'Pending',
    priority: normalizePriority(pickFirst(order, ['priority', 'Priority'], 'Medium')),
    deliveryName: normalizeDeliveryName(pickFirst(order, ['deliveryName', 'delivery', 'DeliveryName', 'Delivery Name', 'delivery_name'], '')),
    deliveryFee: toNumber(pickFirst(order, ['deliveryFee', 'DeliveryFee'], 0), 0),
    note: normalizeLooseText(pickFirst(order, ['note', 'Note'], '')),
    receiptNo: normalizeLooseText(pickFirst(order, ['receiptNo', 'ReceiptNo', 'receipt_no'], '')),
    showQrEnabled: order.showQrEnabled !== false,
    products: normalizedProducts
  };
}

function saveLocalOrders() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

function loadLocalOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(sampleOrders).map(normalizeOrder);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return structuredClone(sampleOrders).map(normalizeOrder);
    return parsed.map(normalizeOrder);
  } catch {
    return structuredClone(sampleOrders).map(normalizeOrder);
  }
}

async function apiGet(params) {
  const url = new URL(WEB_APP_URL);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString(), { method: 'GET' });
  const data = await res.json();
  if (data.ok === false) throw new Error(data.message || 'Load failed');
  return data;
}

async function apiPost(payload) {
  const res = await fetch(WEB_APP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (data.ok === false) throw new Error(data.message || 'Save failed');
  return data;
}

function extractOrders(payload) {
  if (Array.isArray(payload?.orders)) return aggregateServerOrders(payload.orders);
  if (Array.isArray(payload?.data?.orders)) return aggregateServerOrders(payload.data.orders);
  if (Array.isArray(payload?.rows)) return aggregateServerOrders(payload.rows);
  if (Array.isArray(payload?.data)) return aggregateServerOrders(payload.data);
  return [];
}

async function loadOrders() {
  try {
    const data = await apiGet({ action: 'list', limit: 5000 });
    const fromServer = extractOrders(data);
    if (fromServer.length) {
      orders = fromServer.map(normalizeOrder);
      serverAvailable = true;
      saveLocalOrders();
      return;
    }
  } catch (error) {
    console.warn('Server load failed, fallback to local data.', error);
  }
  serverAvailable = false;
  orders = loadLocalOrders();
}

function getFilters() {
  const keyword = [qs('globalSearch')?.value.trim(), qs('tableSearch')?.value.trim()].filter(Boolean).join(' ').toLowerCase();
  return {
    keyword,
    delivery: qs('deliveryFilter')?.value || '',
    province: qs('provinceFilter')?.value || '',
    status: qs('statusFilter')?.value || '',
    page: qs('pageFilter')?.value || '',
    closeBy: qs('closeByFilter')?.value || '',
    priority: qs('priorityFilter')?.value || '',
    dateStart: dateFilterState.start || '',
    dateEnd: dateFilterState.end || ''
  };
}

function getFilteredOrders() {
  const f = getFilters();
  return orders.filter((order) => {
    const searchText = [order.id, order.date, order.customer, order.phone, order.page, order.closeBy, order.province, order.payment, order.status, order.deliveryName, order.address, order.note, ...(order.products || []).map((p) => p.name)].join(' ').toLowerCase();
    if (f.keyword && !searchText.includes(f.keyword)) return false;
    if (f.delivery && !sameLooseText(normalizeDeliveryName(order.deliveryName), normalizeDeliveryName(f.delivery))) return false;
    if (f.province && provinceGroup(order.province) !== f.province) return false;
    if (f.status && !sameLooseText(order.status, f.status)) return false;
    if (f.page && !sameLooseText(order.page, f.page)) return false;
    if (f.priority && !sameLooseText(order.priority || 'Medium', f.priority)) return false;
    if (f.closeBy && !sameLooseText(order.closeBy, f.closeBy)) return false;
    const orderDate = toYMD(order.date);
    if (f.dateStart && orderDate && orderDate < f.dateStart) return false;
    if (f.dateEnd && orderDate && orderDate > f.dateEnd) return false;
    return true;
  });
}

function getTopActionRows() {
  const filtered = getFilteredOrders();
  const start = Math.max(1, Number(qs('listReceiptStart')?.value || 1));
  const endValue = Number(qs('listReceiptEnd')?.value || filtered.length || 0);
  const end = endValue >= start ? endValue : start;
  return filtered.slice(start - 1, end);
}

function syncSelectedState(rows) {
  [...selectedIds].forEach((id) => { if (!orders.some((order) => order.id === id)) selectedIds.delete(id); });
  const selectAll = qs('selectAll');
  const selectedVisible = rows.filter((row) => selectedIds.has(row.id)).length;
  if (selectAll) {
    selectAll.checked = rows.length > 0 && selectedVisible === rows.length;
    selectAll.indeterminate = selectedVisible > 0 && selectedVisible < rows.length;
  }
  qs('selectedCount').textContent = String(selectedIds.size);
  qs('selectedCountTop').textContent = String(selectedIds.size);
}

function updateSummaryBars(rows) {
  const text = `Showing ${rows.length} records`;
  qs('showingText').textContent = text;
  qs('showingTextTop').textContent = text;
  const closer = qs('closeByFilter')?.value || 'All CloseBy';
  const dateText = dateFilterState.start && dateFilterState.end
    ? `${formatDateChip(dateFilterState.start)} → ${formatDateChip(dateFilterState.end)}`
    : 'All Dates';
  const chip = `${dateText} · ${closer}`;
  qs('footerRangeText').textContent = chip;
  qs('footerRangeTextTop').textContent = chip;
}

function render() {
  const rows = getFilteredOrders();
  qs('totalRecords').textContent = String(rows.length);
  qs('pendingCount').textContent = String(rows.filter((r) => r.status === 'Pending').length);
  qs('deliveredCount').textContent = String(rows.filter((r) => r.status === 'Delivered').length);
  qs('revenueCount').textContent = money(rows.reduce((sum, row) => sum + calcOrderTotal(row), 0));
  updateSummaryBars(rows);

  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;color:#7d8aa6;">No records found.</td></tr>';
  } else {
    tbody.innerHTML = rows.map((order) => {
      const productMain = order.products?.[0]?.name || '-';
      const productMore = (order.products?.length || 0) > 1 ? `+ ${order.products.length - 1} more` : '';
      return `
        <tr data-id="${escapeHtml(order.id)}">
          <td class="td-check"><input class="row-check" type="checkbox" data-id="${escapeHtml(order.id)}" ${selectedIds.has(order.id) ? 'checked' : ''}></td>
          <td class="td-date">${escapeHtml(formatDate(order.date))}</td>
          <td class="td-customer"><a href="#" class="customer-link">${escapeHtml(order.customer)}</a></td>
          <td class="td-phone"><a href="#" class="phone-link">${escapeHtml(order.phone)}</a></td>
          <td class="td-province">${escapeHtml(order.province)}</td>
          <td class="td-products"><span class="product-main">${escapeHtml(productMain)}</span>${productMore ? `<span class="product-sub">${escapeHtml(productMore)}</span>` : ''}</td>
          <td class="td-page">${escapeHtml(order.page)}</td>
          <td class="td-closeby">${escapeHtml(order.closeBy)}</td>
          <td class="td-priority"><span class="priority-pill priority-${String(order.priority || 'Medium').toLowerCase()}">${escapeHtml(order.priority || 'Medium')}</span></td>
          <td class="price-cell td-total">${money(calcOrderTotal(order))}</td>
          <td class="td-status"><span class="status-pill ${statusClass(order.status)}">${escapeHtml(order.status)}</span></td>
        </tr>`;
    }).join('');
  }
  bindRowChecks();
  bindEditableRows();
  syncSelectedState(rows);
}

function bindRowChecks() {
  document.querySelectorAll('.row-check').forEach((check) => {
    check.addEventListener('click', (e) => e.stopPropagation());
    check.addEventListener('change', (e) => {
      const id = e.target.dataset.id;
      if (e.target.checked) selectedIds.add(id); else selectedIds.delete(id);
      syncSelectedState(getFilteredOrders());
    });
  });
}

function handleSelectAll(e) {
  const checked = e.target.checked;
  getFilteredOrders().forEach((row) => checked ? selectedIds.add(row.id) : selectedIds.delete(row.id));
  render();
}

function toggleListQr() {
  const btn = qs('qrToggle');
  const on = btn.textContent.includes('ON');
  btn.textContent = on ? 'QR: OFF' : 'QR: ON';
  btn.classList.toggle('btn-green', !on);
}

function makeBlankOrder() {
  return {
    id: generateOrderId(),
    date: new Date().toISOString().slice(0, 10),
    customer: '',
    phone: '',
    page: 'Brand1 CCR',
    closeBy: 'Admin',
    province: 'ភ្នំពេញ',
    address: '',
    payment: 'ABA',
    status: 'Pending',
    deliveryName: 'J&T',
    deliveryFee: 0,
    priority: 'Medium',
    note: '',
    receiptNo: '',
    showQrEnabled: true,
    products: [{ name: '', qty: 1, price: 0, discount: 0 }]
  };
}

function addRecord() {
  selectedIsNew = true;
  editingOrderId = null;
  fillOrderForm(makeBlankOrder());
  qs('detailDrawer').classList.add('open');
  qs('detailDrawer').setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function resetFilters() {
  filterIds.forEach((id) => { const el = qs(id); if (el) el.value = ''; });
  qs('listReceiptStart').value = '';
  qs('listReceiptEnd').value = '';
  setAppliedDateRange('today');
  updateDateTriggerText();
  render();
}

function setDrawerQrButton(enabled) {
  drawerQrEnabled = !!enabled;
  const btn = qs('qrToggleBtn');
  if (!btn) return;
  btn.textContent = drawerQrEnabled ? 'QR Code ON' : 'QR Code OFF';
  btn.classList.toggle('off', !drawerQrEnabled);
  btn.setAttribute('aria-pressed', String(drawerQrEnabled));
}

function renderProductLines(products) {
  const body = qs('productLines');
  body.innerHTML = products.map((line, index) => `
    <tr>
      <td class="line-cell-product"><input class="line-input line-input-product" data-line="${index}" data-key="name" value="${escapeHtml(line.name || '')}"></td>
      <td class="line-cell-mini"><input class="line-input line-input-mini" data-line="${index}" data-key="qty" type="number" min="1" step="1" value="${Number(line.qty || 1)}"></td>
      <td class="line-cell-mini"><input class="line-input line-input-mini" data-line="${index}" data-key="price" type="number" min="0" step="0.01" value="${Number(line.price || 0)}"></td>
      <td class="line-cell-mini"><input class="line-input line-input-mini" data-line="${index}" data-key="discount" type="number" min="0" step="0.01" value="${Number(line.discount || 0)}"></td>
      <td class="price-cell line-subtotal-cell">${money(calcSubtotal(line))}</td>
      <td class="line-action-cell"><button class="line-remove" type="button" data-remove-line="${index}">Remove</button></td>
    </tr>
  `).join('');

  body.querySelectorAll('.line-input').forEach((input) => input.addEventListener('input', refreshDrawerTotals));
  body.querySelectorAll('[data-remove-line]').forEach((btn) => btn.addEventListener('click', () => removeProductLine(Number(btn.dataset.removeLine))));
}

function readOrderFromForm() {
  const lineRows = [...qs('productLines').querySelectorAll('tr')];
  const products = lineRows.map((tr) => ({
    name: tr.querySelector('[data-key="name"]')?.value?.trim() || '',
    qty: Number(tr.querySelector('[data-key="qty"]')?.value || 1),
    price: Number(tr.querySelector('[data-key="price"]')?.value || 0),
    discount: Number(tr.querySelector('[data-key="discount"]')?.value || 0)
  })).filter((line) => line.name || line.qty || line.price || line.discount);

  return {
    id: qs('editOrderId').value.trim() || generateOrderId(),
    date: qs('editDate').value,
    customer: qs('editCustomer').value.trim(),
    phone: qs('editPhone').value.trim(),
    page: qs('editPage').value.trim(),
    closeBy: qs('editCloseBy').value.trim(),
    province: qs('editProvince').value.trim(),
    address: qs('editAddress').value.trim(),
    payment: qs('editPayment').value.trim(),
    status: qs('editStatus').value,
    deliveryName: qs('editDeliveryName').value.trim(),
    deliveryFee: Number(qs('editDeliveryFee').value || 0),
    priority: qs('editPriority').value || 'Medium',
    note: qs('editNote').value.trim(),
    receiptNo: qs('receiptNoInput').value.trim(),
    showQrEnabled: drawerQrEnabled,
    products: products.length ? products : [{ name: '', qty: 1, price: 0, discount: 0 }]
  };
}

function refreshDrawerTotals() {
  const order = readOrderFromForm();
  qs('detailStatusText').textContent = order.status || 'Pending';
  const total = calcOrderTotal(order);
  qs('detailGrandTotalText').textContent = money(total);
  qs('detailPriorityText').textContent = order.priority || 'Medium';
  qs('editGrandTotal').value = money(total);
  const body = qs('productLines');
  [...body.querySelectorAll('tr')].forEach((tr) => {
    const name = tr.querySelector('[data-key="name"]')?.value || '';
    const qty = Number(tr.querySelector('[data-key="qty"]')?.value || 1);
    const price = Number(tr.querySelector('[data-key="price"]')?.value || 0);
    const discount = Number(tr.querySelector('[data-key="discount"]')?.value || 0);
    const subtotalCell = tr.querySelector('.price-cell');
    if (subtotalCell) subtotalCell.textContent = money(calcSubtotal({ name, qty, price, discount }));
  });
}

function fillOrderForm(order) {
  qs('detailOrderIdText').textContent = order.id || 'AUTO';
  qs('detailStatusText').textContent = order.status || 'Pending';
  qs('detailGrandTotalText').textContent = money(calcOrderTotal(order));
  qs('editOrderId').value = order.id || '';
  qs('editDate').value = order.date || '';
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
  qs('editPriority').value = order.priority || 'Medium';
  qs('detailPriorityText').textContent = order.priority || 'Medium';
  qs('editGrandTotal').value = money(calcOrderTotal(order));
  qs('editNote').value = order.note || '';
  qs('receiptNoInput').value = order.receiptNo || '';
  setDrawerQrButton(order.showQrEnabled !== false);
  renderProductLines(order.products || []);
}

function openDrawer(orderId) {
  const order = orders.find((item) => item.id === orderId);
  if (!order) return;
  editingOrderId = orderId;
  selectedIsNew = false;
  fillOrderForm(order);
  qs('detailDrawer').classList.add('open');
  qs('detailDrawer').setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  qs('detailDrawer').classList.remove('open');
  qs('detailDrawer').setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  editingOrderId = null;
  selectedIsNew = false;
}

async function persistOrderChange(mode, order) {
  if (!serverAvailable) return false;
  try {
    if (mode === 'add') {
      await apiPost({ action: 'add', order });
    } else if (mode === 'update') {
      await apiPost({ action: 'update', orderId: order.id, order });
    } else if (mode === 'delete') {
      await apiPost({ action: 'delete', orderId: order.id });
    }
    return true;
  } catch (error) {
    console.warn('Server persistence failed, fallback to local.', error);
    serverAvailable = false;
    toast('Google Sheet មិនទាន់ឆ្លើយតប, រក្សាទុកក្នុង local ជាបណ្តោះអាសន្ន', 'error');
    return false;
  }
}

async function saveDrawerChanges() {
  const updated = readOrderFromForm();
  if (!updated.customer) return toast('សូមបញ្ចូលឈ្មោះអតិថិជន', 'error');
  if (!updated.phone) return toast('សូមបញ្ចូលលេខទូរសព្ទ', 'error');
  if (!(updated.products || []).some((p) => p.name)) return toast('សូមបញ្ចូលផលិតផលយ៉ាងហោចណាស់ 1', 'error');

  if (selectedIsNew || !editingOrderId) {
    updated.id = generateOrderId();
    orders.unshift(updated);
    await persistOrderChange('add', updated);
  } else {
    const index = orders.findIndex((item) => item.id === editingOrderId);
    if (index === -1) return;
    updated.id = editingOrderId;
    orders[index] = { ...updated };
    await persistOrderChange('update', updated);
  }
  saveLocalOrders();
  render();
  openDrawer(updated.id);
  toast('រក្សាទុកបានជោគជ័យ', 'success');
}

async function deleteCurrentOrder() {
  if (!editingOrderId || selectedIsNew) return toast('មិនអាចលុប record ថ្មីបានទេ', 'error');
  if (!window.confirm('តើអ្នកប្រាកដថាចង់លុប Order នេះមែនទេ?')) return;
  const order = orders.find((item) => item.id === editingOrderId);
  orders = orders.filter((item) => item.id !== editingOrderId);
  selectedIds.delete(editingOrderId);
  await persistOrderChange('delete', order || { id: editingOrderId });
  saveLocalOrders();
  closeDrawer();
  render();
  toast('លុបបានជោគជ័យ', 'success');
  window.camboNotify && window.camboNotify('Order deleted', `${editingOrderId || ''} removed.`);
}

function addProductLine() {
  const current = readOrderFromForm();
  current.products.push({ name: '', qty: 1, price: 0, discount: 0 });
  renderProductLines(current.products);
  refreshDrawerTotals();
}

function removeProductLine(index) {
  const current = readOrderFromForm();
  current.products.splice(index, 1);
  if (!current.products.length) current.products.push({ name: '', qty: 1, price: 0, discount: 0 });
  renderProductLines(current.products);
  refreshDrawerTotals();
}


function openCustomerHistory(orderId) {
  const base = orders.find((item) => item.id === orderId);
  if (!base) return;
  const sameCustomer = orders.filter((item) => {
    const sameName = String(item.customer || '').trim().toLowerCase() === String(base.customer || '').trim().toLowerCase();
    const samePhone = String(item.phone || '').trim() && String(item.phone || '').trim() === String(base.phone || '').trim();
    return sameName || samePhone;
  }).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const totalSpend = sameCustomer.reduce((sum, item) => sum + calcOrderTotal(item), 0);
  const historyHtml = sameCustomer.map((item) => `<div style="padding:12px 0;border-bottom:1px dashed rgba(148,163,184,.18)"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><strong>${escapeHtml(item.id)}</strong><span>${escapeHtml(formatDate(item.date))} · ${escapeHtml(item.status)}</span></div><div style="margin-top:6px;color:#94a3b8;font-size:13px">${escapeHtml((item.products || []).map((p) => `${p.name} x ${p.qty}`).join(', ') || '-')}</div><div style="margin-top:6px;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><span class="priority-pill priority-${String(item.priority || 'Medium').toLowerCase()}">${escapeHtml(item.priority || 'Medium')}</span><strong>${money(calcOrderTotal(item))}</strong></div></div>`).join('');
  const box = document.createElement('div');
  box.innerHTML = `<div style="position:fixed;inset:0;z-index:9998;background:rgba(2,6,23,.62);display:flex;align-items:center;justify-content:center;padding:18px" id="customerHistoryOverlay"><div style="width:min(720px,100%);max-height:88vh;overflow:auto;border-radius:24px;background:linear-gradient(180deg,rgba(15,23,42,.96),rgba(7,10,20,.98));border:1px solid rgba(148,163,184,.18);padding:22px;box-shadow:0 24px 60px rgba(2,6,23,.45)"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><div><h3 style="margin:0;color:#fff">Customer History</h3><p style="margin:6px 0 0;color:#94a3b8">${escapeHtml(base.customer || '-')} • ${escapeHtml(base.phone || '-')}</p></div><button type="button" id="closeCustomerHistory" style="border:none;background:transparent;color:#e2e8f0;font-size:24px;cursor:pointer">×</button></div><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:18px 0"><div style="padding:12px;border-radius:16px;background:rgba(255,255,255,.04);border:1px solid rgba(148,163,184,.14)"><div style="font-size:12px;color:#8fb6d9;font-weight:800">Total Orders</div><div style="margin-top:8px;font-size:22px;font-weight:800;color:#fff">${sameCustomer.length}</div></div><div style="padding:12px;border-radius:16px;background:rgba(255,255,255,.04);border:1px solid rgba(148,163,184,.14)"><div style="font-size:12px;color:#8fb6d9;font-weight:800">Total Spend</div><div style="margin-top:8px;font-size:22px;font-weight:800;color:#fff">${money(totalSpend)}</div></div><div style="padding:12px;border-radius:16px;background:rgba(255,255,255,.04);border:1px solid rgba(148,163,184,.14)"><div style="font-size:12px;color:#8fb6d9;font-weight:800">Last Order</div><div style="margin-top:8px;font-size:22px;font-weight:800;color:#fff">${escapeHtml(formatDate(sameCustomer[0]?.date || ''))}</div></div></div>${historyHtml || '<div style="color:#94a3b8">No history</div>'}</div></div>`;
  document.body.appendChild(box.firstElementChild);
  document.getElementById('closeCustomerHistory')?.addEventListener('click', () => document.getElementById('customerHistoryOverlay')?.remove());
  document.getElementById('customerHistoryOverlay')?.addEventListener('click', (e) => { if (e.target.id === 'customerHistoryOverlay') e.currentTarget.remove(); });
}

function bindEditableRows() {
  document.querySelectorAll('#ordersTbody tr[data-id]').forEach((row) => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('.row-check')) return;
      e.preventDefault();
      openDrawer(row.dataset.id);
    });
  });
  document.querySelectorAll('#ordersTbody .customer-link, #ordersTbody .phone-link').forEach((link) => link.addEventListener('click', (e) => { e.preventDefault(); const row = e.target.closest('tr[data-id]'); if (row) openCustomerHistory(row.dataset.id); }));
}

async function copyCurrentOrderText() {
  const order = readOrderFromForm();
  const text = buildReceiptText(order);
  try {
    await navigator.clipboard.writeText(text);
    const btn = qs('copyDetailBtn');
    const old = btn.textContent;
    btn.textContent = 'Copied ✓';
    setTimeout(() => btn.textContent = old, 1200);
    toast('Copy បានជោគជ័យ', 'success');
  } catch {
    alert(text);
  }
}

function toggleDrawerQr() {
  setDrawerQrButton(!drawerQrEnabled);
}


function formatDisplayMoney(value) {
  return money(value);
}

function formatDateForShare(value) {
  return formatDate(value);
}

function dataUrlToFile(dataUrl, filename) {
  const [meta, content] = String(dataUrl || '').split(',');
  const mime = (meta.match(/data:(.*?);base64/) || [])[1] || 'image/png';
  const binary = atob(content || '');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}

function waitForImages(root) {
  const images = [...root.querySelectorAll('img')];
  if (!images.length) return Promise.resolve();
  return Promise.all(images.map((img) => {
    if (img.complete) return Promise.resolve();
    return new Promise((resolve) => {
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
    });
  }));
}


async function exportReceiptHtmlToPdf(title, contentHtml) {
  const stage = document.createElement('div');
  stage.style.position='fixed'; stage.style.left='-99999px'; stage.style.top='0';
  stage.innerHTML = `<style>${getPrintDocumentStyles()}</style><div class="print-root">${contentHtml}</div>`;
  document.body.appendChild(stage);
  try {
    await waitForImages(stage);
    const root = stage.querySelector('.print-root');
    const canvas = await html2canvas(root, {scale:2, backgroundColor:'#ffffff', useCORS:true, windowWidth:root.scrollWidth, windowHeight:root.scrollHeight});
    window.downloadCanvasAsPdf(canvas, `${title.replace(/\s+/g,'-').toLowerCase()}.pdf`, 80);
    window.camboNotify && window.camboNotify('PDF exported', title);
    toast('PDF ready', 'success');
  } catch (error) { console.error(error); toast('PDF export failed', 'error'); } finally { stage.remove(); }
}

async function exportFilteredOrdersPdf() {
  const rows = applyListPrintSettings(getFilteredOrders());
  if (!rows.length) return toast('មិនមានទិន្នន័យសម្រាប់ PDF ទេ។', 'error');
  const html = rows.map((order, index) => buildPrintInvoiceHTML(order, index, rows.length)).join('');
  await exportReceiptHtmlToPdf(`orders-${rows.length}`, html);
}

async function exportCurrentOrderPdf() {
  const order = readOrderFromForm();
  if (!(order.products || []).some(line => line.name)) return toast('សូមបញ្ចូលផលិតផលជាមុនសិន។', 'error');
  await exportReceiptHtmlToPdf(order.customer || order.id || 'order', buildPrintInvoiceHTML(order, 0, 1));
}

async function startRealtimeSync() {
  let lastCount = orders.length;
  const sync = async () => {
    try {
      const data = await apiGet({ action: 'list', limit: 5000, _: Date.now() });
      const fresh = extractOrders(data).map(normalizeOrder);
      if (fresh.length) {
        if (fresh.length > lastCount && lastCount !== 0) window.camboNotify && window.camboNotify('New orders synced', `${fresh.length - lastCount} new order(s) from Google Sheet`);
        lastCount = fresh.length;
        orders = fresh;
        saveLocalOrders();
        render();
      }
      const hero = document.querySelector('.hero-badge');
      if (hero) hero.innerHTML = 'SEARCH &amp; EDIT ORDERS · <span class="live-dot"></span> LIVE';
    } catch (error) { console.warn('Realtime sync failed', error); }
  };
  setInterval(sync, 30000);
}

function getSelectedQrMeta(order) {
  if (!order || order.showQrEnabled === false) return null;
  const payment = String(order.payment || '').trim().toUpperCase();
  if (payment === 'ABA') return { src: `${ASSET_ROOT}/img/qr/ABA.svg`, label: 'ABA', name: '' };
  if (payment === 'AC') return { src: `${ASSET_ROOT}/img/qr/AC.svg`, label: 'AC', name: '' };
  return null;
}

function readListPrintSettings() {
  const startRaw = Number(qs('listReceiptStart')?.value || 0);
  const endRaw = Number(qs('listReceiptEnd')?.value || 0);
  const start = Number.isFinite(startRaw) && startRaw > 0 ? Math.floor(startRaw) : 0;
  const end = Number.isFinite(endRaw) && endRaw > 0 ? Math.floor(endRaw) : 0;
  const qrBtn = qs('qrToggle');
  const qrEnabled = qrBtn ? qrBtn.textContent.includes('ON') : true;
  return { start, end, qrEnabled };
}

function cloneOrders(rows) {
  return Array.isArray(rows)
    ? rows.map((order) => ({
        ...order,
        products: (order.products || []).map((product) => ({ ...product }))
      }))
    : [];
}

function applyListPrintSettings(rows) {
  const { start, end, qrEnabled, hasStart, hasEnd, hasAnyRange } = readListPrintSettings();
  const working = cloneOrders(rows);
  if (!working.length) return [];

  const receiptStart = hasStart ? start || 1 : 1;
  const fromIndex = hasStart ? Math.max(receiptStart - 1, 0) : 0;
  const toIndex = hasEnd && end >= receiptStart ? end : working.length;

  return working.slice(fromIndex, toIndex).map((order, index) => ({
    ...order,
    showQrEnabled: qrEnabled,
    receiptNo: hasAnyRange ? String(receiptStart + index) : ''
  }));
}

async function copyCurrentOrderText() {
  const order = readOrderFromForm();
  const text = buildReceiptText(order);
  try {
    await navigator.clipboard.writeText(text);
    const btn = qs('copyDetailBtn');
    const old = btn.textContent;
    btn.textContent = 'Copied ✓';
    setTimeout(() => {
      btn.textContent = old;
    }, 1200);
    toast('Copy បានជោគជ័យ', 'success');
  } catch {
    alert(text);
  }
}

function toggleDrawerQr() {
  setDrawerQrButton(!drawerQrEnabled);
}

function buildReceiptText(order) {
  const province = (order.province || '').trim();
  const detailAddress = (order.address || '').trim();
  const fullAddress = [detailAddress, province].filter(Boolean).join(' | ') || '-';
  const deliveryFee = Math.max(0, Number(order.deliveryFee || 0));
  const itemsTotal = (order.products || []).reduce((sum, item) => sum + calcSubtotal(item), 0);
  const grand = itemsTotal + deliveryFee;
  const grandRiel = Math.round(grand * EXCHANGE_RATE);

  const lines = (order.products || []).map((item, index) => {
    const qtyText = `${Number(item.qty || 0)}ឈុត`;
    return `${index + 1}. ${item.name || '-'} | ${qtyText} | ${formatDisplayMoney(item.price || 0)} | ${formatDisplayMoney(calcSubtotal(item))}`;
  });

  return [
    `វិក័យប័ត្រ | ${formatDateForShare(order.date)}`,
    '..................................................',
    `ឈ្មោះ: ${order.customer || '-'}`,
    `លេខទូរសព្ទ: ${order.phone || '-'}`,
    `ទីតាំង: ${fullAddress}`,
    `អ្នកដឹកជញ្ជូន: ${order.deliveryName || '-'}`,
    `ការទូទាត់: ${order.payment || '-'}`,
    `Note: ${order.note || '-'}`,
    '..................................................',
    ...lines,
    '..................................................',
    `តម្លៃទំនិញ: ${formatDisplayMoney(itemsTotal)}`,
    `សេវាដឹក: ${deliveryFee === 0 ? 'ហ្វ្រីដឹក' : formatDisplayMoney(deliveryFee)}`,
    `សរុបទឹកប្រាក់: ${formatDisplayMoney(grand)}`,
    `ប្រាក់រៀល: ${grandRiel.toLocaleString()}៛`,
    `Page: ${order.page || '-'} | CloseBy: ${order.closeBy || '-'}`
  ].join('\n');
}

function buildPrintInvoiceHTML(order, index = 0, total = 1) {
  const province = (order.province || '').trim();
  const detailAddress = (order.address || '').trim();
  const fullAddress = [detailAddress, province].filter(Boolean).join(' : ') || '-';

  const deliveryFee = Math.max(0, Number(order.deliveryFee || 0));
  const itemsTotal = (order.products || []).reduce((sum, item) => sum + calcSubtotal(item), 0);
  const grand = itemsTotal + deliveryFee;
  const grandRiel = Math.round(grand * EXCHANGE_RATE);

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
      -webkit-box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      width: 80mm;
      max-width: 80mm;
      background: #ffffff;
      overflow-x: hidden;
    }

    body {
      font-family: "Kantumruy Pro", "Noto Sans Khmer", sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      color-adjust: exact;
      color: #111827;
      color: #111827;
      font-size: 12px;
      line-height: 1.35;
    }

    img {
      display: block;
      max-width: 100%;
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
    }

    .print-root {
      width: 80mm;
      max-width: 80mm;
      min-width: 80mm;
      margin: 0 auto;
      padding: 0;
      background: #ffffff;
    }

    .receipt-print {
      width: 80mm;
      max-width: 80mm;
      min-width: 80mm;
      margin: 0 auto;
      padding: 5mm 1.5mm 1.5mm;
      background: #ffffff;
      page-break-inside: avoid;
      break-inside: avoid;
      overflow: hidden;
    }

    .page-break {
      page-break-after: always;
      break-after: page;
    }

    .receipt-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 2mm;
    }

    .receipt-title {
      font-size: 25px;
      font-weight: 800;
      line-height: 1;
      color: #000000;
      letter-spacing: 0;
      word-break: break-word;
    }

    .receipt-date {
      flex: 0 0 auto;
      text-align: right;
      font-size: 14px;
      line-height: 1.3;
      color: #4b5563;
      white-space: nowrap;
      padding-top: 0.5mm;
    }

    .receipt-dash {
      border-top: 1px dashed #6b7280;
      margin: 2mm 0;
    }

    .receipt-info-grid {
      display: grid;
      grid-template-columns: 22mm minmax(0, 1fr);
      gap: 0.8mm 2mm;
      font-size: 14px;
      line-height: 1.4;
      width: 100%;
    }

    .receipt-info-labels,
    .receipt-info-values {
      display: grid;
      gap: 0.8mm;
      min-width: 0;
    }

    .receipt-info-labels {
      font-weight: 400;
      color: #111111;
    }

    .receipt-info-values {
      color: #111111;
      word-break: break-word;
      overflow-wrap: anywhere;
    }

    .receipt-table-wrap {
      width: 100%;
      overflow: hidden;
    }

    .receipt-table-head,
    .receipt-item-row {
      width: 100%;
      display: grid;
      grid-template-columns: minmax(0, 1fr) 8mm 9mm 14mm;
      column-gap: 0.5mm;
      align-items: start;
    }

    .receipt-table-head {
      font-size: 15px;
      font-weight: 800;
      color: #000000;
      line-height: 1.25;
    }

    .receipt-table-line {
      border-top: 1.5px solid #111111;
      margin: 1.2mm 0 1.4mm;
    }

    .receipt-item-row {
      font-size: 14px;
      line-height: 1.32;
      color: #111111;
      padding: 0.8mm 0;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .receipt-col-product {
      text-align: left;
      min-width: 0;
      padding-right: 0.5mm;
      word-break: break-word;
      overflow-wrap: anywhere;
    }

    .receipt-col-product .item-name,
    .receipt-col-product strong,
    .receipt-col-product span {
      word-break: break-word;
      overflow-wrap: anywhere;
    }

    .receipt-col-qty,
    .receipt-col-price,
    .receipt-col-subtotal {
      text-align: right;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
      font-feature-settings: "tnum";
    }

    .receipt-col-qty {
      min-width: 11mm;
    }

    .receipt-col-price {
      min-width: 13mm;
    }

    .receipt-col-subtotal {
      min-width: 14mm;
      font-weight: 700;
    }

    .receipt-total-row,
    .receipt-pay-row,
    .receipt-riel-row,
    .receipt-delivery-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 2mm;
      margin: 0.8mm 0;
      line-height: 1.4;
      color: #111111;
      font-size: 12px;
    }

    .receipt-pay-row {
      align-items: flex-end;
      margin-top: 1.4mm;
    }

    .receipt-pay-left {
      flex: 1 1 auto;
      min-width: 0;
      font-size: 11px;
      line-height: 1.35;
      word-break: break-word;
    }

    .receipt-pay-left strong {
      font-size: 14px;
      font-weight: 800;
      color: #000000;
    }

    .receipt-grand-total {
      flex: 0 0 auto;
      font-size: 17px;
      font-weight: 800;
      line-height: 1;
      white-space: nowrap;
      color: #000000;
      font-variant-numeric: tabular-nums;
      font-feature-settings: "tnum";
    }

    .receipt-riel-row {
      font-size: 12.5px;
      color: #000000;
    }

    .receipt-meta {
      font-size: 11.5px;
      color: #111111;
      line-height: 1.38;
      margin-bottom: 1mm;
      word-break: break-word;
      overflow-wrap: anywhere;
    }

    .receipt-service {
      font-size: 14px;
      color: #4b5563;
      line-height: 1.35;
      word-break: break-word;
      overflow-wrap: anywhere;
    }

    .receipt-bottom {
      display: grid;
      grid-template-columns: 30mm minmax(0, 1fr);
      gap: 2.5mm;
      align-items: stretch;
      margin-top: 1.5mm;
      width: 100%;
    }

    .receipt-bottom.no-number,
    .receipt-bottom.no-qr,
    .receipt-bottom.no-number.no-qr {
      grid-template-columns: 1fr;
    }

    .receipt-qr-side {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      min-width: 0;
    }

    .receipt-qr-box {
      width: 100%;
      max-width: 28mm;
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
    }

    .receipt-qr-label {
      margin-top: 1mm;
      font-size: 13px;
      font-weight: 800;
      line-height: 1;
      text-align: center;
      color: #000000;
    }

    .receipt-qr-name {
      margin-top: 0.8mm;
      font-size: 10.5px;
      font-weight: 800;
      line-height: 1.2;
      text-align: center;
      color: #000000;
      text-transform: uppercase;
      word-break: break-word;
      overflow-wrap: anywhere;
    }

    .receipt-number-side {
      border-left: 1px solid #111111;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 28mm;
      padding-left: 2.5mm;
      min-width: 0;
    }

    .receipt-bottom.no-qr .receipt-number-side,
    .receipt-bottom.no-number .receipt-number-side {
      border-left: none;
      padding-left: 0;
      min-height: auto;
      justify-content: flex-start;
    }

    .receipt-number {
      font-size: 34px;
      font-weight: 800;
      line-height: 0.95;
      color: #000000;
      font-variant-numeric: tabular-nums;
      font-feature-settings: "tnum";
      text-align: center;
      word-break: break-word;
    }

    .text-right {
      text-align: right;
    }

    .text-left {
      text-align: left;
    }

    .fw-bold {
      font-weight: 700;
    }

    .fw-extra-bold {
      font-weight: 800;
    }

    .nowrap {
      white-space: nowrap;
    }

    @media screen {
      html,
      body {
        width: 100%;
        max-width: 100%;
        background: #f3f4f6;
      }

      body {
        padding: 10px 0;
      }

      .print-root {
        width: 80mm;
        max-width: 80mm;
        min-width: 80mm;
        margin: 0 auto;
        background: #ffffff;
      }

      .receipt-print {
        box-shadow: 0 0 0 1px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.08);
      }
    }

    @media print {
      html,
      body {
        width: 80mm !important;
        max-width: 80mm !important;
        min-width: 80mm !important;
        background: #ffffff !important;
      }

      body {
        padding: 0 !important;
      }

      .print-root,
      .receipt-print {
        width: 80mm !important;
        max-width: 80mm !important;
        min-width: 80mm !important;
        margin: 0 auto !important;
        box-shadow: none !important;
      }
    }
  `;
}

function getShareReceiptStyles() {
  return `
    .share-capture-shell {
      width: 80mm;
      max-width: 80mm;
      min-width: 80mm;
      background: #ffffff;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-family: "Kantumruy Pro", "Noto Sans Khmer", sans-serif;
      color: #111827;
    }

    .share-card {
      width: 80mm;
      max-width: 80mm;
      min-width: 80mm;
      background: #ffffff;
      padding: 4mm 3mm;
      border: 1px solid #e5e7eb;
      box-sizing: border-box;
    }

    .share-head,
    .share-item-row,
    .share-total-row,
    .share-pay-row,
    .share-riel-row,
    .share-bottom {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 2mm;
    }

    .share-head { margin-bottom: 2mm; }
    .share-title { font-size: 22px; font-weight: 800; line-height: 1; color: #000; }
    .share-date { font-size: 10px; color: #4b5563; text-align: right; white-space: nowrap; }
    .share-dash { border-top: 1px dashed #6b7280; margin: 2mm 0; }

    .share-info-grid {
      display: grid;
      grid-template-columns: 22mm minmax(0, 1fr);
      gap: 0.8mm 2mm;
      font-size: 11.5px;
      line-height: 1.4;
    }

    .share-info-labels,
    .share-info-values { display: grid; gap: 0.8mm; min-width: 0; }
    .share-info-labels { font-weight: 700; }
    .share-info-values { overflow-wrap: anywhere; word-break: break-word; }

    .share-table-head,
    .share-item-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 11mm 13mm 14mm;
      column-gap: 1.2mm;
      align-items: start;
      width: 100%;
    }

    .share-table-head { font-size: 10.5px; font-weight: 800; color: #000; }
    .share-table-line { border-top: 1px solid #111; margin: 1.2mm 0 1.4mm; }
    .share-item-row { font-size: 10.5px; line-height: 1.32; padding: 0.8mm 0; }
    .share-col-product { min-width: 0; padding-right: 0.5mm; overflow-wrap: anywhere; word-break: break-word; }
    .share-col-qty,
    .share-col-price,
    .share-col-subtotal { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .share-col-subtotal { font-weight: 700; }

    .share-total-row,
    .share-pay-row,
    .share-riel-row { font-size: 11px; line-height: 1.4; margin: 0.8mm 0; }
    .share-pay-left strong { font-size: 13px; font-weight: 800; color: #000; }
    .share-grand-total { font-size: 17px; font-weight: 800; line-height: 1; white-space: nowrap; color: #000; }
    .share-riel-row { font-size: 10.5px; }
    .share-meta { font-size: 10.5px; line-height: 1.38; margin-bottom: 1mm; overflow-wrap: anywhere; }
    .share-service { font-size: 9.8px; color: #4b5563; line-height: 1.35; overflow-wrap: anywhere; }

    .share-bottom {
      display: grid;
      grid-template-columns: 1fr 18mm;
      align-items: stretch;
      gap: 2mm;
      margin-top: 1.5mm;
      min-height: 28mm;
    }

    .share-bottom.no-number,
    .share-bottom.no-qr,
    .share-bottom.no-number.no-qr { grid-template-columns: 1fr; }

    .share-qr-side {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
    }

    .share-qr-box {
      width: 100%;
      max-width: 24mm;
      aspect-ratio: 1/1;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .share-qr-image { width: 100%; height: 100%; object-fit: contain; }
    .share-qr-label { margin-top: 1mm; font-size: 12px; font-weight: 800; line-height: 1; text-align: center; }
    .share-number-side { border-left: 1px solid #111; display: flex; align-items: center; justify-content: center; padding-left: 2mm; }
    .share-bottom.no-qr .share-number-side,
    .share-bottom.no-number .share-number-side { border-left: none; padding-left: 0; justify-content: flex-start; }
    .share-number { font-size: 34px; font-weight: 800; line-height: 0.95; text-align: center; }
  `;
}

function buildShareReceiptHTML(order) {
  const province = (order.province || '').trim();
  const detailAddress = (order.address || '').trim();
  const fullAddress = [detailAddress, province].filter(Boolean).join(' : ') || '-';
  const deliveryFee = Math.max(0, Number(order.deliveryFee || 0));
  const itemsTotal = (order.products || []).reduce((sum, item) => sum + calcSubtotal(item), 0);
  const grand = itemsTotal + deliveryFee;
  const grandRiel = Math.round(grand * EXCHANGE_RATE);
  const qrMeta = getSelectedQrMeta(order);
  const receiptNo = (order.receiptNo || '').trim();
  const rows = (order.products || []).map((it, i) => `
    <div class="share-item-row">
      <div class="share-col-product">${i + 1}. ${escapeHtml(it.name || '-')}</div>
      <div class="share-col-qty">${escapeHtml(String(it.qty || 0))} ឈុត</div>
      <div class="share-col-price">${escapeHtml(formatDisplayMoney(it.price || 0))}</div>
      <div class="share-col-subtotal">${escapeHtml(formatDisplayMoney(calcSubtotal(it)))}</div>
    </div>
  `).join('');

  return `
    <section class="share-card">
      <div class="share-head">
        <div class="share-title">វិក័យប័ត្រ</div>
        <div class="share-date">កាលបរិច្ឆេទ: ${escapeHtml(formatDateForShare(order.date))}</div>
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
          <div><strong>${escapeHtml(order.customer || '-')}</strong></div>
          <div><strong>${escapeHtml(order.phone || '-')}</strong></div>
          <div>${escapeHtml(fullAddress)}</div>
          <div>${escapeHtml(order.deliveryName || '-')}</div>
          <div>${escapeHtml(order.note || '-')}</div>
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
      <div class="share-total-row"><span>តម្លៃទំនិញ</span><span>${escapeHtml(formatDisplayMoney(itemsTotal))}</span></div>
      <div class="share-total-row"><span>សេវាដឹក</span><span>${deliveryFee === 0 ? 'ហ្វ្រីដឹក' : escapeHtml(formatDisplayMoney(deliveryFee))}</span></div>
      <div class="share-pay-row"><div class="share-pay-left">ការទូទាត់: <strong>${escapeHtml(order.payment || '-')}</strong></div><div class="share-grand-total">${escapeHtml(formatDisplayMoney(grand))}</div></div>
      <div class="share-riel-row"><span>ប្រាក់រៀល:</span><span><strong>${escapeHtml(grandRiel.toLocaleString())}៛</strong></span></div>
      <div class="share-dash"></div>
      <div class="share-meta">Page: <strong>${escapeHtml(order.page || '-')}</strong> | CloseBy: <strong>${escapeHtml(order.closeBy || '-')}</strong></div>
      <div class="share-service">លេខបម្រើអតិថិជន 015 58 68 78 / 089 58 68 78</div>
      ${(qrMeta || receiptNo) ? `
        <div class="share-dash"></div>
        <div class="share-bottom ${!qrMeta ? 'no-qr' : ''} ${!receiptNo ? 'no-number' : ''}">
          ${qrMeta ? `<div class="share-qr-side"><div class="share-qr-box"><img class="share-qr-image" src="${escapeHtml(qrMeta.src)}" alt="${escapeHtml(qrMeta.label)} QR Code"></div><div class="share-qr-label">${escapeHtml(qrMeta.label)}</div></div>` : ''}
          ${receiptNo ? `<div class="share-number-side"><div class="share-number">${escapeHtml(receiptNo)}</div></div>` : ''}
        </div>
      ` : ''}
    </section>
  `;
}

function openPrintWindow(title, contentHtml) {
  const printWindow = window.open('', '_blank', 'width=1100,height=900');
  if (!printWindow) {
    toast('Browser blocked the print window. Please allow popups and try again.', 'error');
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
        <link href="" rel="stylesheet" />
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

function printOrdersCollection(rows, title = 'Print Orders') {
  if (!Array.isArray(rows) || !rows.length) {
    toast('មិនមានទិន្នន័យសម្រាប់ព្រីនទេ។', 'error');
    return;
  }
  const html = rows.map((order, index) => buildPrintInvoiceHTML(order, index, rows.length)).join('');
  openPrintWindow(title, html);
}

function printCurrentOrderDetail() {
  const order = readOrderFromForm();
  if (!(order.products || []).some((p) => p.name)) return toast('សូមបញ្ចូលផលិតផលជាមុនសិន។', 'error');
  printOrdersCollection([order], `Print ${order.customer || order.id || 'Order'}`);
}

function printSelectedOrders() {
  const rows = getFilteredOrders().filter((order) => selectedIds.has(order.id));
  if (!rows.length) return toast('សូមជ្រើសរើស row មុនសិន', 'error');
  const preparedRows = applyListPrintSettings(rows);
  printOrdersCollection(preparedRows, `Print ${preparedRows.length} Orders`);
}

function printFilteredOrders() {
  const rows = getTopActionRows();
  if (!rows.length) return toast('មិនមានទិន្នន័យក្រោយ filter សម្រាប់ព្រីនទេ។', 'error');
  const preparedRows = applyListPrintSettings(rows);
  if (!preparedRows.length) return toast('មិនមានលេខ receipt ត្រូវព្រីនទេ។', 'error');
  printOrdersCollection(preparedRows, `Print ${preparedRows.length} Orders`);
}

function ensureHtml2Canvas() {
  if (window.html2canvas) return Promise.resolve(window.html2canvas);
  return Promise.reject(new Error('Offline html2canvas not available'));
}

async function sharePreparedOrdersAsImage(preparedOrders) {
  if (!Array.isArray(preparedOrders) || !preparedOrders.length) {
    toast('មិនមានទិន្នន័យសម្រាប់ Share IMG ទេ។', 'error');
    return;
  }

  const html2canvas = await ensureHtml2Canvas();
  toast('Preparing Share IMG...', 'info');
  const stage = document.createElement('div');
  stage.className = 'share-capture-stage';
  stage.style.position = 'fixed';
  stage.style.left = '-99999px';
  stage.style.top = '0';
  stage.style.zIndex = '-1';
  stage.innerHTML = `<style>${getShareReceiptStyles()}</style><div class="share-capture-shell">${preparedOrders.map((order) => buildShareReceiptHTML(order)).join('')}</div>`;
  document.body.appendChild(stage);

  try {
    await waitForImages(stage);
    const shell = stage.querySelector('.share-capture-shell');
    const canvas = await html2canvas(shell, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: shell.scrollWidth,
      windowHeight: shell.scrollHeight
    });
    const dataUrl = canvas.toDataURL('image/png');
    const filename = `orders_${new Date().toISOString().slice(0, 10)}.png`;

    if (navigator.canShare && navigator.share) {
      const file = dataUrlToFile(dataUrl, filename);
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Orders (${preparedOrders.length})`,
          files: [file]
        });
        toast('Share IMG ready.', 'success');
        return;
      }
    }

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast('Share IMG downloaded as PNG.', 'success');
  } catch (error) {
    console.error(error);
    toast(error.message || 'Share IMG failed.', 'error');
  } finally {
    stage.remove();
  }
}

async function shareCurrentOrderAsImage() {
  const order = readOrderFromForm();
  if (!(order.products || []).some((p) => p.name)) return toast('សូមបញ្ចូលផលិតផលជាមុនសិន។', 'error');
  try {
    const prepared = [{ ...order, receiptNo: order.receiptNo || '', showQrEnabled: order.showQrEnabled !== false }];
    await sharePreparedOrdersAsImage(prepared);
  } catch (error) {
    toast(error.message || 'Share មិនបានទេ', 'error');
  }
}

async function shareFilteredOrdersAsImage() {
  try {
    const rows = getTopActionRows();
    if (!rows.length) return toast('មិនមានទិន្នន័យក្រោយ filter សម្រាប់ Share IMG ទេ។', 'error');
    const preparedRows = applyListPrintSettings(rows);
    if (!preparedRows.length) return toast('មិនមានលេខ receipt ត្រូវ Share ទេ។', 'error');
    await sharePreparedOrdersAsImage(preparedRows);
  } catch (error) {
    toast(error.message || 'Share មិនបានទេ', 'error');
  }
}

window.addEventListener('load', async () => {
  document.querySelectorAll('.glass-card-3d').forEach((el) => {
    el.classList.remove('glass-card-3d');
    el.style.transform = 'none';
  });
  initDateFilter();
  await loadOrders();
  render();
  if (serverAvailable) toast('បានភ្ជាប់ Google Sheet រួចហើយ', 'success');
  else toast('Google Sheet មិនទាន់ឆ្លើយតប, ប្រើ local data ជាបណ្តោះអាសន្ន', 'info');
});


/* ===== Final override: Print / Share IMG / Copy Text (merged from reference format) ===== */
function formatDisplayMoney(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return '$0';
  return `$${num % 1 === 0 ? num.toFixed(0) : num.toFixed(2).replace(/\.00$/, '')}`;
}

function formatDateForShare(value) {
  if (!value) return '-';
  const text = String(value).trim();
  let date = text;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) date = match[1];
    else {
      const dt = new Date(text);
      if (!Number.isNaN(dt.getTime())) {
        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        const d = String(dt.getDate()).padStart(2, '0');
        date = `${y}-${m}-${d}`;
      }
    }
  }
  const [y, m, d] = String(date).slice(0, 10).split('-');
  return y && m && d ? `${d}/${m}/${y}` : '-';
}


function getSelectedQrMeta(order) {
  if (!order || order.showQrEnabled === false) return null;
  const method = String(order.payment || '').trim().toUpperCase();
  const fileMap = {
    ABA: { src: `${ASSET_ROOT}/img/qr/ABA.svg`, name: 'CHEA CHANROTHA' },
    AC: { src: `${ASSET_ROOT}/img/qr/AC.svg`, name: 'CHEA CHANROTHA' }
  };
  if (!fileMap[method]) return null;
  return {
    label: method,
    src: fileMap[method].src,
    name: fileMap[method].name || ''
  };
}

function readListPrintSettings() {
  const startValue = String(qs('listReceiptStart')?.value || '').trim();
  const endValue = String(qs('listReceiptEnd')?.value || '').trim();
  const startRaw = Number(startValue || 0);
  const endRaw = Number(endValue || 0);
  const start = Number.isFinite(startRaw) && startRaw > 0 ? Math.floor(startRaw) : 0;
  const end = Number.isFinite(endRaw) && endRaw > 0 ? Math.floor(endRaw) : 0;
  const qrBtn = qs('qrToggle');
  const qrEnabled = qrBtn ? !qrBtn.classList.contains('off') && /ON/i.test(qrBtn.textContent || '') : true;
  return {
    start,
    end,
    qrEnabled,
    hasStart: startValue !== '',
    hasEnd: endValue !== '',
    hasAnyRange: startValue !== '' || endValue !== ''
  };
}

function buildCopyReceiptText(order) {
  const dateText = formatDateForShare(order.date);
  const addressText = (order.address || '-').trim() || '-';
  const provinceText = (order.province || '-').trim() || '-';
  const locationText = `${addressText} | ${provinceText}`;
  const deliveryText = (order.deliveryName || '-').trim() || '-';
  const noteText = (order.note || '-').trim() || '-';
  const pageText = (order.page || '-').trim() || '-';
  const closeByText = (order.closeBy || '-').trim() || '-';
  const paymentText = (order.payment || '-').trim() || '-';

  const itemsTotal = (order.products || []).reduce((sum, item) => sum + calcSubtotal(item), 0);
  const deliveryFee = Math.max(0, Number(order.deliveryFee || 0));
  const grand = itemsTotal + deliveryFee;
  const grandRiel = Math.round(grand * EXCHANGE_RATE);

  const separator = '..................................................';
  const lines = [
    `វិក័យប័ត្រ | ${dateText}`,
    separator,
    `ឈ្មោះ: ${order.customer || '-'}`,
    `លេខទូរសព្ទ: ${order.phone || '-'}`,
    `ទីតាំង: ${locationText}`,
    `ដឹកជញ្ជូន: ${deliveryText}`,
    `Note: ${noteText}`,
    separator,
    'បញ្ជីផលិតផល',
    separator
  ];

  (order.products || []).forEach((item, index) => {
    const qty = Number(item.qty || 0);
    const price = formatDisplayMoney(item.price || 0);
    const subtotal = formatDisplayMoney(calcSubtotal(item));
    lines.push(`${index + 1}. ${item.name || '-'}`);
    lines.push(`• ចំនួន: ${qty} ឈុត តម្លៃ: ${price} សរុប: ${subtotal}`);
  });

  lines.push(separator);
  lines.push(`តម្លៃសរុប៖ ${formatDisplayMoney(itemsTotal)}`);
  lines.push(`សេវាដឹក៖ ${deliveryFee === 0 ? 'ឥតគិត' : formatDisplayMoney(deliveryFee)}`);
  lines.push(`ការទូទាត់៖ ${paymentText} | ${formatDisplayMoney(grand)}`);
  lines.push(`ប្រាក់រៀល: ${grandRiel.toLocaleString()}៛`);
  lines.push(separator);
  lines.push(`Page: ${pageText} | CloseBy: ${closeByText}`);
  lines.push('លេខបម្រើអតិថិជន៖ 015 58 68 78 / 089 58 68 78');
  lines.push(separator);

  return lines.join('\n');
}

async function copyCurrentOrderText() {
  const order = readOrderFromForm();
  if (!(order.products || []).some((line) => line.name)) {
    toast('សូមបញ្ចូលផលិតផលជាមុនសិន។', 'error');
    return;
  }
  const text = buildCopyReceiptText(order);
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-99999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    toast('Copy Text បានជោគជ័យ', 'success');
    const btn = qs('copyDetailBtn');
    if (btn) {
      const original = btn.dataset.originalText || btn.textContent;
      btn.dataset.originalText = original;
      btn.textContent = 'Copied ✓';
      btn.classList.add('copy-success');
      clearTimeout(btn._copyTimer);
      btn._copyTimer = setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove('copy-success');
      }, 1800);
    }
  } catch (error) {
    console.error(error);
    toast('Copy មិនបានទេ', 'error');
  }
}

function buildPrintInvoiceHTML(order, index = 0, total = 1) {
  const province = (order.province || '').trim();
  const detailAddress = (order.address || '').trim();
  const fullAddress = [detailAddress, province].filter(Boolean).join(' : ') || '-';

  const deliveryFee = Math.max(0, Number(order.deliveryFee || 0));
  const itemsTotal = (order.products || []).reduce((sum, item) => sum + calcSubtotal(item), 0);
  const grand = itemsTotal + deliveryFee;
  const grandRiel = Math.round(grand * EXCHANGE_RATE);

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
          <div><strong>ឈ្មោះ:</strong></div>
          <div><strong>លេខទូរសព្ទ:</strong></div>
          <div>ទីតាំង:</div>
          <div>អ្នកដឹកជញ្ជូន:</div>
          <div>Note:</div>
        </div>
        <div class="receipt-info-values">
          <div><strong>${escapeHtml(customerText)}</strong></div>
          <div><strong>${escapeHtml(phoneText)}</strong></div>
          <div>${escapeHtml(fullAddress)}</div>
          <div><strong>${escapeHtml(deliveryNameText)}</strong></div>
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
    @page { size: 80mm auto; margin: 0; }
    * { box-sizing: border-box; -webkit-box-sizing: border-box; }
    html, body { margin: 0; padding: 0; width: 80mm; max-width: 80mm; background: #ffffff; overflow-x: hidden; }
    body {
      font-family: "Kantumruy Pro", "Noto Sans Khmer", sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      color-adjust: exact;
      color: #111827;
      font-size: 12px;
      line-height: 1.35;
    }
    img { display: block; max-width: 100%; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges; }
    .print-root { width: 80mm; max-width: 80mm; min-width: 80mm; margin: 0 auto; padding: 0; background: #ffffff; }
    .receipt-print {
      width: 80mm; max-width: 80mm; min-width: 80mm; margin: 0 auto;
      padding: 5mm 1.5mm 1.5mm; background: #ffffff;
      page-break-inside: avoid; break-inside: avoid; overflow: hidden;
    }
    .page-break { page-break-after: always; break-after: page; }
    .receipt-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 2mm; }
    .receipt-title { font-size: 25px; font-weight: 800; line-height: 1; color: #000000; word-break: break-word; }
    .receipt-date { flex: 0 0 auto; text-align: right; font-size: 14px; line-height: 1.3; color: #4b5563; white-space: nowrap; padding-top: 0.5mm; }
    .receipt-dash { border-top: 1px dashed #6b7280; margin: 2mm 0; }
    .receipt-info-grid { display: grid; grid-template-columns: 22mm minmax(0, 1fr); gap: 0.8mm 2mm; font-size: 14px; line-height: 1.4; width: 100%; }
    .receipt-info-labels, .receipt-info-values { display: grid; gap: 0.8mm; min-width: 0; }
    .receipt-info-labels { font-weight: 400; color: #111111; }
    .receipt-info-values { color: #111111; word-break: break-word; overflow-wrap: anywhere; }
    .receipt-table-wrap { width: 100%; overflow: hidden; }
    .receipt-table-head, .receipt-item-row { width: 100%; display: grid; grid-template-columns: minmax(0, 1fr) 8mm 9mm 14mm; column-gap: 0.5mm; align-items: start; }
    .receipt-table-head { font-size: 15px; font-weight: 800; color: #000000; line-height: 1.25; }
    .receipt-table-line { border-top: 1.5px solid #111111; margin: 1.2mm 0 1.4mm; }
    .receipt-item-row { font-size: 14px; line-height: 1.32; color: #111111; padding: 0.8mm 0; break-inside: avoid; page-break-inside: avoid; }
    .receipt-col-product { text-align: left; min-width: 0; padding-right: 0.5mm; word-break: break-word; overflow-wrap: anywhere; }
    .receipt-col-product .item-name, .receipt-col-product strong, .receipt-col-product span { word-break: break-word; overflow-wrap: anywhere; }
    .receipt-col-qty, .receipt-col-price, .receipt-col-subtotal { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; font-feature-settings: "tnum"; }
    .receipt-col-qty { min-width: 11mm; }
    .receipt-col-price { min-width: 13mm; }
    .receipt-col-subtotal { min-width: 14mm; font-weight: 700; }
    .receipt-total-row, .receipt-pay-row, .receipt-riel-row, .receipt-delivery-row {
      display: flex; justify-content: space-between; align-items: flex-start; gap: 2mm;
      margin: 0.8mm 0; line-height: 1.4; color: #111111; font-size: 12px;
    }
    .receipt-pay-row { align-items: flex-end; margin-top: 1.4mm; }
    .receipt-pay-left { flex: 1 1 auto; min-width: 0; font-size: 11px; line-height: 1.35; word-break: break-word; }
    .receipt-pay-left strong { font-size: 14px; font-weight: 800; color: #000000; }
    .receipt-grand-total { flex: 0 0 auto; font-size: 17px; font-weight: 800; line-height: 1; white-space: nowrap; color: #000000; font-variant-numeric: tabular-nums; font-feature-settings: "tnum"; }
    .receipt-riel-row { font-size: 12.5px; color: #000000; }
    .receipt-meta { font-size: 11.5px; color: #111111; line-height: 1.38; margin-bottom: 1mm; word-break: break-word; overflow-wrap: anywhere; }
    .receipt-service { font-size: 14px; color: #4b5563; line-height: 1.35; word-break: break-word; overflow-wrap: anywhere; }
    .receipt-bottom { display: grid; grid-template-columns: 30mm minmax(0, 1fr); gap: 2.5mm; align-items: stretch; margin-top: 1.5mm; width: 100%; }
    .receipt-bottom.no-number, .receipt-bottom.no-qr, .receipt-bottom.no-number.no-qr { grid-template-columns: 1fr; }
    .receipt-qr-side { display: flex; flex-direction: column; align-items: center; justify-content: flex-start; min-width: 0; }
    .receipt-qr-box { width: 100%; max-width: 28mm; aspect-ratio: 1 / 1; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .receipt-qr-image { width: 100%; height: 100%; object-fit: contain; }
    .receipt-qr-label { margin-top: 1mm; font-size: 13px; font-weight: 800; line-height: 1; text-align: center; color: #000000; }
    .receipt-qr-name { margin-top: 0.8mm; font-size: 10.5px; font-weight: 800; line-height: 1.2; text-align: center; color: #000000; text-transform: uppercase; word-break: break-word; overflow-wrap: anywhere; }
    .receipt-number-side { border-left: 1px solid #111111; display: flex; align-items: center; justify-content: center; min-height: 28mm; padding-left: 2.5mm; min-width: 0; }
    .receipt-bottom.no-qr .receipt-number-side, .receipt-bottom.no-number .receipt-number-side { border-left: none; padding-left: 0; min-height: auto; justify-content: flex-start; }
    .receipt-number { font-size: 34px; font-weight: 800; line-height: 0.95; color: #000000; font-variant-numeric: tabular-nums; font-feature-settings: "tnum"; text-align: center; word-break: break-word; }
    @media screen {
      html, body { width: 100%; max-width: 100%; background: #f3f4f6; }
      body { padding: 10px 0; }
      .print-root { width: 80mm; max-width: 80mm; min-width: 80mm; margin: 0 auto; background: #ffffff; }
      .receipt-print { box-shadow: 0 0 0 1px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.08); }
    }
    @media print {
      html, body { width: 80mm !important; max-width: 80mm !important; min-width: 80mm !important; background: #ffffff !important; }
      body { padding: 0 !important; display: flex; justify-content: center; }
      .print-root, .receipt-print { width: 80mm !important; max-width: 80mm !important; min-width: 80mm !important; margin: 0 auto !important; box-shadow: none !important; }
    }
  `;
}

function buildShareReceiptHTML(order) {
  const province = (order.province || '').trim();
  const detailAddress = (order.address || '').trim();
  const fullAddress = [detailAddress, province].filter(Boolean).join(' : ') || '-';
  const deliveryFee = Math.max(0, Number(order.deliveryFee || 0));
  const itemsTotal = (order.products || []).reduce((sum, item) => sum + calcSubtotal(item), 0);
  const grand = itemsTotal + deliveryFee;
  const grandRiel = Math.round(grand * EXCHANGE_RATE);
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
      <div class="share-col-qty">${escapeHtml(String(it.qty || 0))} ឈុត</div>
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

        <div class="share-total-row"><span>តម្លៃទំនិញ</span><span>${escapeHtml(formatDisplayMoney(itemsTotal))}</span></div>
        <div class="share-total-row"><span>សេវាដឹក</span><span>${deliveryFee === 0 ? 'ហ្វ្រីដឹក' : escapeHtml(formatDisplayMoney(deliveryFee))}</span></div>
        <div class="share-pay-row">
          <div class="share-pay-left">ការទូទាត់ <strong>${escapeHtml(paymentText)}</strong></div>
          <div class="share-grand-wrap"><div class="share-grand-total">${escapeHtml(formatDisplayMoney(grand))}</div></div>
        </div>
        <div class="share-riel-row"><span>ប្រាក់រៀល</span><span>${escapeHtml(grandRiel.toLocaleString())}៛</span></div>

        <div class="share-dash"></div>

        <div class="share-mini-meta">Page: ${escapeHtml(pageText)} | CloseBy: ${escapeHtml(closeByText)}</div>
        <div class="share-service-row"><span>លេខបម្រើអតិថិជន:</span><span>015 58 68 78 / 089 58 68 78</span></div>

        ${bottomBlock}
      </div>
    </div>
  `;
}

function getShareReceiptStyles() {
  return `
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #ffffff; }
    body { font-family: "Kantumruy Pro", sans-serif; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; color: #045f80; }
    .share-capture-stage { width: fit-content; margin: 0 auto; background: #ffffff; }
    .share-capture-shell, .share-poster { width: 1080px; background: #f3f7f9; position: relative; overflow: hidden; }
    .share-content { width: 1080px; position: relative; z-index: 2; padding: 54px 50px 50px; display: flex; flex-direction: column; }
    .trim-bottom .share-content { padding-bottom: 50px; }
    .share-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }
    .share-title { font-size: 100px; font-weight: 800; line-height: 0.88; color: #045f80; }
    .share-date { padding-top: 18px; font-size: 27px; font-weight: 500; color: #9ab6c4; white-space: nowrap; }
    .share-dash { margin: 26px 0 18px; border-top: 2px dashed #5f99ae; }
    .share-info-grid { display: grid; grid-template-columns: 245px minmax(0, 1fr); gap: 8px 36px; font-size: 42px; line-height: 1.26; color: #045f80; }
    .share-info-labels, .share-info-values { display: grid; gap: 5px; font-weight: 500; }
    .share-info-values h3 { margin: 0; font-size: inherit; line-height: inherit; }
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

async function sharePreparedOrdersAsImage(ordersToShare) {
  if (!Array.isArray(ordersToShare) || !ordersToShare.length) {
    toast('មិនមានទិន្នន័យសម្រាប់ Share IMG ទេ។', 'error');
    return;
  }

  const html2canvas = await ensureHtml2Canvas();
  toast('Preparing Share IMG...', 'info');
  const stage = document.createElement('div');
  stage.className = 'share-capture-stage';
  stage.style.position = 'fixed';
  stage.style.left = '-99999px';
  stage.style.top = '0';
  stage.style.zIndex = '-1';
  stage.innerHTML = `<style>${getShareReceiptStyles()}</style><div class="share-capture-shell">${ordersToShare.map((order) => buildShareReceiptHTML(order)).join('')}</div>`;
  document.body.appendChild(stage);

  try {
    await waitForImages(stage);
    const shell = stage.querySelector('.share-capture-shell');
    const canvas = await html2canvas(shell, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: shell.scrollWidth,
      windowHeight: shell.scrollHeight
    });
    const dataUrl = canvas.toDataURL('image/png');
    const filename = `orders_${new Date().toISOString().slice(0, 10)}.png`;

    if (navigator.canShare && navigator.share) {
      const file = dataUrlToFile(dataUrl, filename);
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Orders (${ordersToShare.length})`,
          files: [file]
        });
        toast('Share IMG ready.', 'success');
        return;
      }
    }

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast('Share IMG downloaded as PNG.', 'success');
  } catch (error) {
    console.error(error);
    toast(error.message || 'Share IMG failed.', 'error');
  } finally {
    stage.remove();
  }
}

function printOrdersCollection(rows, title = 'Print Orders') {
  if (!Array.isArray(rows) || !rows.length) {
    toast('មិនមានទិន្នន័យសម្រាប់ព្រីនទេ។', 'error');
    return;
  }
  const html = rows.map((order, index) => buildPrintInvoiceHTML(order, index, rows.length)).join('');
  openPrintWindow(title, html);
}

function printSelectedOrders() {
  const rows = getFilteredOrders().filter((order) => selectedIds.has(order.id));
  if (!rows.length) return toast('សូមជ្រើសរើស row មុនសិន', 'error');
  const preparedRows = applyListPrintSettings(rows);
  if (!preparedRows.length) return toast('មិនមានទិន្នន័យសម្រាប់ព្រីនទេ។', 'error');
  printOrdersCollection(preparedRows, `Print ${preparedRows.length} Orders`);
}

function printFilteredOrders() {
  const rows = getTopActionRows();
  if (!rows.length) return toast('មិនមានទិន្នន័យក្រោយ filter សម្រាប់ព្រីនទេ។', 'error');
  const preparedRows = applyListPrintSettings(rows);
  if (!preparedRows.length) return toast('មិនមានលេខ receipt ត្រូវព្រីនទេ។', 'error');
  printOrdersCollection(preparedRows, `Print ${preparedRows.length} Orders`);
}

async function shareCurrentOrderAsImage() {
  const order = readOrderFromForm();
  if (!(order.products || []).some((p) => p.name)) return toast('សូមបញ្ចូលផលិតផលជាមុនសិន។', 'error');
  try {
    const prepared = [{ ...order, receiptNo: order.receiptNo || '', showQrEnabled: order.showQrEnabled !== false }];
    await sharePreparedOrdersAsImage(prepared);
  } catch (error) {
    toast(error.message || 'Share មិនបានទេ', 'error');
  }
}

async function shareFilteredOrdersAsImage() {
  try {
    const rows = getTopActionRows();
    if (!rows.length) return toast('មិនមានទិន្នន័យក្រោយ filter សម្រាប់ Share IMG ទេ។', 'error');
    const preparedRows = applyListPrintSettings(rows);
    if (!preparedRows.length) return toast('មិនមានលេខ receipt ត្រូវ Share ទេ។', 'error');
    await sharePreparedOrdersAsImage(preparedRows);
  } catch (error) {
    toast(error.message || 'Share មិនបានទេ', 'error');
  }
}

loadOrders().then(() => {
  initDateFilter();
  render();
  startRealtimeSync();
});


function buildTemplateReceiptData(order) {
  const safeOrder = order || {};
  const items = (safeOrder.products || []).filter((item) => item && item.name).map((item) => ({
    product: item.name || '-',
    qty: Number(item.qty || 0),
    price: Number(item.price || 0),
    discount: Number(item.discount || 0),
    subtotal: calcSubtotal(item)
  }));
  const subtotal = items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
  const deliveryFee = Math.max(0, Number(safeOrder.deliveryFee || 0));
  const grandTotal = subtotal + deliveryFee;
  const qrMeta = getSelectedQrMeta(safeOrder);
  const fullAddress = [(safeOrder.address || '').trim(), (safeOrder.province || '').trim()].filter(Boolean).join(' : ') || '-';

  return {
    title: 'វិក័យប័ត្រ',
    date: formatDateForShare(safeOrder.date),
    customer: (safeOrder.customer || '-').trim() || '-',
    phone: (safeOrder.phone || '-').trim() || '-',
    address: fullAddress,
    deliveryName: (safeOrder.deliveryName || '-').trim() || '-',
    note: (safeOrder.note || '-').trim() || '-',
    page: (safeOrder.page || '-').trim() || '-',
    closeBy: (safeOrder.closeBy || '-').trim() || '-',
    payment: (safeOrder.payment || '-').trim() || '-',
    receiptNo: (safeOrder.receiptNo || '').trim(),
    servicePhone: '015 58 68 78 / 089 58 68 78',
    qrImage: qrMeta?.src || '',
    qrLabel: qrMeta?.label || ((safeOrder.payment || '').trim() || '-'),
    accountName: qrMeta?.name || 'CHEA CHANROTHA',
    items,
    subtotal,
    deliveryFee,
    grandTotal,
    grandRiel: Math.round(grandTotal * EXCHANGE_RATE)
  };
}

async function copyCurrentOrderText() {
  const order = readOrderFromForm();
  if (!(order.products || []).some((line) => line.name)) {
    toast('សូមបញ្ចូលផលិតផលជាមុនសិន។', 'error');
    return;
  }

  try {
    if (window.CopyReceipt) {
      await CopyReceipt.copy(buildTemplateReceiptData(order));
    } else {
      const text = buildCopyReceiptText(order);
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-99999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
    }

    toast('Copy Text បានជោគជ័យ', 'success');
    const btn = qs('copyDetailBtn');
    if (btn) {
      const original = btn.dataset.originalText || btn.textContent;
      btn.dataset.originalText = original;
      btn.textContent = 'Copied ✓';
      btn.classList.add('copy-success');
      clearTimeout(btn._copyTimer);
      btn._copyTimer = setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove('copy-success');
      }, 1800);
    }
  } catch (error) {
    console.error(error);
    toast(error?.message || 'Copy មិនបានទេ', 'error');
  }
}

async function shareCurrentOrderAsImage() {
  const order = readOrderFromForm();
  if (!(order.products || []).some((line) => line.name)) {
    toast('សូមបញ្ចូលផលិតផលជាមុនសិន។', 'error');
    return;
  }

  const btn = qs('shareDetailBtn');
  const original = btn ? (btn.dataset.originalText || btn.textContent) : 'Share IMG';

  try {
    if (btn) {
      btn.dataset.originalText = original;
      btn.disabled = true;
      btn.textContent = 'Preparing...';
    }

    if (window.ShareReceipt) {
      await ShareReceipt.share(buildTemplateReceiptData(order), {
        target: qs('printArea') || document.getElementById('printArea'),
        fileName: `share-receipt-${Date.now()}.png`,
        title: 'Receipt',
        text: 'Receipt image'
      });
    } else {
      const blob = await captureOrderImageBlob(order);
      const fileName = `share-receipt-${Date.now()}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: 'Receipt', files: [file] });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1200);
      }
    }

    toast('Share IMG បានជោគជ័យ', 'success');
  } catch (error) {
    console.error(error);
    toast(error?.name === 'AbortError' ? 'បានបោះបង់ Share' : (error?.message || 'Share IMG failed.'), 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = original;
    }
  }
}


/* ===== FINAL Share IMG override (single receipt via share-receipt.js) ===== */
function buildListTemplateReceiptData() {
  const rows = getTopActionRows();
  if (!rows.length) return null;
  const preparedRows = applyListPrintSettings(rows);
  if (!preparedRows.length) return null;
  const order = preparedRows[0];
  return buildTemplateReceiptData(order);
}

async function shareFilteredOrdersAsImage() {
  const btn = qs('shareImageBtn');
  const original = btn ? (btn.dataset.originalText || btn.textContent) : 'Share IMG';
  try {
    const data = buildListTemplateReceiptData();
    if (!data) {
      toast('មិនមានទិន្នន័យសម្រាប់ Share IMG ទេ។', 'error');
      return;
    }

    if (!window.ShareReceipt) {
      throw new Error('share-receipt.js is missing.');
    }

    if (btn) {
      btn.dataset.originalText = original;
      btn.disabled = true;
      btn.textContent = 'Preparing...';
    }

    await ShareReceipt.share(data, {
      target: qs('printArea') || document.getElementById('printArea'),
      fileName: `share-receipt-${Date.now()}.png`,
      title: 'Receipt',
      text: 'Receipt image'
    });

    toast('Share IMG ready.', 'success');
  } catch (error) {
    console.error(error);
    toast(error?.message || 'Share មិនបានទេ', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = original;
    }
  }
}

async function shareCurrentOrderAsImage() {
  const order = readOrderFromForm();
  if (!(order.products || []).some((line) => line.name)) {
    toast('សូមបញ្ចូលផលិតផលជាមុនសិន។', 'error');
    return;
  }

  const btn = qs('shareDetailBtn');
  const original = btn ? (btn.dataset.originalText || btn.textContent) : 'Share IMG';
  try {
    if (!window.ShareReceipt) {
      throw new Error('share-receipt.js is missing.');
    }

    if (btn) {
      btn.dataset.originalText = original;
      btn.disabled = true;
      btn.textContent = 'Preparing...';
    }

    await ShareReceipt.share(buildTemplateReceiptData(order), {
      target: qs('printArea') || document.getElementById('printArea'),
      fileName: `share-receipt-${Date.now()}.png`,
      title: 'Receipt',
      text: 'Receipt image'
    });

    toast('Share IMG ready.', 'success');
  } catch (error) {
    console.error(error);
    toast(error?.message || 'Share មិនបានទេ', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = original;
    }
  }
}
