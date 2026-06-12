/**
 * CAMBO MINI — Google Apps Script v3.1
 * ════════════════════════════════════════
 * Features:
 *  • Save Order → SaleOrder sheet (flat rows, newest at TOP)
 *  • Auto stock deduction (Stroke sheet) — ឈុត / កេស / លាយ
 *  • StrokeHistory daily snapshot at 11:58 PM Cambodia time
 *  • Low-stock Telegram alert at 7:00 AM & 6:00 PM
 *  • Telegram order receipt on every new order
 *  • Order CRUD: add / update / delete
 *  • onOpen() — Auto setup triggers ពេលបើក Sheet
 * ════════════════════════════════════════
 */

/* ════════════════════════════════════════
   AUTO TRIGGER SETUP — runs when Sheet opens
   គ្មានអ្វីត្រូវ Run ដោយដៃទៀតទេ!
   ════════════════════════════════════════ */
function onOpen() {
  autoSetupTriggers_();
}

/**
 * ពិនិត្យ Trigger មានឬអត់ — បើអត់ → បង្កើតភ្លាម
 * Safe to call multiple times (idempotent)
 */
function autoSetupTriggers_() {
  const existing = ScriptApp.getProjectTriggers().map(function(t) {
    return t.getHandlerFunction();
  });

  // 7:00 AM — Low stock alert
  if (!existing.includes('sendLowStockAlert_7am_')) {
    ScriptApp.newTrigger('sendLowStockAlert_7am_')
      .timeBased().atHour(7).everyDays(1).inTimezone(TZ).create();
    Logger.log('✅ Trigger created: sendLowStockAlert_7am_');
  }

  // 6:00 PM — Low stock alert
  if (!existing.includes('sendLowStockAlert_6pm_')) {
    ScriptApp.newTrigger('sendLowStockAlert_6pm_')
      .timeBased().atHour(18).everyDays(1).inTimezone(TZ).create();
    Logger.log('✅ Trigger created: sendLowStockAlert_6pm_');
  }

  // 11:58 PM — Daily stock snapshot
  if (!existing.includes('backupStrokeHistory_')) {
    ScriptApp.newTrigger('backupStrokeHistory_')
      .timeBased().atHour(23).nearMinute(58).everyDays(1).inTimezone(TZ).create();
    Logger.log('✅ Trigger created: backupStrokeHistory_');
  }
}

// Wrapper functions (trigger requires unique names)
function sendLowStockAlert_7am_() { sendLowStockAlert_(); }
function sendLowStockAlert_6pm_() { sendLowStockAlert_(); }

/* ── Constants ── */
const SHEET_NAME          = 'SaleOrder';
const STROKE_SHEET        = 'Stock';
const STROKE_HISTORY      = 'StockHistory';
const TELEGRAM_ENABLED    = true;
const BOT_TOKEN           = '8665831170:AAF-affx337A48GnTGHuWRe3wuvPDvtnYdo';
const TELEGRAM_CHAT_ID    = '-1003800250508';
const TZ                  = 'Asia/Phnom_Penh';
const LOW_STOCK_THRESHOLD = 4;

/* ── SaleOrder columns (21 cols) ── */
const HEADER = [
  'DateTime','OrderID','Page','CloseBy','Status',
  'Customer','Phone','Province','Detail Address',
  'DeliveryName','DeliveryFee','Payment','Note',
  'Number','Product','QTY','Unit','Price','Discount','Subtotal','GrandTotal'
];

/* ── Stroke sheet columns (1-based) — ID column added as first column ── */
const STK_COL = { ID:1, PRODUCT:2, TYPE:3, BOX:4, PACK:5, BOTTLES:6, QTY:7 };

/* ── StrokeHistory columns (daily snapshot) ── */
const HIST_HEADER = [
  'DateTime','Product','Type','Box','Pack','Bottles','QTY'
];


/* ════════════════════════════════════════
   HTTP HANDLERS
   ════════════════════════════════════════ */
function doGet(e) {
  try {
    const action = String((e && e.parameter && e.parameter.action) || 'status').trim();
    if (action === 'status')        return jsonOutput_({ ok:true, status:'running', message:'CAMBO MINI v3.1 is working.' });
    if (action === 'list')          return jsonOutput_({ ok:true, orders: listOrders_() });
    if (action === 'stroke')        return jsonOutput_({ ok:true, stroke: listStroke_() });
    if (action === 'stock_history') return jsonOutput_(listStrokeHistory_(e));
    if (action === 'products')      return jsonOutput_({ ok:true, products: listProducts_() });
    // ── Debug: test write directly via GET ──
    if (action === 'test_write') {
      const name = String((e && e.parameter && e.parameter.name) || '').trim();
      const box  = Number((e && e.parameter && e.parameter.box)  || 0);
      if (!name) return jsonOutput_({ ok:false, message:'Missing name param' });
      try {
        strokeUpdate_(name, { product:name, type:'', box:box, pack:0, bottles:0, qty:box });
        return jsonOutput_({ ok:true, message:'Updated "'+name+'" box='+box });
      } catch(err) {
        return jsonOutput_({ ok:false, message:err.message });
      }
    }
    return jsonOutput_({ ok:false, message:'Unknown action' });
  } catch(err) { return jsonOutput_({ ok:false, message: err.message || String(err) }); }
}

/* Handle CORS preflight OPTIONS — allows Vercel / any origin to POST */
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    const raw  = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    const body = JSON.parse(raw);
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

    /* Update product name / price in NewOrder sheet */
    if (action === 'updateProduct') {
      updateProduct_(body.id, body.data || {});
      return jsonOutput_({ ok:true });
    }

    /* Add new product row to NewOrder sheet */
    if (action === 'addProduct') {
      const newId = addProduct_(body.data || {});
      return jsonOutput_({ ok:true, id:newId });
    }

    /* Delete a product row from NewOrder sheet by ID */
    if (action === 'deleteProduct') {
      deleteProduct_(body.id);
      return jsonOutput_({ ok:true });
    }

    /* Legacy payload — no action field (from new-order.html submitOrder) */
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
  if (sheet.getLastRow() > 1) sheet.insertRowsBefore(2, rows.length);
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
  if (sheet.getLastRow() > 1) sheet.insertRowsBefore(2, rows.length);
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

/**
 * listProducts_ — Read product catalogue from NewOrder sheet
 * Columns: A=ID, B=Products, C=Type, D=Price, E=Sale, F=Box, G=Pack, H=QTY, I=Description, J=URL
 */
/**
 * addProduct_ — Append a new product row to NewOrder sheet with auto ID
 * Category prefix: Drink→A, Face→B, Body→C, Hair→D, Other→E
 */
function addProduct_(data) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('NewOrder');
  if (!sheet) throw new Error('NewOrder sheet not found');

  const catPrefix = { 'Drink':'A', 'Drinks':'A', 'Face':'B', 'Face Care':'B',
                      'Body':'C', 'Body Care':'C', 'Hair':'D', 'Hair Care':'D' };
  const letter = catPrefix[data.type] || catPrefix[data.category] || 'E';
  const prefix = 'CAMBO-' + letter + '-';

  const lastRow = sheet.getLastRow();
  let maxNum = 0;
  if (lastRow > 1) {
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    ids.forEach(function(r) {
      const id = String(r[0]);
      if (id.startsWith(prefix)) {
        const num = parseInt(id.slice(prefix.length)) || 0;
        if (num > maxNum) maxNum = num;
      }
    });
  }

  const newId = prefix + String(maxNum + 1).padStart(3, '0');
  sheet.appendRow([
    newId,
    safe_(data.name),
    safe_(data.type || data.category || ''),
    toNumber_(data.price) || 0,
    toNumber_(data.sale)  || 1,
    toNumber_(data.box)   || 1,
    toNumber_(data.pack)  || 0,
    toNumber_(data.qty)   || 0,
    safe_(data.description || ''),
    safe_(data.url || '')
  ]);
  return newId;
}

/**
 * updateProduct_ — Update Name and/or Price in NewOrder sheet by ID
 * Columns: A=ID, B=Products(name), D=Price
 */
function updateProduct_(id, data) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('NewOrder');
  if (!sheet) throw new Error('NewOrder sheet not found');
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === String(id).trim()) {
      const row = i + 2;
      if (data.name  !== undefined && data.name  !== '') sheet.getRange(row, 2).setValue(data.name);
      if (data.price !== undefined && data.price !== '') sheet.getRange(row, 4).setValue(Number(data.price));
      if (data.sale  !== undefined) sheet.getRange(row, 5).setValue(Number(data.sale)  || 1);
      if (data.box   !== undefined) sheet.getRange(row, 6).setValue(Number(data.box)   || 1);
      if (data.pack  !== undefined) sheet.getRange(row, 7).setValue(Number(data.pack)  || 0);
      if (data.qty   !== undefined) sheet.getRange(row, 8).setValue(Number(data.qty)   || 0);
      return;
    }
  }
}

/**
 * deleteProduct_ — Delete a product row from NewOrder sheet by ID
 */
function deleteProduct_(id) {
  if (!id) return;
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('NewOrder');
  if (!sheet) throw new Error('NewOrder sheet not found');
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = ids.length - 1; i >= 0; i--) {
    if (String(ids[i][0]).trim() === String(id).trim()) {
      sheet.deleteRow(i + 2);
      return;
    }
  }
}

function listProducts_() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('NewOrder');
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  const data = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
  return data
    .filter(function(r) { return safe_(r[0]) && safe_(r[1]); })
    .map(function(r) {
      return {
        id:          safe_(r[0]),
        name:        safe_(r[1]),
        type:        safe_(r[2]),
        price:       toNumber_(r[3]),
        sale:        toNumber_(r[4]),
        box:         toNumber_(r[5]),
        pack:        toNumber_(r[6]),
        qty:         toNumber_(r[7]),
        description: safe_(r[8]),
        url:         safe_(r[9])
      };
    });
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
        grandTotal:toNumber_(row[20]),
        products:[], items:[]
      };
    }
    const item = {
      number  : toNumber_(row[13]),
      name    : safe_(row[14]), product: safe_(row[14]),
      qty     : toNumber_(row[15]),
      unit    : safe_(row[16]),
      price   : toNumber_(row[17]),
      discount: toNumber_(row[18]),
      subtotal: toNumber_(row[19])
    };
    groups[orderId].products.push(item);
    groups[orderId].items.push(item);
    const gt = toNumber_(row[20]);
    if (gt > 0) groups[orderId].grandTotal = gt;
  });
  return Object.values(groups).sort((a,b) => String(b.dateTime).localeCompare(String(a.dateTime)));
}


/* ════════════════════════════════════════
   STROKE (STOCK) FUNCTIONS
   ════════════════════════════════════════ */

/**
 * deductStroke_ — កាត់ស្តុកដោយស្វ័យប្រវត្តិ បន្ទាប់ពី order save
 *
 * Stroke columns (1-based): PRODUCT=1, TYPE=2, BOX=3, PACK=4, BOTTLES=5, QTY=6
 *
 * Unit rules:
 *   ឈុត (default) → ដក PACK (col 4) → recalc BOX & BOTTLES & QTY
 *   កេស           → ដក BOX  (col 3) → recalc PACK & BOTTLES & QTY
 *   លាយ           → ដក BOTTLES (col 5) → recalc PACK & BOX & QTY
 */
function deductStroke_(products, orderId) {
  if (!products || !products.length) return;

  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(STROKE_SHEET);
  if (!sheet) return;

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  const data = sheet.getRange(2, 1, lastRow - 1, 7).getValues();

  products.forEach(function(item) {
    const orderName = normalizeForMatch_(safe_(item.name || item.product));
    const qty       = toNumber_(item.qty);
    const unit      = safe_(item.unit || 'ឈុត');
    if (!qty || !orderName) return;

    for (let i = 0; i < data.length; i++) {
      const stockName = normalizeForMatch_(safe_(data[i][STK_COL.PRODUCT - 1]));
      if (!stockMatch_(orderName, stockName)) continue;

      const rowNum = i + 2; // 1-based sheet row

      // Current values
      const curBox  = Math.max(0, toNumber_(data[i][STK_COL.BOX     - 1])); // col C
      const curPack = Math.max(0, toNumber_(data[i][STK_COL.PACK    - 1])); // col D
      const curBott = Math.max(0, toNumber_(data[i][STK_COL.BOTTLES - 1])); // col E

      // Derive ratios from existing data
      const ppb = (curBox  > 0 && curPack > 0) ? Math.round(curPack / curBox)  : 1; // packs per box
      const bpp = (curPack > 0 && curBott > 0) ? Math.round(curBott / curPack) : 1; // bottles per pack

      let newBox, newPack, newBott;

      if (unit === 'កេស') {
        // ដក BOX
        newBox  = Math.max(0, curBox  - qty);
        newPack = newBox * ppb;
        newBott = newPack * bpp;

      } else if (unit === 'លាយ') {
        // ដក BOTTLES
        newBott = Math.max(0, curBott - qty);
        newPack = bpp > 0 ? Math.floor(newBott / bpp) : 0;
        newBox  = ppb > 0 ? Math.floor(newPack  / ppb) : 0;

      } else {
        // ឈុត (default) — ដក PACK
        newPack = Math.max(0, curPack - qty);
        newBox  = ppb > 0 ? Math.floor(newPack / ppb) : 0;
        newBott = newPack * bpp;
      }

      // Write BOX(D), PACK(E), BOTTLES(F), QTY(G) ក្នុងតែ 1 call
      sheet.getRange(rowNum, STK_COL.BOX, 1, 4).setValues([[newBox, newPack, newBott, newBox]]);

      // Update local cache
      data[i][STK_COL.BOX     - 1] = newBox;
      data[i][STK_COL.PACK    - 1] = newPack;
      data[i][STK_COL.BOTTLES - 1] = newBott;
      data[i][STK_COL.QTY     - 1] = newBox;

      Logger.log('[Stock] ' + safe_(data[i][STK_COL.PRODUCT - 1]) + ' | ' + unit + ' -' + qty +
                 ' | Box:' + newBox + ' Pack:' + newPack + ' Bott:' + newBott);
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

  const data = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
  const now  = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss');

  const histSheet = ensureStrokeHistorySheet_();

  const rows = data
    .filter(function(row) { return !!safe_(row[STK_COL.PRODUCT - 1]); })
    .map(function(row) {
      return [
        now,
        safe_(row[STK_COL.PRODUCT  - 1]),  // Product (col B)
        safe_(row[STK_COL.TYPE     - 1]),  // Type    (col C)
        toNumber_(row[STK_COL.BOX  - 1]),  // Box
        toNumber_(row[STK_COL.PACK - 1]),  // Pack
        toNumber_(row[STK_COL.BOTTLES-1]), // Bottles
        toNumber_(row[STK_COL.QTY  - 1])   // QTY
      ];
    });

  if (!rows.length) return;

  const histLastRow = histSheet.getLastRow();
  if (histLastRow > 1) histSheet.insertRowsBefore(2, rows.length);
  histSheet.getRange(2, 1, rows.length, HIST_HEADER.length).setValues(rows);

  Logger.log('✅ Stroke backup done: ' + rows.length + ' products at ' + now);
}

/**
 * sendLowStockAlert_ — ផ្ញើ Telegram ពេលស្តុកជិតអស់
 * Triggered at 7:00 AM & 6:00 PM Cambodia time
 */
function sendLowStockAlert_() {
  if (!TELEGRAM_ENABLED || !BOT_TOKEN || !TELEGRAM_CHAT_ID) return;

  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(STROKE_SHEET);
  if (!sheet) return;

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  const data    = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
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
    Logger.log('[' + now + '] No low stock items.'); return;
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
    { method:'post', contentType:'application/json',
      payload: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: lines.join('\n') }),
      muteHttpExceptions: true }
  );
  Logger.log('[' + now + '] Low stock alert sent.');
}


/* ════════════════════════════════════════
   STROKE HELPER FUNCTIONS
   ════════════════════════════════════════ */
function strokeUpdate_(originalName, data) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(STROKE_SHEET);
  if (!sheet) throw new Error('Stroke sheet not found');
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) throw new Error('No data in Stroke sheet');
  const names = sheet.getRange(2, STK_COL.PRODUCT, lastRow - 1, 1).getValues().flat();
  const normOrig = normalizeForMatch_(safe_(originalName));

  // Pass 1: exact match
  for (let i = 0; i < names.length; i++) {
    if (safe_(names[i]) === safe_(originalName)) {
      _writeStrokeRow_(sheet, i + 2, originalName, data);
      return;
    }
  }
  // Pass 2: fuzzy match (same logic as deductStroke_)
  for (let i = 0; i < names.length; i++) {
    const normName = normalizeForMatch_(safe_(names[i]));
    if (stockMatch_(normOrig, normName)) {
      _writeStrokeRow_(sheet, i + 2, originalName, data);
      return;
    }
  }
  throw new Error('Product not found: ' + originalName);
}

function _writeStrokeRow_(sheet, rowNum, originalName, data) {
  const box = toNumber_(data.box != null ? data.box : data.qty);
  const existingId = safe_(sheet.getRange(rowNum, STK_COL.ID).getValue());
  const id = existingId || findProductIdByName_(safe_(data.product || originalName)) || '';
  sheet.getRange(rowNum, 1, 1, 7).setValues([[
    id,
    safe_(data.product || originalName),
    safe_(data.type   || ''),
    box,
    toNumber_(data.pack),
    toNumber_(data.bottles),
    box   // QTY = BOX
  ]]);
}

function strokeAdd_(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(STROKE_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(STROKE_SHEET);
    sheet.getRange(1, 1, 1, 7).setValues([['ID','Products','Types','Box','Pack','Bottles','QTY']]);
    sheet.setFrozenRows(1);
  }
  const box  = toNumber_(data.box || data.qty);
  const name = safe_(data.product || data.name || '');
  const id   = findProductIdByName_(name) || '';
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, 7).setValues([[
    id, name,
    safe_(data.type || data.cat || ''),
    box,
    toNumber_(data.pack),
    toNumber_(data.bottles),
    box
  ]]);
}

function strokeDelete_(name) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(STROKE_SHEET);
  if (!sheet) return;
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;
  const names = sheet.getRange(2, STK_COL.PRODUCT, lastRow - 1, 1).getValues().flat();
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
  const data = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
  return data.map(function(row) {
    return {
      id:      safe_(row[STK_COL.ID      - 1]),
      product: safe_(row[STK_COL.PRODUCT - 1]),
      type:    safe_(row[STK_COL.TYPE    - 1]),
      box:     toNumber_(row[STK_COL.BOX     - 1]),
      pack:    toNumber_(row[STK_COL.PACK    - 1]),
      bottles: toNumber_(row[STK_COL.BOTTLES - 1]),
      qty:     toNumber_(row[STK_COL.QTY     - 1])
    };
  }).filter(function(r) { return !!r.product; });
}

/**
 * listStrokeHistory_ — ទាញទិន្នន័យ StockHistory តាម date range
 * Called by doGet when action=stock_history
 * Params: start=YYYY-MM-DD, end=YYYY-MM-DD (optional)
 */
function listStrokeHistory_(e) {
  const start = String((e && e.parameter && e.parameter.start) || '').trim();
  const end   = String((e && e.parameter && e.parameter.end)   || '').trim();

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(STROKE_HISTORY); // 'StockHistory'
  if (!sh) return { ok:false, message:'StockHistory sheet not found' };

  const lastRow = sh.getLastRow();
  if (lastRow <= 1) return { ok:true, history:[] };

  // Read all rows (skip header row 1)
  const data = sh.getRange(2, 1, lastRow - 1, 7).getValues();

  const history = [];
  data.forEach(function(r) {
    const rawDate = r[0]; // Column A = DateTime
    if (!rawDate) return;

    // Parse DateTime → YYYY-MM-DD
    let ds = '';
    try {
      if (rawDate instanceof Date) {
        ds = Utilities.formatDate(rawDate, TZ, 'yyyy-MM-dd');
      } else {
        const str = String(rawDate).trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
          ds = str.slice(0, 10); // "2026-06-01 23:59:41" → "2026-06-01"
        } else {
          // "6/1/2026 23:59:41" → parse via Date
          ds = Utilities.formatDate(new Date(str), TZ, 'yyyy-MM-dd');
        }
      }
    } catch(err) { return; }

    if (!ds) return;

    // Filter by date range
    if (start && ds < start) return;
    if (end   && ds > end)   return;

    history.push({
      date:    ds,
      product: safe_(r[1]),      // Column B = Product
      type:    safe_(r[2]),      // Column C = Type
      box:     toNumber_(r[3]),  // Column D = Box
      pack:    toNumber_(r[4]),  // Column E = Pack
      bottles: toNumber_(r[5]),  // Column F = Bottles
      qty:     toNumber_(r[6])   // Column G = QTY
    });
  });

  return { ok:true, history:history };
}

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

/** Normalize name for fuzzy matching */
function normalizeForMatch_(name) {
  return String(name || '').toLowerCase()
    .replace(/\s+/g,'')
    .replace(/[()（）]/g,'')
    .replace(/\(កេស\)|\(លាយ\)/g,''); // strip unit suffix
}

/** Fuzzy match: exact → contains → 70% character overlap */
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
   Run ONCE manually:
   Apps Script → ជ្រើស setupTimeTriggers_ → ▶ Run
   ════════════════════════════════════════ */
function setupTimeTriggers_() {
  // Delete all existing triggers first
  ScriptApp.getProjectTriggers().forEach(function(t) { ScriptApp.deleteTrigger(t); });

  // 7:00 AM — Low stock alert
  ScriptApp.newTrigger('sendLowStockAlert_')
    .timeBased().atHour(7).everyDays(1).inTimezone(TZ).create();

  // 6:00 PM — Low stock alert
  ScriptApp.newTrigger('sendLowStockAlert_')
    .timeBased().atHour(18).everyDays(1).inTimezone(TZ).create();

  // 11:58 PM — Daily stock snapshot
  ScriptApp.newTrigger('backupStrokeHistory_')
    .timeBased().atHour(23).nearMinute(58).everyDays(1).inTimezone(TZ).create();

  Logger.log('✅ Triggers setup: 7AM alert | 6PM alert | 11:58PM backup');
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
  const grandTotal  = (order.grandTotal != null && order.grandTotal !== '')
    ? toNumber_(order.grandTotal)
    : calcGrandTotal_(products, deliveryFee);

  return products.map((line, idx) => {
    const qty      = toNumber_(line.qty);
    const price    = toNumber_(line.price);
    const discount = toNumber_(line.discount);
    const unit     = safe_(line.unit || 'ឈុត');
    const subtotal = (line.subtotal != null && line.subtotal !== '')
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
      qty, unit, price, discount, subtotal,
      idx === 0 ? grandTotal : 0   // GrandTotal on first row only
    ];
  });
}

function normalizeLegacyPayloadToOrder_(payload) {
  return {
    id:           safe_(payload.id),
    dateTime:     payload.date || payload.createdAt || '', // prefer local date (DD/MM/YYYY) over UTC createdAt
    page:         safe_(payload.page),
    closeBy:      safe_(payload.closeBy),
    status:       safe_(payload.status || 'Pending'),
    customer:     safe_(payload.customer),
    phone:        safe_(payload.phone),
    province:     safe_(payload.province),
    address:      safe_(payload.addressDetail),
    detailAddress:safe_(payload.addressDetail),
    addressDetail:safe_(payload.addressDetail),
    deliveryName: safe_(payload.delivery),
    deliveryFee:  toNumber_(payload.deliveryFee),
    payment:      safe_(payload.payment),
    note:         safe_(payload.note),
    grandTotal:   toNumber_(payload.total),
    receiptNo:    safe_(payload.receiptNo || ''),
    items: (payload.items || []).map(function(item) {
      const qty      = toNumber_(item.qty);
      const price    = toNumber_(item.price);
      const discount = toNumber_(item.discount);
      return {
        name:     safe_(item.name || item.product),
        qty, price, discount,
        unit:     safe_(item.unit || 'ឈុត'),
        subtotal: (item.subtotal != null && item.subtotal !== '')
          ? toNumber_(item.subtotal)
          : Math.max(0, qty * price - discount)
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
    const match = safe_(id).match(new RegExp('^ORD-' + todayKey + '-(\\d{3,})$'));
    if (match) maxNum = Math.max(maxNum, Number(match[1]));
  });
  return prefix + String(maxNum + 1).padStart(3, '0');
}

function calcGrandTotal_(products, deliveryFee) {
  return products.reduce((sum, line) =>
    sum + Math.max(0, toNumber_(line.qty) * toNumber_(line.price) - toNumber_(line.discount)), 0
  ) + toNumber_(deliveryFee);
}

function normalizeDateTime_(value) {
  if (!value) return Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy HH:mm');
  // JS Date object → format in Cambodia TZ
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime()))
    return Utilities.formatDate(value, TZ, 'dd/MM/yyyy HH:mm');
  const text = String(value).trim();
  // Already DD/MM/YYYY → keep as-is
  if (/^\d{2}\/\d{2}\/\d{4}/.test(text)) return text;
  // ISO UTC string (e.g. "2026-05-31T22:20:00.000Z") → convert to Cambodia local
  if (/^\d{4}-\d{2}-\d{2}T/.test(text)) {
    try {
      const d = new Date(text);
      if (!isNaN(d.getTime())) return Utilities.formatDate(d, TZ, 'dd/MM/yyyy HH:mm');
    } catch(e) {}
  }
  // YYYY-MM-DD only → convert
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const p = text.split('-');
    return p[2]+'/'+p[1]+'/'+p[0]+' 00:00';
  }
  return text;
}

function formatDateOnly_(value) {
  const text = safe_(value);
  // DD/MM/YYYY ... → return DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}/.test(text)) return text.substring(0, 10);
  // YYYY-MM-DD ... → return YYYY-MM-DD (for backwards compat, though new data won't use this)
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : text;
}

function toNumber_(value) { const n = Number(value); return isNaN(n) ? 0 : n; }

/* ════════════════════════════════════════
   PUBLIC WRAPPERS — visible in Apps Script dropdown
   ════════════════════════════════════════ */
function migrateStockAddIdColumn() { migrateStockAddIdColumn_(); }
function syncStockIds()            { syncStockIds_(); }

/**
 * fixStockIds — Re-match all Stock IDs using TYPE-AWARE matching.
 * Clears all existing IDs and re-matches by: Type category first → then name fuzzy match.
 * Run this to fix wrong IDs caused by cross-category fuzzy mismatches.
 */
function fixStockIds() {
  const ss         = SpreadsheetApp.getActiveSpreadsheet();
  const stockSheet = ss.getSheetByName(STROKE_SHEET);
  const noSheet    = ss.getSheetByName('NewOrder');
  if (!stockSheet || !noSheet) { Logger.log('❌ Sheet not found'); return; }

  const stockLast = stockSheet.getLastRow();
  const noLast    = noSheet.getLastRow();
  if (stockLast <= 1 || noLast <= 1) { Logger.log('No data'); return; }

  // Map Type strings → category letter
  const typeToLetter = {
    'drinks':'A','drink':'A',
    'face care':'B','face':'B',
    'body care':'C','body':'C',
    'hair care':'D','hair':'D'
  };

  // Read NewOrder: col A=ID, B=Name, C=Type
  const noData = noSheet.getRange(2, 1, noLast - 1, 3).getValues();

  // Build category buckets from NewOrder
  const buckets = { A:[], B:[], C:[], D:[], E:[] };
  noData.forEach(function(r) {
    const id   = safe_(r[0]);
    const name = safe_(r[1]);
    const type = safe_(r[2]).toLowerCase();
    if (!id || !name) return;
    const letter = typeToLetter[type] || 'E';
    buckets[letter].push({ id:id, norm:normalizeForMatch_(name) });
  });

  // Read Stock: col A=ID, B=Products(name), C=Types
  const stockData = stockSheet.getRange(2, 1, stockLast - 1, 3).getValues();

  let updated = 0, notFound = 0;
  for (let i = 0; i < stockData.length; i++) {
    const stockName = safe_(stockData[i][1]);  // col B
    const stockType = safe_(stockData[i][2]).toLowerCase(); // col C
    if (!stockName) continue;

    // Clear existing ID first
    stockSheet.getRange(i + 2, 1).setValue('');

    const letter  = typeToLetter[stockType] || 'E';
    const bucket  = buckets[letter];
    const normStk = normalizeForMatch_(stockName);

    // 1) Exact match within category
    let matched = '';
    for (let j = 0; j < bucket.length; j++) {
      if (bucket[j].norm === normStk) { matched = bucket[j].id; break; }
    }

    // 2) Contains match within category
    if (!matched) {
      for (let j = 0; j < bucket.length; j++) {
        if (normStk.includes(bucket[j].norm) || bucket[j].norm.includes(normStk)) {
          matched = bucket[j].id; break;
        }
      }
    }

    // 3) 70% overlap within category
    if (!matched) {
      for (let j = 0; j < bucket.length; j++) {
        const shorter = normStk.length < bucket[j].norm.length ? normStk : bucket[j].norm;
        const longer  = normStk.length < bucket[j].norm.length ? bucket[j].norm : normStk;
        let hits = 0;
        for (let k = 0; k < shorter.length; k++) {
          if (longer.includes(shorter[k])) hits++;
        }
        if (shorter.length > 0 && hits / shorter.length >= 0.75) {
          matched = bucket[j].id; break;
        }
      }
    }

    if (matched) {
      stockSheet.getRange(i + 2, 1).setValue(matched);
      Logger.log('✅ [' + stockType + '] ' + stockName + ' → ' + matched);
      updated++;
    } else {
      Logger.log('⚠️ No match [' + stockType + ']: ' + stockName);
      notFound++;
    }
  }

  Logger.log('════ fixStockIds done ════');
  Logger.log('Updated: ' + updated + ' | Not found: ' + notFound);
}
function safe_(value) { return value == null ? '' : String(value).trim(); }

/**
 * findProductIdByName_ — ស្វែងរក ID ពី NewOrder sheet ដោយ match ឈ្មោះ
 */
function findProductIdByName_(name) {
  if (!name) return '';
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('NewOrder');
  if (!sheet) return '';
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return '';
  const data     = sheet.getRange(2, 1, lastRow - 1, 2).getValues(); // A=ID, B=Name
  const normName = normalizeForMatch_(name);
  for (let i = 0; i < data.length; i++) {
    if (stockMatch_(normalizeForMatch_(safe_(data[i][1])), normName)) {
      return safe_(data[i][0]);
    }
  }
  return '';
}

/**
 * migrateStockAddIdColumn_ — Run ONCE to insert ID column (A) into Stock sheet
 * and fill IDs by matching product names with NewOrder sheet.
 *
 * ▶ Steps:
 *   1. Insert new column A in Stock sheet
 *   2. Set header "ID" in A1
 *   3. Match each product name → NewOrder → fill ID
 *
 * ⚠️ Run this function ONCE manually from Apps Script editor!
 */
function migrateStockAddIdColumn_() {
  const ss         = SpreadsheetApp.getActiveSpreadsheet();
  const stockSheet = ss.getSheetByName(STROKE_SHEET);
  if (!stockSheet) { Logger.log('❌ Stock sheet not found'); return; }

  // Check if ID column already exists (avoid double-migration)
  const firstHeader = safe_(stockSheet.getRange(1, 1).getValue());
  if (firstHeader === 'ID') {
    Logger.log('✅ ID column already exists — running syncStockIds_ instead');
    syncStockIds_();
    return;
  }

  // Insert column A → shifts existing A→B, B→C, etc.
  stockSheet.insertColumnBefore(1);
  stockSheet.getRange(1, 1).setValue('ID');
  Logger.log('✅ Inserted ID column in Stock sheet');

  // Now sync IDs
  syncStockIds_();
}

/**
 * syncStockIds_ — Match each Stock row to NewOrder by name and fill ID column.
 * Safe to run multiple times — skips rows that already have an ID.
 */
function syncStockIds_() {
  const ss          = SpreadsheetApp.getActiveSpreadsheet();
  const stockSheet  = ss.getSheetByName(STROKE_SHEET);
  const noSheet     = ss.getSheetByName('NewOrder');
  if (!stockSheet)  { Logger.log('❌ Stock sheet not found');    return; }
  if (!noSheet)     { Logger.log('❌ NewOrder sheet not found'); return; }

  const stockLastRow = stockSheet.getLastRow();
  const noLastRow    = noSheet.getLastRow();
  if (stockLastRow <= 1 || noLastRow <= 1) { Logger.log('No data to sync'); return; }

  // Read NewOrder: col A=ID, col B=Name
  const noData = noSheet.getRange(2, 1, noLastRow - 1, 2).getValues();

  // Read Stock: col A=ID, col B=Products
  const stockData = stockSheet.getRange(2, 1, stockLastRow - 1, 2).getValues();

  let updated = 0, skipped = 0, notFound = 0;
  for (let i = 0; i < stockData.length; i++) {
    const currentId  = safe_(stockData[i][0]); // col A = ID
    const stockName  = safe_(stockData[i][1]); // col B = Products
    if (currentId) { skipped++; continue; }    // already has ID

    const normStock = normalizeForMatch_(stockName);
    let matched = false;
    for (let j = 0; j < noData.length; j++) {
      if (stockMatch_(normalizeForMatch_(safe_(noData[j][1])), normStock)) {
        stockSheet.getRange(i + 2, 1).setValue(safe_(noData[j][0]));
        Logger.log('✅ ' + stockName + ' → ' + safe_(noData[j][0]));
        updated++;
        matched = true;
        break;
      }
    }
    if (!matched) { Logger.log('⚠️ No match: ' + stockName); notFound++; }
  }
  Logger.log('════ syncStockIds_ done ════');
  Logger.log('Updated: ' + updated + ' | Skipped (had ID): ' + skipped + ' | Not found: ' + notFound);
}

/**
 * testWrite_ — Run this ONCE manually to authorize Apps Script to write to Sheet
 * Apps Script Editor → Select "testWrite_" → ▶ Run → Allow permissions
 */
function testWrite_() {
  try {
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(STROKE_SHEET);
    if (!sheet) {
      Logger.log('❌ Sheet "' + STROKE_SHEET + '" NOT FOUND!');
      Logger.log('Available sheets: ' + ss.getSheets().map(function(s){return s.getName();}).join(', '));
      return;
    }
    Logger.log('✅ Sheet found: "' + sheet.getName() + '"');
    Logger.log('✅ Total rows: ' + sheet.getLastRow());

    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const rows = sheet.getRange(2, 1, Math.min(3, lastRow - 1), 7).getValues();
      rows.forEach(function(r, i) {
        Logger.log('Row ' + (i+2) + ': ID:' + r[0] + ' | ' + r[1] + ' | Box:' + r[3] + ' Pack:' + r[4]);
      });
    }
    Logger.log('✅ Authorization OK — Stock save will work now!');
  } catch(err) {
    Logger.log('❌ Error: ' + err.message);
  }
}
function jsonOutput_(payload) {
  // NOTE: Apps Script ContentService does not support custom response headers.
  // CORS is handled by deploying as "Anyone, even anonymous" and using
  // text/plain Content-Type on the client side to avoid OPTIONS preflight.
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
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
    // Convert 24H time → 12H AM/PM
    function to12h(t) {
      const m = t.match(/(\d{1,2}):(\d{2})/);
      if (!m) return t;
      var h = parseInt(m[1], 10), min = m[2];
      var ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return String(h).padStart(2,'0') + ':' + min + ' ' + ampm;
    }
    // YYYY-MM-DD HH:MM → DD/MM/YYYY HH:MM AM/PM
    if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
      const p = text.substring(0,10).split('-');
      const datePart = p[2]+'/'+p[1]+'/'+p[0];
      const timePart = text.substring(11,16);
      return timePart ? datePart + ' ' + to12h(timePart) : datePart;
    }
    // DD/MM/YYYY HH:MM → DD/MM/YYYY HH:MM AM/PM
    const dtMatch = text.match(/^(\d{2}\/\d{2}\/\d{4})\s+(\d{1,2}:\d{2})/);
    if (dtMatch) return dtMatch[1] + ' ' + to12h(dtMatch[2]);
    return text;
  }

  const items       = Array.isArray(order.products) ? order.products : (order.items || []);
  const dateText    = formatDateText(order.dateTime || order.date);
  const deliveryFee = toNumber_(order.deliveryFee);
  const subtotalSum = items.reduce((sum, item) => {
    const qty = toNumber_(item.qty), price = toNumber_(item.price);
    const sub = (item.subtotal != null && item.subtotal !== '')
      ? toNumber_(item.subtotal) : Math.max(0, qty*price - toNumber_(item.discount));
    return sum + sub;
  }, 0);
  const total     = (order.grandTotal != null && order.grandTotal !== '')
    ? Number(order.grandTotal) : subtotalSum + deliveryFee;
  const totalRiel = Math.round(total * 4100);

  const lines = [];
  lines.push('🧾 វិក័យប័ត្រ 📅 ' + dateText);
  lines.push(SEP);
  lines.push('👤 ឈ្មោះ:\t'          + (safe_(order.customer)                              || '-'));
  lines.push('📞 លេខទូរសព្ទ:\t'     + (safe_(order.phone)                                 || '-'));
  lines.push('📍 ទីតាំង:\t'          + (safe_(order.address || order.detailAddress || order.addressDetail) || '-'));
  lines.push('🚚 អ្នកដឹកជញ្ជូន:\t'  + (safe_(order.deliveryName || order.delivery)        || '-'));
  lines.push('📝 Note:\t\t'          + (safe_(order.note)                                  || '-'));
  lines.push(SEP);
  lines.push('📦 ផលិតផល:');
  lines.push(SEP);

  items.forEach(function(item, index) {
    const qty      = toNumber_(item.qty);
    const price    = toNumber_(item.price);
    const unit     = safe_(item.unit || 'ឈុត');
    const subtotal = (item.subtotal != null && item.subtotal !== '')
      ? toNumber_(item.subtotal) : Math.max(0, qty*price - toNumber_(item.discount));
    lines.push((index+1) + '. ' + (safe_(item.name || item.product) || '-'));
    lines.push('   ចំនួន ' + qty + ' ' + unit + ' x ' + money(price) + '  = ' + money(subtotal));
  });

  lines.push(SEP);
  lines.push('💵 សរុបទំនិញ: '  + money(subtotalSum));
  lines.push('🚛 សេវាដឹក: '    + (deliveryFee === 0 ? 'ហ្វ្រីដឹក' : money(deliveryFee)));
  lines.push('💳 ការទូទាត់: '  + (safe_(order.payment) || '-'));
  lines.push('💰 តម្លៃសរុប: '  + money(total));
  lines.push('🇰🇭 ប្រាក់រៀល: ' + totalRiel.toLocaleString('en-US') + '៛');
  lines.push(SEP);
  lines.push('📄 Page: ' + (safe_(order.page)||'-') + ' | CloseBy: ' + (safe_(order.closeBy)||'-'));
  lines.push('☎️ 015 58 68 78 / 089 58 68 78');
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
