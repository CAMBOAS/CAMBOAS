// ═══════════════════════════════════════════════════════════════════
//  CAMBO MINI — Google Apps Script
//  Spreadsheet : "Data Sale Product"
//  Sheets      : Orders | Stroke | StrokeHistory
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
//  ENTRY POINT
// ═══════════════════════════════════════════════════════════════════
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000); // wait up to 15s to avoid race conditions

    var payload = JSON.parse(e.postData.contents);

    // 1. Save the order
    var orderResult = saveOrder(payload);

    // 2. Deduct stock for every item in the order
    var stockResult = deductStock(payload);

    lock.releaseLock();

    var telegramResult = { ok: true };
    // 3. Send Telegram if any low-stock alert was raised
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

// GET: health-check OR ?action=list to return orders
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || '';

  if (action === 'list') {
    return listOrders(e);
  }

  return _json({ ok: true, message: 'CAMBO MINI API is running.' });
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

  // Format date cell to "DD/MM/YYYY HH:MM" using script's LOCAL timezone.
  // Google Sheets returns Date objects for date-formatted cells — using
  // String(dateObj) would give UTC which is wrong for Cambodia (UTC+7).
  function formatDate(v) {
    if (!v) return '';
    if (v instanceof Date) {
      var pad = function(n){ return String(n).padStart(2,'0'); };
      return pad(v.getDate())+'/'+pad(v.getMonth()+1)+'/'+v.getFullYear()
            +' '+pad(v.getHours())+':'+pad(v.getMinutes());
    }
    return String(v);
  }

  // Header order (1-based in sheet, 0-based in data row):
  // 1=OrderID 2=Date 3=Status 4=Customer 5=Phone 6=Province
  // 7=Address 8=Delivery 9=DeliveryFee 10=Payment 11=Page
  // 12=CloseBy 13=Note 14=Items(JSON) 15=Subtotal 16=Total
  // 17=TotalRiel 18=ReceiptNo 19=CreatedAt
  var orders = [];
  for (var i = data.length - 1; i >= 0; i--) {  // newest first
    var row = data[i];
    var rowStatus = String(row[2] || '').trim();
    if (status && rowStatus.toLowerCase() !== status.toLowerCase()) continue;

    var itemsRaw = row[13];
    var items = [];
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
//  2. DEDUCT STOCK
// ═══════════════════════════════════════════════════════════════════
function deductStock(payload) {
  var sheet = SS.getSheetByName(SHEET_STROKE);
  if (!sheet) throw new Error('Sheet "' + SHEET_STROKE + '" not found.');

  var items = payload.items || [];
  if (items.length === 0) return { updated: [], notFound: [], alerts: [] };

  // Read entire sheet once (faster than repeated getRange calls)
  var lastRow  = sheet.getLastRow();
  var lastCol  = Math.max(sheet.getLastColumn(), 3);
  var allData  = lastRow > 1
    ? sheet.getRange(2, 1, lastRow - 1, lastCol).getValues()  // skip header row 1
    : [];

  // Build a lookup map: normalized-name → row-index (0-based in allData)
  var nameMap = {};
  allData.forEach(function (row, i) {
    var name = String(row[1]).trim(); // Column B = Product Name
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

    var currentQty  = Number(allData[rowIdx][2]) || 0; // Column C = QTY
    var orderedQty  = Math.max(0, Number(item.qty) || 0);
    var newQty      = Math.max(0, currentQty - orderedQty);

    // Write new QTY back (row index in sheet = rowIdx + 2 because header is row 1)
    var sheetRow = rowIdx + 2;
    sheet.getRange(sheetRow, 3).setValue(newQty); // Column C

    // Log to StrokeHistory
    logToStrokeHistory({
      orderId    : payload.id,
      type       : String(allData[rowIdx][0]).trim(), // Column A
      productName: String(allData[rowIdx][1]).trim(), // Column B (original)
      deducted   : orderedQty,
      remaining  : newQty,
      unit       : item.unit  || '',
      price      : item.price || 0,
      timestamp  : new Date()
    });

    // Low-stock check: remaining < 30% of stock before this order
    var stockBefore = currentQty;
    if (stockBefore > 0 && newQty / stockBefore < LOW_STOCK_PCT) {
      alerts.push({
        name     : String(allData[rowIdx][1]).trim(),
        type     : String(allData[rowIdx][0]).trim(),
        remaining: newQty,
        pct      : Math.round((newQty / stockBefore) * 100)
      });
    }

    updated.push({
      name     : searchName,
      deducted : orderedQty,
      remaining: newQty
    });
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
//  4. TELEGRAM LOW-STOCK ALERT  (hook — fill TELEGRAM_TOKEN above)
// ═══════════════════════════════════════════════════════════════════
function sendLowStockAlert(alerts, orderId) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
    // Token not configured — skip silently
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

  var message = lines.join('\n');
  var url = 'https://api.telegram.org/bot' + TELEGRAM_TOKEN + '/sendMessage';

  try {
    var response = UrlFetchApp.fetch(url, {
      method     : 'post',
      contentType: 'application/json',
      payload    : JSON.stringify({
        chat_id   : TELEGRAM_CHAT_ID,
        text      : message,
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
    // Style header row
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold').setBackground('#4a4a9c').setFontColor('#ffffff');
  }
  return sheet;
}

/** Return a JSON ContentService output. */
function _json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
