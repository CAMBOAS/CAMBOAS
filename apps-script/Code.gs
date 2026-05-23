// ═══════════════════════════════════════════════════════════════════
//  CAMBO MINI — Google Apps Script
//  Spreadsheet : "Data Sale Product"
//  Sheets      : Orders | Stroke | StrokeHistory
//
//  Stroke sheet column layout (A–G):
//    A = Type (ប្រភេទ)
//    B = Product Name (ផលិតផល)
//    C = QTY / Box count  ← decremented by deductStock()
//    D = Pack (ឈុត)
//    E = Bottles (ដប/ប្រអប់)
//    F = Ratio text  e.g. "1 ឈុត = 3 ដបប្រអប់"
//    G = PackPerBox  (ឈុត per box — base multiplier)
// ═══════════════════════════════════════════════════════════════════

// ── Config ──────────────────────────────────────────────────────────
var SS             = SpreadsheetApp.getActiveSpreadsheet();
var SHEET_ORDERS   = 'Orders';          // existing orders sheet
var SHEET_STROKE   = 'Stroke';          // stock sheet
var SHEET_HISTORY  = 'StrokeHistory';   // stock deduction log

var LOW_STOCK_PCT  = 0.30;             // alert threshold (30%)

// ── Telegram Config (fill in your values) ───────────────────────────
var TELEGRAM_TOKEN   = '';   // e.g. '123456:ABC-DEFghijkl...'
var TELEGRAM_CHAT_ID = '';   // e.g. '-1001234567890'


// ═══════════════════════════════════════════════════════════════════
//  ENTRY POINT — POST
//  Routes on payload.action:
//    (empty / undefined) → save order + deduct stock  (existing flow)
//    'stroke_update'     → update one row in Stroke sheet
//    'stroke_add'        → append a new row to Stroke sheet
//    'stroke_delete'     → delete a row from Stroke sheet
// ═══════════════════════════════════════════════════════════════════
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

    var payload = JSON.parse(e.postData.contents);
    var action  = String(payload.action || '').trim();

    // ── Stock management actions ──────────────────────────────────
    if (action === 'stroke_update') {
      var result = updateStroke(payload);
      lock.releaseLock();
      return _json(result);
    }

    if (action === 'stroke_add') {
      var result = addStroke(payload);
      lock.releaseLock();
      return _json(result);
    }

    if (action === 'stroke_delete') {
      var result = deleteStroke(payload);
      lock.releaseLock();
      return _json(result);
    }

    // ── Default: save order + deduct stock ────────────────────────
    var orderResult = saveOrder(payload);
    var stockResult = deductStock(payload);

    lock.releaseLock();

    var telegramResult = { ok: true };
    if (stockResult.alerts && stockResult.alerts.length > 0) {
      telegramResult = sendLowStockAlert(stockResult.alerts, payload.id);
    }

    return _json({
      ok      : true,
      message : 'Order saved. Stock updated.',
      orderId : orderResult.orderId,
      stock   : stockResult,
      telegram: telegramResult
    });

  } catch (err) {
    try { lock.releaseLock(); } catch (_) {}
    return _json({ ok: false, message: err.message });
  }
}


// ═══════════════════════════════════════════════════════════════════
//  ENTRY POINT — GET
//    ?action=list    → list orders  (existing)
//    ?action=stroke  → list all stock rows
//    (none)          → health check
// ═══════════════════════════════════════════════════════════════════
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || '';

  if (action === 'list') {
    return listOrders(e);
  }

  if (action === 'stroke') {
    return listStroke();
  }

  return _json({ ok: true, message: 'CAMBO MINI API is running.' });
}


// ═══════════════════════════════════════════════════════════════════
//  STOCK — LIST  (?action=stroke)
//  Returns every non-empty row from the Stroke sheet.
// ═══════════════════════════════════════════════════════════════════
function listStroke() {
  var sheet = SS.getSheetByName(SHEET_STROKE);
  if (!sheet) return _json({ ok: false, message: 'Stroke sheet not found.' });

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return _json({ ok: true, stroke: [] });

  var lastCol = Math.max(sheet.getLastColumn(), 7);
  var data    = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  var stroke = data
    .filter(function (row) { return String(row[1] || '').trim() !== ''; })
    .map(function (row) {
      return {
        product   : String(row[1] || '').trim(),
        type      : String(row[0] || '').trim(),
        qty       : Number(row[2] || 0),
        box       : Number(row[2] || 0),   // same column as qty
        pack      : Number(row[3] || 0),
        bottles   : Number(row[4] || 0),
        ratio     : String(row[5] || '').trim(),
        packPerBox: Number(row[6] || 0)
      };
    });

  return _json({ ok: true, stroke: stroke });
}


// ═══════════════════════════════════════════════════════════════════
//  STOCK — UPDATE  (POST action:'stroke_update')
//  Finds the row by originalName (or data.product) and overwrites it.
// ═══════════════════════════════════════════════════════════════════
function updateStroke(payload) {
  var sheet = SS.getSheetByName(SHEET_STROKE);
  if (!sheet) return { ok: false, message: 'Stroke sheet not found.' };

  var d            = payload.data || {};
  var originalName = String(payload.originalName || d.product || '').trim();
  if (!originalName) return { ok: false, message: 'No product name provided.' };

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { ok: false, message: 'No rows in Stroke sheet.' };

  var names   = sheet.getRange(2, 2, lastRow - 1, 1).getValues(); // column B only
  var rowIdx  = -1;
  for (var i = 0; i < names.length; i++) {
    if (String(names[i][0] || '').trim().toLowerCase() === originalName.toLowerCase()) {
      rowIdx = i;
      break;
    }
  }
  if (rowIdx < 0) {
    return { ok: false, message: 'Product "' + originalName + '" not found in Stroke sheet.' };
  }

  var sheetRow = rowIdx + 2;
  var qty      = (d.qty !== undefined) ? Number(d.qty) : Number(d.box || 0);
  sheet.getRange(sheetRow, 1, 1, 7).setValues([[
    String(d.type    || ''),
    String(d.product || originalName),
    qty,
    Number(d.pack       || 0),
    Number(d.bottles    || 0),
    String(d.ratio      || ''),
    Number(d.packPerBox || 0)
  ]]);

  return { ok: true, message: 'Stock updated.' };
}


// ═══════════════════════════════════════════════════════════════════
//  STOCK — ADD  (POST action:'stroke_add')
//  Appends a new row (creates the sheet + headers if missing).
// ═══════════════════════════════════════════════════════════════════
function addStroke(payload) {
  var sheet = _getOrCreateSheet(SHEET_STROKE,
    ['Type', 'Product Name', 'QTY', 'Pack', 'Bottles', 'Ratio', 'PackPerBox']);

  var d = payload.data || {};
  if (!String(d.product || '').trim()) {
    return { ok: false, message: 'No product name provided.' };
  }

  var qty = (d.qty !== undefined) ? Number(d.qty) : Number(d.box || 0);
  sheet.appendRow([
    String(d.type    || ''),
    String(d.product),
    qty,
    Number(d.pack       || 0),
    Number(d.bottles    || 0),
    String(d.ratio      || ''),
    Number(d.packPerBox || 0)
  ]);

  return { ok: true, message: 'Product added to Stroke sheet.' };
}


// ═══════════════════════════════════════════════════════════════════
//  STOCK — DELETE  (POST action:'stroke_delete')
//  Deletes the first row whose column-B matches payload.name.
// ═══════════════════════════════════════════════════════════════════
function deleteStroke(payload) {
  var sheet = SS.getSheetByName(SHEET_STROKE);
  if (!sheet) return { ok: false, message: 'Stroke sheet not found.' };

  var name    = String(payload.name || '').trim();
  if (!name)  return { ok: false, message: 'No product name provided.' };

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { ok: false, message: 'No rows in Stroke sheet.' };

  var names = sheet.getRange(2, 2, lastRow - 1, 1).getValues(); // column B only
  // Iterate bottom-up so row deletions don't shift indices
  for (var i = names.length - 1; i >= 0; i--) {
    if (String(names[i][0] || '').trim().toLowerCase() === name.toLowerCase()) {
      sheet.deleteRow(i + 2);
      return { ok: true, message: 'Deleted "' + name + '".' };
    }
  }

  return { ok: false, message: 'Product "' + name + '" not found in Stroke sheet.' };
}


// ═══════════════════════════════════════════════════════════════════
//  LIST ORDERS  (?action=list&limit=500&status=Pending)
// ═══════════════════════════════════════════════════════════════════
function listOrders(e) {
  var sheet = SS.getSheetByName(SHEET_ORDERS);
  if (!sheet) return _json({ ok: false, message: 'Orders sheet not found.' });

  var limit  = parseInt((e.parameter && e.parameter.limit) || '500') || 500;
  var status = (e.parameter && e.parameter.status) || '';

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return _json({ ok: true, orders: [] });

  var lastCol = Math.max(sheet.getLastColumn(), 19);
  var data    = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  function formatDate(v) {
    if (!v) return '';
    if (v instanceof Date) {
      var pad = function(n){ return String(n).padStart(2,'0'); };
      return pad(v.getDate())+'/'+pad(v.getMonth()+1)+'/'+v.getFullYear()
            +' '+pad(v.getHours())+':'+pad(v.getMinutes());
    }
    return String(v);
  }

  var orders = [];
  for (var i = data.length - 1; i >= 0; i--) {
    var row       = data[i];
    var rowStatus = String(row[2] || '').trim();
    if (status && rowStatus.toLowerCase() !== status.toLowerCase()) continue;

    var itemsRaw = row[13];
    var items    = [];
    try { items = JSON.parse(itemsRaw || '[]'); } catch (_) {}

    orders.push({
      id:            String(row[0]  || ''),
      date:          formatDate(row[1]),
      status:        rowStatus,
      customer:      String(row[3]  || ''),
      phone:         String(row[4]  || ''),
      province:      String(row[5]  || ''),
      addressDetail: String(row[6]  || ''),
      delivery:      String(row[7]  || ''),
      deliveryName:  String(row[7]  || ''),
      deliveryFee:   Number(row[8]  || 0),
      payment:       String(row[9]  || ''),
      page:          String(row[10] || ''),
      closeBy:       String(row[11] || ''),
      note:          String(row[12] || ''),
      items:         items,
      products:      items,
      itemsTotal:    Number(row[14] || 0),
      total:         Number(row[15] || 0),
      totalRiel:     Number(row[16] || 0),
      receiptNo:     String(row[17] || ''),
      createdAt:     String(row[18] || '')
    });

    if (orders.length >= limit) break;
  }

  return _json({ ok: true, orders: orders });
}


// ═══════════════════════════════════════════════════════════════════
//  1. SAVE ORDER
// ═══════════════════════════════════════════════════════════════════
function saveOrder(payload) {
  var sheet = _getOrCreateSheet(SHEET_ORDERS, [
    'Order ID','Date','Status','Customer','Phone',
    'Province','Address','Delivery','Delivery Fee',
    'Payment','Page','CloseBy','Note',
    'Items (JSON)','Subtotal','Total','Total Riel',
    'Receipt No','Created At'
  ]);

  var itemsJson = JSON.stringify(payload.items || []);

  sheet.appendRow([
    payload.id          || '',
    payload.date        || '',
    payload.status      || '',
    payload.customer    || '',
    payload.phone       || '',
    payload.province    || '',
    payload.addressDetail || '',
    payload.delivery    || '',
    payload.deliveryFee || 0,
    payload.payment     || '',
    payload.page        || '',
    payload.closeBy     || '',
    payload.note        || '',
    itemsJson,
    payload.itemsTotal  || 0,
    payload.total       || 0,
    payload.totalRiel   || 0,
    payload.receiptNo   || '',
    payload.createdAt   || new Date().toISOString()
  ]);

  return { orderId: payload.id };
}


// ═══════════════════════════════════════════════════════════════════
//  2. DEDUCT STOCK  (called for new orders, NOT for stroke_update)
//  Reads Column C (QTY) from Stroke sheet and decrements ordered qty.
// ═══════════════════════════════════════════════════════════════════
function deductStock(payload) {
  var sheet = SS.getSheetByName(SHEET_STROKE);
  if (!sheet) throw new Error('Sheet "' + SHEET_STROKE + '" not found.');

  var items = payload.items || [];
  if (items.length === 0) return { updated: [], notFound: [], alerts: [] };

  var lastRow  = sheet.getLastRow();
  var lastCol  = Math.max(sheet.getLastColumn(), 3);
  var allData  = lastRow > 1
    ? sheet.getRange(2, 1, lastRow - 1, lastCol).getValues()
    : [];

  // Build lookup: normalised-name → row-index (0-based in allData)
  var nameMap = {};
  allData.forEach(function (row, i) {
    var name = String(row[1]).trim();  // Column B = Product Name
    if (name) nameMap[name.toLowerCase()] = i;
  });

  var updated  = [];
  var notFound = [];
  var alerts   = [];

  items.forEach(function (item) {
    var searchName = String(item.name || '').trim();
    var rowIdx     = nameMap[searchName.toLowerCase()];

    if (rowIdx === undefined) {
      notFound.push(searchName);
      return;
    }

    var currentQty = Number(allData[rowIdx][2]) || 0;  // Column C = QTY
    var orderedQty = Math.max(0, Number(item.qty) || 0);
    var newQty     = Math.max(0, currentQty - orderedQty);

    var sheetRow = rowIdx + 2;
    sheet.getRange(sheetRow, 3).setValue(newQty);  // Column C

    logToStrokeHistory({
      orderId    : payload.id,
      type       : String(allData[rowIdx][0]).trim(),
      productName: String(allData[rowIdx][1]).trim(),
      deducted   : orderedQty,
      remaining  : newQty,
      unit       : item.unit  || '',
      price      : item.price || 0,
      timestamp  : new Date()
    });

    var stockBefore = currentQty;
    if (stockBefore > 0 && newQty / stockBefore < LOW_STOCK_PCT) {
      alerts.push({
        name     : String(allData[rowIdx][1]).trim(),
        type     : String(allData[rowIdx][0]).trim(),
        remaining: newQty,
        pct      : Math.round((newQty / stockBefore) * 100)
      });
    }

    updated.push({ name: searchName, deducted: orderedQty, remaining: newQty });
  });

  return { updated: updated, notFound: notFound, alerts: alerts };
}


// ═══════════════════════════════════════════════════════════════════
//  3. LOG TO STROKEHISTORY
// ═══════════════════════════════════════════════════════════════════
function logToStrokeHistory(data) {
  var sheet = _getOrCreateSheet(SHEET_HISTORY, [
    'Timestamp','Order ID','Type','Product Name',
    'Deducted Qty','Unit','Remaining Qty','Unit Price','Status'
  ]);

  var status = (data.remaining !== undefined && data.remaining <= 0)
    ? 'OUT OF STOCK'
    : (data.remaining / (data.remaining + data.deducted) < LOW_STOCK_PCT
        ? 'LOW STOCK'
        : 'OK');

  sheet.appendRow([
    data.timestamp,
    data.orderId,
    data.type,
    data.productName,
    data.deducted,
    data.unit,
    data.remaining,
    data.price,
    status
  ]);
}


// ═══════════════════════════════════════════════════════════════════
//  4. TELEGRAM LOW-STOCK ALERT  (fill TELEGRAM_TOKEN above to enable)
// ═══════════════════════════════════════════════════════════════════
function sendLowStockAlert(alerts, orderId) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
    return { ok: true, skipped: true };
  }

  var lines = ['⚠️ *CAMBO MINI — Low Stock Alert*'];
  lines.push('Order ID: `' + orderId + '`');
  lines.push('');

  alerts.forEach(function (a) {
    var icon = a.remaining <= 0 ? '🔴' : '🟡';
    lines.push(icon + ' *' + a.name + '*');
    lines.push('   Type: ' + a.type);
    lines.push('   Remaining: *' + a.remaining + '* (' + a.pct + '% left)');
  });

  var url = 'https://api.telegram.org/bot' + TELEGRAM_TOKEN + '/sendMessage';
  try {
    var response = UrlFetchApp.fetch(url, {
      method     : 'post',
      contentType: 'application/json',
      payload    : JSON.stringify({
        chat_id   : TELEGRAM_CHAT_ID,
        text      : lines.join('\n'),
        parse_mode: 'Markdown'
      })
    });
    var result = JSON.parse(response.getContentText());
    return { ok: result.ok, messageId: result.result && result.result.message_id };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}


// ═══════════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════════

/** Return sheet by name, or create it with headers if it doesn't exist. */
function _getOrCreateSheet(name, headers) {
  var sheet = SS.getSheetByName(name);
  if (!sheet) {
    sheet = SS.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold').setBackground('#4a4a9c').setFontColor('#ffffff');
  }
  return sheet;
}

/** Wrap an object as a JSON ContentService output. */
function _json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
