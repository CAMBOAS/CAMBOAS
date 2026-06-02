/**
 * CAMBO MINI — Google Apps Script v3
 * ════════════════════════════════════════
 * NEW in v3:
 *  • Auto stock deduction (Stroke sheet) on order save
 *  • StrokeHistory daily backup at 11:58 PM (newest row at TOP)
 *  • Low-stock Telegram alert at 7:00 AM & 6:00 PM
 *  • Unit column added to CAMBO_ORDERS (ឈុត / កេស / លាយ)
 *  • New orders insert at TOP of sheet (newest first)
 * ════════════════════════════════════════
 */

/* ── Constants ── */
const SHEET_NAME          = 'SaleOrder';
const STROKE_SHEET        = 'Stroke';
const STROKE_HISTORY      = 'StrokeHistory';
const TELEGRAM_ENABLED    = true;
const BOT_TOKEN           = '5839552644:AAFYFyeJXEPYoGwZ3AiKDcYiGcnjl8L1ZGg';
const TELEGRAM_CHAT_ID    = '-1001732018286';
const TZ                  = 'Asia/Phnom_Penh';
const LOW_STOCK_THRESHOLD = 4;

/* ── SaleOrder columns (21 cols) ── */
const HEADER = [
  'DateTime','OrderID','Page','CloseBy','Status',
  'Customer','Phone','Province','Detail Address',
  'DeliveryName','DeliveryFee','Payment','Note',
  'Number','Product','QTY','Unit','Price','Discount','Subtotal','GrandTotal'
];
// Col index map (0-based for row arrays):
// 0:DateTime 1:OrderID 2:Page 3:CloseBy 4:Status
// 5:Customer 6:Phone 7:Province 8:DetailAddress
// 9:DeliveryName 10:DeliveryFee 11:Payment 12:Note
// 13:Number 14:Product 15:QTY 16:Unit 17:Price 18:Discount 19:Subtotal 20:GrandTotal

/* ── Stroke sheet columns (A–F) ── */
const STK_COL = { PRODUCT:1, TYPE:2, BOX:3, PACK:4, BOTTLES:5, QTY:6 };

/* ── StrokeHistory columns (daily backup snapshot only) ── */
const HIST_HEADER = [
  'DateTime','Product','Type','Box','Pack','Bottles','QTY'
];

/* ════════════════════════════════════════
   HTTP HANDLERS
   ════════════════════════════════════════ */
function doGet(e) {
  try {
    const action = String((e && e.parameter && e.parameter.action) || 'status').trim();
    if (action === 'status') return jsonOutput_({ ok:true, status:'running', message:'CAMBO MINI v3 is working.' });
    if (action === 'list')   return jsonOutput_({ ok:true, orders: listOrders_() });
    if (action === 'stroke') return jsonOutput_({ ok:true, stroke: listStroke_() });
    return jsonOutput_({ ok:false, message:'Unknown action' });
  } catch(err) { return jsonOutput_({ ok:false, message: err.message || String(err) }); }
}

function doPost(e) {
  try {
    const body   = e && e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    const action = String(body.action || '').trim();

    if (action === 'add') {
      const saved = addOrder_(body.order || {});
      return jsonOutput_({ ok:true, orderId:saved.orderId, rowsAdded:saved.rowsAdded, telegram:saved.telegram });
    }
    if (action === 'update') {
      const saved = updateOrder_(body.orderId, body.order || {});
      return jsonOutput_({ ok:true, orderId:saved.orderId, rowsAdded:saved.rowsAdded });
    }
    if (action === 'delete') {
      return jsonOutput_({ ok:true, deletedRows: deleteOrder_(body.orderId) });
    }

    /* Stroke (Stock) CRUD */
    if (action === 'stroke_update') {
      strokeUpdate_(body.originalName, body.data || {});
      return jsonOutput_({ ok:true });
    }
    if (action === 'stroke_add') {
      strokeAdd_(body.data || {});
      return jsonOutput_({ ok:true });
    }
    if (action === 'stroke_delete') {
      strokeDelete_(body.name);
      return jsonOutput_({ ok:true });
    }

    /* Legacy payload (no action field) */
    if (!action && body && Array.isArray(body.items) && body.items.length) {
      const normalized = normalizeLegacyPayloadToOrder_(body);
      const saved = addOrder_(normalized, { preserveOrderId:true });
      return jsonOutput_({ ok:true, orderId:saved.orderId, rowsAdded:saved.rowsAdded, telegram:saved.telegram, message:'Saved successfully.' });
    }

    return jsonOutput_({ ok:false, message:'Unknown action' });
  } catch(err) { return jsonOutput_({ ok:false, message: err.message || String(err) }); }
}

/* ════════════════════════════════════════
   ORDER FUNCTIONS
   ════════════════════════════════════════ */
function addOrder_(order, options) {
  options = options || {};
  validateOrder_(order);

  const sheet   = getSheet_();
  const orderId = options.preserveOrderId && safe_(order.id) ? safe_(order.id) : nextOrderId_();
  const rows    = orderToRows_(orderId, order);

  /* Insert at TOP (row 2) so newest order appears first */
  const currentLastRow = sheet.getLastRow();
  if (currentLastRow > 1) {
    sheet.insertRowsBefore(2, rows.length);
  }
  sheet.getRange(2, 1, rows.length, HEADER.length).setValues(rows);

  /* ── Auto stock deduction ── */
  try {
    const products = Array.isArray(order.products) ? order.products : (order.items || []);
    deductStroke_(products, orderId);
  } catch(stockErr) {
    Logger.log('Stock deduction error: ' + stockErr.message);
  }

  /* ── Telegram order receipt ── */
  let telegram = { skipped:true };
  if (TELEGRAM_ENABLED && BOT_TOKEN && TELEGRAM_CHAT_ID) {
    try { telegram = sendTelegramMessageFromOrder_(orderId, order); }
    catch(tgErr) { telegram = { ok:false, message: tgErr.message || String(tgErr) }; }
  }

  return { orderId, rowsAdded: rows.length, telegram };
}

function updateOrder_(orderId, order) {
  validateOrder_(order);
  if (!safe_(orderId)) throw new Error('Missing orderId');
  deleteOrder_(orderId);
  const sheet = getSheet_();
  const rows  = orderToRows_(orderId, order);

  /* Insert at TOP after delete */
  const currentLastRow = sheet.getLastRow();
  if (currentLastRow > 1) {
    sheet.insertRowsBefore(2, rows.length);
  }
  sheet.getRange(2, 1, rows.length, HEADER.length).setValues(rows);
  return { orderId, rowsAdded: rows.length };
}

function deleteOrder_(orderId) {
  if (!safe_(orderId)) throw new Error('Missing orderId');
  const sheet   = getSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 0;
  const ids = sheet.getRange(2, 2, lastRow - 1, 1).getValues().flat();
  let deleted = 0;
  for (let i = ids.length - 1; i >= 0; i--) {
    if (safe_(ids[i]) === safe_(orderId)) { sheet.deleteRow(i + 2); deleted++; }
  }
  return deleted;
}

function listOrders_() {
  const sheet   = getSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  const values = sheet.getRange(2, 1, lastRow - 1, HEADER.length).getDisplayValues();
  const groups = {};
  values.forEach(row => {
    const orderId = safe_(row[1]);
    if (!orderId) return;
    if (!groups[orderId]) {
      groups[orderId] = {
        id:orderId, orderId, dateTime:safe_(row[0]), date:formatDateOnly_(row[0]),
        page:safe_(row[2]), closeBy:safe_(row[3]), status:safe_(row[4]),
        customer:safe_(row[5]), phone:safe_(row[6]), province:safe_(row[7]),
        detailAddress:safe_(row[8]), address:safe_(row[8]),
        deliveryName:safe_(row[9]), deliveryFee:toNumber_(row[10]),
        payment:safe_(row[11]), note:safe_(row[12]),
        grandTotal:toNumber_(row[20]),   // col 20 (was 19 before Unit column added)
        products:[]
      };
    }
    groups[orderId].products.push({
      number:toNumber_(row[13]),
      name:safe_(row[14]), product:safe_(row[14]),
      qty:toNumber_(row[15]),
      unit:safe_(row[16]),             // NEW Unit column
      price:toNumber_(row[17]),
      discount:toNumber_(row[18]),
      subtotal:toNumber_(row[19])
    });
  });
  return Object.values(groups).sort((a,b) => String(b.dateTime).localeCompare(String(a.dateTime)));
}

/* ════════════════════════════════════════
   STROKE (STOCK) FUNCTIONS
   ════════════════════════════════════════ */

/**
 * deductStroke_ — កាត់ស្តុកដោយស្វ័យប្រវត្តិ បន្ទាប់ពី order save
 * Unit logic:
 *   ឈុត  → deduct from QTY column
 *   លាយ  → deduct from QTY column
 *   កេស  → deduct from Box column
 */
function deductStroke_(products, orderId) {
  if (!products || !products.length) return;

  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(STROKE_SHEET);
  if (!sheet) return;

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  const data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();

  products.forEach(function(item) {
    const orderName = normalizeForMatch_(safe_(item.name || item.product));
    const qty       = toNumber_(item.qty);
    const unit      = safe_(item.unit || 'ឈុត');
    if (!qty || !orderName) return;

    for (let i = 0; i < data.length; i++) {
      const stockName = normalizeForMatch_(safe_(data[i][STK_COL.PRODUCT - 1]));
      if (!stockMatch_(orderName, stockName)) continue;

      const rowNum = i + 2;

      if (unit === 'កេស') {
        const boxBefore = toNumber_(data[i][STK_COL.BOX - 1]);
        const boxAfter  = Math.max(0, boxBefore - qty);
        sheet.getRange(rowNum, STK_COL.BOX).setValue(boxAfter);
        data[i][STK_COL.BOX - 1] = boxAfter;
      } else {
        const qtyBefore = toNumber_(data[i][STK_COL.QTY - 1]);
        const qtyAfter  = Math.max(0, qtyBefore - qty);
        sheet.getRange(rowNum, STK_COL.QTY).setValue(qtyAfter);
        data[i][STK_COL.QTY - 1] = qtyAfter;
      }
      break;
    }
  });
}

/**
 * backupStrokeHistory_ — snapshot ស្តុកប្រចាំថ្ងៃ (ម៉ោង 11:58 PM)
 * Insert all backup rows at TOP so newest backup is always first
 */
function backupStrokeHistory_() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(STROKE_SHEET);
  if (!sheet) return;

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  const data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
  const now  = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss');

  const histSheet = ensureStrokeHistorySheet_();

  /* Build all backup rows — columns: DateTime, Product, Type, Box, Pack, Bottles, QTY */
  const rows = data
    .filter(function(row) { return !!safe_(row[0]); })
    .map(function(row) {
      return [
        now,
        safe_(row[0]),      // Product
        safe_(row[1]),      // Type
        toNumber_(row[2]),  // Box
        toNumber_(row[3]),  // Pack
        toNumber_(row[4]),  // Bottles
        toNumber_(row[5])   // QTY
      ];
    });

  if (!rows.length) return;

  /* Insert all at TOP at once */
  const histLastRow = histSheet.getLastRow();
  if (histLastRow > 1) {
    histSheet.insertRowsBefore(2, rows.length);
  }
  histSheet.getRange(2, 1, rows.length, HIST_HEADER.length).setValues(rows);

  Logger.log('Stroke backup done: ' + rows.length + ' products at ' + now);
}

/**
 * sendLowStockAlert_ — ផ្ញើ Telegram ពេលស្តុកជិតអស់
 * Triggered at 7:00 AM & 6:00 PM
 */
function sendLowStockAlert_() {
  if (!TELEGRAM_ENABLED || !BOT_TOKEN || !TELEGRAM_CHAT_ID) return;

  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(STROKE_SHEET);
  if (!sheet) return;

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  const data    = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
  const now     = Utilities.formatDate(new Date(), TZ, 'HH:mm');
  const dateStr = Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy');

  const lowItems = [];
  const outItems = [];

  data.forEach(function(row) {
    const name = safe_(row[STK_COL.PRODUCT - 1]);
    const box  = toNumber_(row[STK_COL.BOX  - 1]);
    const qty  = toNumber_(row[STK_COL.QTY  - 1]);
    if (!name) return;

    if (qty === 0 && box === 0) {
      outItems.push('❌ ' + name + ' — អស់ស្តុក!');
    } else if (box <= LOW_STOCK_THRESHOLD || qty <= LOW_STOCK_THRESHOLD) {
      const parts = [];
      if (box > 0) parts.push('Box: ' + box);
      if (qty > 0) parts.push('QTY: ' + qty);
      lowItems.push('⚠️ ' + name + ' — ' + parts.join(' | '));
    }
  });

  if (!lowItems.length && !outItems.length) {
    Logger.log('[' + now + '] No low stock items.');
    return;
  }

  const SEP   = '................................................';
  const lines = [];
  lines.push('📦 របាយការណ៍ស្តុក CAMBO MINI');
  lines.push('📅 ' + dateStr + ' ⏰ ' + now);
  lines.push(SEP);

  if (outItems.length) {
    lines.push('🔴 ផលិតផលអស់ស្តុក (' + outItems.length + ' មុខ):');
    outItems.forEach(function(l) { lines.push(l); });
    lines.push('');
  }

  if (lowItems.length) {
    lines.push('🟡 ផលិតផលជិតអស់ (≤ ' + LOW_STOCK_THRESHOLD + ') (' + lowItems.length + ' មុខ):');
    lowItems.forEach(function(l) { lines.push(l); });
  }

  lines.push(SEP);
  lines.push('☎️ 015 58 68 78 / 089 58 68 78');

  UrlFetchApp.fetch(
    'https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage',
    {
      method: 'post', contentType: 'application/json',
      payload: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: lines.join('\n') }),
      muteHttpExceptions: true
    }
  );

  Logger.log('[' + now + '] Low stock alert sent: ' + (outItems.length + lowItems.length) + ' items');
}

/* ════════════════════════════════════════
   STROKE HELPER FUNCTIONS
   ════════════════════════════════════════ */

/** Update one row in Stroke sheet by matching product name */
function strokeUpdate_(originalName, data) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(STROKE_SHEET);
  if (!sheet) throw new Error('Stroke sheet not found');
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) throw new Error('No data in Stroke sheet');
  const names = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  for (let i = 0; i < names.length; i++) {
    if (safe_(names[i]) === safe_(originalName)) {
      sheet.getRange(i + 2, 1, 1, 6).setValues([[
        safe_(data.product || originalName),
        safe_(data.type   || ''),
        toNumber_(data.box),
        toNumber_(data.pack),
        toNumber_(data.bottles),
        toNumber_(data.qty)
      ]]);
      return;
    }
  }
  throw new Error('Product not found: ' + originalName);
}

/** Add a new row to Stroke sheet */
function strokeAdd_(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(STROKE_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(STROKE_SHEET);
    sheet.getRange(1, 1, 1, 6).setValues([['Product','Type','Box','Pack','Bottles','QTY']]);
    sheet.setFrozenRows(1);
  }
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, 6).setValues([[
    safe_(data.product || data.name || ''),
    safe_(data.type    || data.cat  || ''),
    toNumber_(data.box),
    toNumber_(data.pack),
    toNumber_(data.bottles),
    toNumber_(data.qty)
  ]]);
}

/** Delete row(s) in Stroke sheet by product name */
function strokeDelete_(name) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(STROKE_SHEET);
  if (!sheet) return;
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;
  const names = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  for (let i = names.length - 1; i >= 0; i--) {
    if (safe_(names[i]) === safe_(name)) sheet.deleteRow(i + 2);
  }
}

function listStroke_() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(STROKE_SHEET);
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  const data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
  return data.map(function(row) {
    return {
      product: safe_(row[0]), type: safe_(row[1]),
      box: toNumber_(row[2]), pack: toNumber_(row[3]),
      bottles: toNumber_(row[4]), qty: toNumber_(row[5])
    };
  }).filter(function(r) { return !!r.product; });
}

/** Ensure StrokeHistory sheet exists with header, return sheet object */
function ensureStrokeHistorySheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(STROKE_HISTORY);
  if (!sheet) {
    sheet = ss.insertSheet(STROKE_HISTORY);
    sheet.getRange(1, 1, 1, HIST_HEADER.length).setValues([HIST_HEADER]);
    sheet.setFrozenRows(1);
  } else if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HIST_HEADER.length).setValues([HIST_HEADER]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}


function normalizeForMatch_(name) {
  return String(name || '').toLowerCase().replace(/\s+/g,'').replace(/[()（）]/g,'');
}

function stockMatch_(orderName, stockName) {
  if (!orderName || !stockName) return false;
  if (orderName === stockName) return true;
  if (orderName.includes(stockName) || stockName.includes(orderName)) return true;
  const shorter = orderName.length < stockName.length ? orderName : stockName;
  const longer  = orderName.length < stockName.length ? stockName : orderName;
  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) matches++;
  }
  return matches / shorter.length >= 0.70;
}

/* ════════════════════════════════════════
   TIME TRIGGERS SETUP
   Run ONCE manually: Extensions → Apps Script → Run → setupTimeTriggers_
   ════════════════════════════════════════ */
function setupTimeTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function(t) { ScriptApp.deleteTrigger(t); });

  /* Low stock alert: 7:00 AM daily */
  ScriptApp.newTrigger('sendLowStockAlert_')
    .timeBased().atHour(7).everyDays(1).inTimezone(TZ).create();

  /* Low stock alert: 6:00 PM daily */
  ScriptApp.newTrigger('sendLowStockAlert_')
    .timeBased().atHour(18).everyDays(1).inTimezone(TZ).create();

  /* Daily stock backup: 11:58 PM */
  ScriptApp.newTrigger('backupStrokeHistory_')
    .timeBased().atHour(23).nearMinute(58).everyDays(1).inTimezone(TZ).create();

  Logger.log('✅ Triggers setup complete: 7AM alert, 6PM alert, 11:58PM backup');
}

/* ════════════════════════════════════════
   ORDER HELPER FUNCTIONS
   ════════════════════════════════════════ */
function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  ensureHeader_(sheet);
  return sheet;
}

function ensureHeader_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADER.length).setValues([HEADER]);
    sheet.setFrozenRows(1); return;
  }
  const existing = sheet.getRange(1, 1, 1, HEADER.length).getValues()[0].map(v => String(v).trim());
  if (!HEADER.every((name, i) => existing[i] === name)) {
    sheet.getRange(1, 1, 1, HEADER.length).setValues([HEADER]);
    sheet.setFrozenRows(1);
  }
}

function orderToRows_(orderId, order) {
  const dateTime = normalizeDateTime_(order.dateTime || order.date || order.createdAt);
  const products = Array.isArray(order.products) && order.products.length
    ? order.products
    : (Array.isArray(order.items) && order.items.length ? order.items : []);

  if (!products.length) throw new Error('No products found.');

  const deliveryFee = toNumber_(order.deliveryFee);
  const grandTotal  = order.grandTotal !== undefined && order.grandTotal !== null && order.grandTotal !== ''
    ? toNumber_(order.grandTotal)
    : calcGrandTotal_(products, deliveryFee);

  return products.map((line, idx) => {
    const qty      = toNumber_(line.qty);
    const price    = toNumber_(line.price);
    const discount = toNumber_(line.discount);
    const unit     = safe_(line.unit || 'ឈុត');
    const subtotal = line.subtotal !== undefined && line.subtotal !== null && line.subtotal !== ''
      ? toNumber_(line.subtotal)
      : Math.max(0, qty * price - discount);

    return [
      dateTime, orderId,
      safe_(order.page), safe_(order.closeBy), safe_(order.status || 'Pending'),
      safe_(order.customer), safe_(order.phone), safe_(order.province),
      safe_(order.address || order.detailAddress || order.addressDetail),
      safe_(order.deliveryName || order.delivery),
      deliveryFee, safe_(order.payment), safe_(order.note),
      idx + 1,
      safe_(line.name || line.product),
      qty,
      unit,       // NEW: Unit column
      price, discount, subtotal, grandTotal
    ];
  });
}

function normalizeLegacyPayloadToOrder_(payload) {
  return {
    id: safe_(payload.id),
    dateTime: payload.createdAt || payload.date || '',
    page:         safe_(payload.page),
    closeBy:      safe_(payload.closeBy),
    status:       safe_(payload.status || 'Pending'),
    customer:     safe_(payload.customer),
    phone:        safe_(payload.phone),
    province:     safe_(payload.province),
    detailAddress: safe_(payload.addressDetail),
    address:      safe_(payload.addressDetail),
    deliveryName: safe_(payload.delivery),
    deliveryFee:  toNumber_(payload.deliveryFee),
    payment:      safe_(payload.payment),
    note:         safe_(payload.note),
    grandTotal:   toNumber_(payload.total),
    receiptNo:    safe_(payload.receiptNo || ''),
    items: (payload.items || []).map(function(item) {
      return {
        name:     safe_(item.name || item.product),
        qty:      toNumber_(item.qty),
        price:    toNumber_(item.price),
        discount: toNumber_(item.discount),
        unit:     safe_(item.unit || 'ឈុត'),
        subtotal: item.subtotal !== undefined && item.subtotal !== null && item.subtotal !== ''
          ? toNumber_(item.subtotal)
          : Math.max(0, toNumber_(item.qty) * toNumber_(item.price) - toNumber_(item.discount))
      };
    })
  };
}

function validateOrder_(order) {
  if (!order || typeof order !== 'object') throw new Error('Missing order');
  const products = Array.isArray(order.products) ? order.products : (Array.isArray(order.items) ? order.items : []);
  if (!products.length) throw new Error('No products found.');
  if (!safe_(order.customer)) throw new Error('Customer is required');
  if (!safe_(order.phone))    throw new Error('Phone is required');
}

function nextOrderId_() {
  const sheet    = getSheet_();
  const lastRow  = sheet.getLastRow();
  const todayKey = Utilities.formatDate(new Date(), TZ, 'yyyyMMdd');
  const prefix   = 'ORD-' + todayKey + '-';
  if (lastRow <= 1) return prefix + '001';
  const ids = sheet.getRange(2, 2, lastRow - 1, 1).getValues().flat();
  let maxNum = 0;
  ids.forEach(id => {
    const text  = safe_(id);
    const match = text.match(new RegExp('^ORD-' + todayKey + '-(\\d{3,})$'));
    if (match) maxNum = Math.max(maxNum, Number(match[1]));
  });
  return prefix + String(maxNum + 1).padStart(3, '0');
}

function calcGrandTotal_(products, deliveryFee) {
  return products.reduce((sum, line) => sum + (toNumber_(line.qty) * toNumber_(line.price) - toNumber_(line.discount)), 0) + toNumber_(deliveryFee);
}

function normalizeDateTime_(value) {
  if (!value) return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss');
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime()))
    return Utilities.formatDate(value, TZ, 'yyyy-MM-dd HH:mm:ss');
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text + ' 00:00:00';
  return text;
}

function formatDateOnly_(value) {
  const text  = safe_(value);
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : text;
}

function toNumber_(value) { const n = Number(value); return isNaN(n) ? 0 : n; }
function safe_(value) { return value == null ? '' : String(value).trim(); }
function jsonOutput_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

/* ════════════════════════════════════════
   TELEGRAM — ORDER RECEIPT
   ════════════════════════════════════════ */
function sendTelegramMessageFromOrder_(orderId, order) {
  const SEP = '................................................';

  function money(n) {
    const num = Number(n || 0), fixed = num.toFixed(2);
    return '$' + (fixed.endsWith('.00') ? fixed.slice(0,-3) : fixed);
  }
  function formatDateText(value) {
    if (!value) return '-';
    const text = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
      const p = text.substring(0,10).split('-');
      return p[2]+'/'+p[1]+'/'+p[0];
    }
    return text;
  }

  const items        = Array.isArray(order.products) ? order.products : (order.items || []);
  const dateText     = formatDateText(order.dateTime || order.date);
  const deliveryFee  = toNumber_(order.deliveryFee);
  const subtotalSum  = items.reduce((sum, item) => {
    const qty = toNumber_(item.qty), price = toNumber_(item.price);
    const sub = item.subtotal !== undefined && item.subtotal !== null && item.subtotal !== ''
      ? toNumber_(item.subtotal) : Math.max(0, qty*price - toNumber_(item.discount));
    return sum + sub;
  }, 0);
  const total     = order.grandTotal !== undefined && order.grandTotal !== null && order.grandTotal !== ''
    ? Number(order.grandTotal) : subtotalSum + deliveryFee;
  const totalRiel = Math.round(total * 4100);

  const lines = [];
  lines.push('🧾 វិក័យប័ត្រ 📅 ' + dateText);
  lines.push(SEP);
  lines.push('👤 ឈ្មោះ:\t'          + (safe_(order.customer)                       || '-'));
  lines.push('📞 លេខទូរសព្ទ:\t'     + (safe_(order.phone)                          || '-'));
  lines.push('📍 ទីតាំង:\t'          + (safe_(order.address || order.detailAddress) || '-'));
  lines.push('🚚 អ្នកដឹកជញ្ជូន:\t'  + (safe_(order.deliveryName)                   || '-'));
  lines.push('📝 Note:\t\t'          + (safe_(order.note)                           || '-'));
  lines.push(SEP);
  lines.push('📦 ផលិតផល:');
  lines.push(SEP);

  items.forEach(function(item, index) {
    const qty      = toNumber_(item.qty);
    const price    = toNumber_(item.price);
    const unit     = safe_(item.unit || 'ឈុត');
    const subtotal = item.subtotal !== undefined && item.subtotal !== null && item.subtotal !== ''
      ? toNumber_(item.subtotal) : Math.max(0, qty*price - toNumber_(item.discount));
    lines.push((index+1) + '. ' + (safe_(item.name || item.product) || '-'));
    lines.push('   ចំនួន ' + qty + ' ' + unit + ' x ' + money(price) + '      = ' + money(subtotal));
  });

  lines.push(SEP);
  lines.push('💵 សរុបទំនិញ: '  + money(subtotalSum));
  lines.push('🚛 សេវាដឹក: '    + (deliveryFee === 0 ? 'ហ្វ្រីដឹក' : money(deliveryFee)));
  lines.push('💳 ការទូទាត់: '  + (safe_(order.payment) || '-'));
  lines.push('💰 តម្លៃសរុប: '  + money(total));
  lines.push('🇰🇭 ប្រាក់រៀល: ' + totalRiel.toLocaleString('en-US') + '៛');
  lines.push(SEP);
  lines.push('📄 Page: ' + (safe_(order.page)||'-') + ' | CloseBy: ' + (safe_(order.closeBy)||'-'));
  lines.push('☎️ លេខបម្រើអតិថិជន: 015 58 68 78 / 089 58 68 78');
  const receiptNo = safe_(order.receiptNo || '');
  if (receiptNo) lines.push('🔢 លេខប៉ុង: ' + receiptNo);
  lines.push(SEP);

  const resp = UrlFetchApp.fetch(
    'https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage',
    { method:'post', contentType:'application/json',
      payload: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: lines.join('\n') }),
      muteHttpExceptions: true }
  );

  const code = resp.getResponseCode();
  if (code < 200 || code >= 300) throw new Error('Telegram send failed: ' + resp.getContentText());
  return { ok:true };
}
