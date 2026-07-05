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

/* ── SaleOrder columns (22 cols) ── */
const HEADER = [
  'DateTime','OrderID','Page','CloseBy','Status',
  'Customer','Phone','Province','Detail Address',
  'DeliveryName','DeliveryFee','Payment','Note',
  'Number','Product','QTY','Unit','Price','Discount','Subtotal','GrandTotal',
  'ProductID'   // col 22 — auto-filled from NewOrder ID on save
];

/* ── Stroke sheet columns (1-based) — ID column added as first column ── */
const STK_COL = { ID:1, PRODUCT:2, TYPE:3, BOX:4, PACK:5, BOTTLES:6, QTY:7, DEF_BOX:8, DEF_PACK:9, DEF_BOTT:10 };

/* ── StrokeHistory columns (daily snapshot) — ID is last for backward compat ── */
const HIST_HEADER = [
  'DateTime','Product','Type','Box','Pack','Bottles','QTY','ID'
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
    if (action === 'saleinfor')     return jsonOutput_({ ok:true, saleinfor: listSaleInfor_() });
    if (action === 'helen_loan_list')  return jsonOutput_({ ok:true, loans: listHelenLoans_() });
    if (action === 'helen_loan_trash') return jsonOutput_({ ok:true, loans: listHelenLoanTrash_() });
    if (action === 'helen_infor')      return jsonOutput_({ ok:true, groups: listHelenInfor_('groups'), statuses: listHelenInfor_('statuses') });
    if (action === 'print_statuses')   return jsonOutput_({ ok:true, statuses: getPrintStatuses_() });
    if (action === 'helen_sheet_url') {
      var ss2  = SpreadsheetApp.getActiveSpreadsheet();
      var sh1  = ss2.getSheetByName(LOAN_SHEET);
      var sh2  = ss2.getSheetByName('HelenLoanT');
      var base = ss2.getUrl();
      return jsonOutput_({
        ok: true,
        loan:  base + '#gid=' + (sh1 ? sh1.getSheetId() : 0),
        loanT: sh2 ? base + '#gid=' + sh2.getSheetId() : base
      });
    }
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
    /* ── Login: verify account/password against Login sheet ── */
    if (action === 'verify_login') {
      const loginSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Login');
      if (!loginSheet) return jsonOutput_({ success: false, message: 'Login sheet not found' });
      const loginData = loginSheet.getDataRange().getValues();
      const acct = String((e.parameter.account  || '')).trim();
      const pass = String((e.parameter.password || '')).trim();
      let matched = false;
      for (let i = 1; i < loginData.length; i++) {
        if (String(loginData[i][0]).trim() === acct && String(loginData[i][1]).trim() === pass) {
          matched = true; break;
        }
      }
      return jsonOutput_({ success: matched });
    }

    /* ── Login: log device info + active date to Login sheet ── */
    if (action === 'log_login') {
      const loginSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Login');
      if (!loginSheet) return jsonOutput_({ success: false });
      const loginData = loginSheet.getDataRange().getValues();
      const acct     = String((e.parameter.account  || '')).trim();
      const device   = String((e.parameter.device   || '')).trim();
      const model    = String((e.parameter.model    || '')).trim();
      const ip       = String((e.parameter.ip       || '')).trim();
      const location = String((e.parameter.location || '')).trim();
      const now    = new Date();
      const dd     = String(now.getDate()).padStart(2,'0');
      const mm     = String(now.getMonth()+1).padStart(2,'0');
      const yyyy   = now.getFullYear();
      const hh     = String(now.getHours()).padStart(2,'0');
      const mi     = String(now.getMinutes()).padStart(2,'0');
      const ss     = String(now.getSeconds()).padStart(2,'0');
      const activeStr = dd + '/' + mm + '/' + yyyy + ' ' + hh + ':' + mi + ':' + ss;
      for (let i = 1; i < loginData.length; i++) {
        if (String(loginData[i][0]).trim() === acct) {
          loginSheet.getRange(i+1, 3).setValue(device);     // C = Device
          loginSheet.getRange(i+1, 4).setValue(model);      // D = Model
          loginSheet.getRange(i+1, 5).setValue(now);        // E = Last Login (datetime)
          loginSheet.getRange(i+1, 6).setValue(activeStr);  // F = Active (date + time)
          loginSheet.getRange(i+1, 7).setValue(ip);         // G = IP
          loginSheet.getRange(i+1, 8).setValue(location);   // H = Location
          break;
        }
      }
      return jsonOutput_({ success: true });
    }

    /* ── Settings: read all key-value rows from Settings sheet ── */
    if (action === 'get_settings') {
      const stSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Settings');
      if (!stSheet) return jsonOutput_({ success: false, message: 'Settings sheet not found' });
      const stData = stSheet.getDataRange().getValues();
      const out = {};
      for (let i = 0; i < stData.length; i++) {
        if (stData[i][0]) out[String(stData[i][0])] = String(stData[i][1]);
      }
      return jsonOutput_({ success: true, data: out });
    }

    /* ── Settings: write key-value rows to Settings sheet ── */
    if (action === 'save_settings') {
      const stSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Settings');
      if (!stSheet) return jsonOutput_({ success: false, message: 'Settings sheet not found' });
      const loginReq  = String((e.parameter.login_required || 'false')).trim();
      const adminAcct = String((e.parameter.admin_account  || '')).trim();
      const adminPass = String((e.parameter.admin_password || '')).trim();
      function setKey_(key, value) {
        const d = stSheet.getDataRange().getValues();
        for (let i = 0; i < d.length; i++) {
          if (String(d[i][0]) === key) { stSheet.getRange(i+1, 2).setValue(value); return; }
        }
        stSheet.appendRow([key, value]);
      }
      setKey_('login_required', loginReq);
      if (adminAcct) setKey_('admin_account', adminAcct);
      if (adminPass) setKey_('admin_password', adminPass);
      setKey_('updated_at', Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy HH:mm'));
      return jsonOutput_({ success: true });
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

    /* Move order to SaleOrderT (Trash) instead of permanent delete */
    if (action === 'trash_order') {
      const result = trashOrder_(body.orderId);
      return jsonOutput_(result);
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

    /* HelenLoan — add new borrower */
    if (action === 'helen_loan_add') {
      addHelenLoan_(body.loan || {});
      return jsonOutput_({ ok:true });
    }

    /* HelenLoan — update existing borrower by DateTime key */
    if (action === 'helen_loan_update') {
      const updated = updateHelenLoan_(body.key, body.loan || {});
      return jsonOutput_({ ok:updated, message: updated ? 'Updated' : 'Row not found' });
    }

    /* HelenLoan — delete borrower by DateTime key */
    if (action === 'helen_loan_delete') {
      const deleted = deleteHelenLoan_(body.key);
      return jsonOutput_({ ok:deleted, message: deleted ? 'Deleted' : 'Row not found' });
    }

    /* HelenLoan — permanently delete borrower from HelenLoanT (no recovery) */
    if (action === 'helen_loan_perm_delete') {
      const done = permDeleteHelenLoan_(body.key);
      return jsonOutput_({ ok:done, message: done ? 'Permanently deleted' : 'Row not found' });
    }

    /* HelenLoan — recover borrower from HelenLoanT back to HelenLoan */
    if (action === 'helen_loan_recover') {
      const recovered = recoverHelenLoan_(body.key);
      return jsonOutput_({ ok:recovered, message: recovered ? 'Recovered' : 'Row not found in trash' });
    }

    /* HelenInfor — add group or status */
    if (action === 'helen_infor_add') {
      const result = addHelenInfor_(body.type, body.value);
      return jsonOutput_(result);
    }

    /* HelenInfor — delete group or status */
    if (action === 'helen_infor_delete') {
      const result = deleteHelenInfor_(body.type, body.value);
      return jsonOutput_(result);
    }

    /* SaleInfor — add item to Province/Delivery/Pages/CloseBy/Payment */
    if (action === 'saleinfor_add') {
      const result = addSaleInfor_(body.type, body.value);
      return jsonOutput_(result);
    }

    /* SaleInfor — delete item */
    if (action === 'saleinfor_delete') {
      const result = deleteSaleInfor_(body.type, body.value);
      return jsonOutput_(result);
    }

    /* Print status — mark order as printed / unprinted */
    if (action === 'set_print_status') {
      setPrintStatus_(body.orderId, body.status);
      return jsonOutput_({ ok:true });
    }

    /* Update SaleOrder Status column (col E) directly */
    if (action === 'update_order_status') {
      updateOrderStatus_(body.orderId, body.status);
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
 * trashOrder_ — Move all rows matching orderId from SaleOrder → SaleOrderT
 * SaleOrderT acts as a Trash bin so data is never permanently lost.
 */
function trashOrder_(orderId) {
  if (!safe_(orderId)) return { ok:false, message:'Missing orderId' };
  const ss       = SpreadsheetApp.getActiveSpreadsheet();
  const src      = ss.getSheetByName('SaleOrder');
  if (!src) return { ok:false, message:'SaleOrder sheet not found' };

  // Get or create SaleOrderT (Trash) sheet
  var dst = ss.getSheetByName('SaleOrderT');
  if (!dst) {
    dst = ss.insertSheet('SaleOrderT');
    // Copy header row
    const header = src.getRange(1, 1, 1, src.getLastColumn()).getValues();
    dst.getRange(1, 1, 1, header[0].length).setValues(header);
  }

  const lastRow = src.getLastRow();
  if (lastRow <= 1) return { ok:false, message:'No data in SaleOrder' };

  const numCols = src.getLastColumn();
  const ids     = src.getRange(2, 2, lastRow - 1, 1).getValues().flat(); // col B = OrderID
  let moved     = 0;

  // Iterate bottom-up so row index stays valid after deleteRow
  for (let i = ids.length - 1; i >= 0; i--) {
    if (safe_(ids[i]) === safe_(orderId)) {
      const srcRow  = i + 2;
      const rowData = src.getRange(srcRow, 1, 1, numCols).getValues();

      // Append to SaleOrderT
      const dstLastRow = dst.getLastRow();
      dst.getRange(dstLastRow + 1, 1, 1, numCols).setValues(rowData);

      // Remove from SaleOrder
      src.deleteRow(srcRow);
      moved++;
    }
  }

  if (moved === 0) return { ok:false, message:'Order not found: ' + orderId };
  return { ok:true, moved: moved, message: moved + ' row(s) moved to SaleOrderT' };
}

/**
 * listProducts_ — Read product catalogue from NewOrder sheet
 * Columns: A=ID, B=Products, C=Type, D=Price, E=Sale, F=Description
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

/**
 * listSaleInfor_ — Read dropdown reference data from SaleInfor sheet
 * Columns: A=Province, B=Delivery, C=Pages, D=CloseBy, E=Payment
 */
function listSaleInfor_() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('SaleInfor');
  if (!sheet) return { provinces:[], delivery:[], pages:[], closeby:[], payment:[], status:[] };
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { provinces:[], delivery:[], pages:[], closeby:[], payment:[], status:[] };
  const numCols = Math.min(sheet.getLastColumn(), 6);
  const data = sheet.getRange(2, 1, lastRow - 1, numCols).getValues();
  const provinces = [], delivery = [], pages = [], closeby = [], payment = [], status = [];
  data.forEach(function(row) {
    if (safe_(row[0])) provinces.push(safe_(row[0]));
    if (safe_(row[1])) delivery.push(safe_(row[1]));
    if (safe_(row[2])) pages.push(safe_(row[2]));
    if (safe_(row[3])) closeby.push(safe_(row[3]));
    if (safe_(row[4])) payment.push(safe_(row[4]));
    if (numCols >= 6 && safe_(row[5])) status.push(safe_(row[5]));
  });
  return { provinces, delivery, pages, closeby, payment, status };
}

function listProducts_() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('NewOrder');
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  const data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
  return data
    .filter(function(r) { return safe_(r[0]) && safe_(r[1]); })
    .map(function(r) {
      return {
        id:          safe_(r[0]),
        name:        safe_(r[1]),
        type:        safe_(r[2]),
        price:       toNumber_(r[3]),
        sale:        toNumber_(r[4]),
        description: safe_(r[5])
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
      number   : toNumber_(row[13]),
      name     : safe_(row[14]), product: safe_(row[14]),
      qty      : toNumber_(row[15]),
      unit     : safe_(row[16]),
      price    : toNumber_(row[17]),
      discount : toNumber_(row[18]),
      subtotal : toNumber_(row[19]),
      productId: safe_(row[21])   // col 22 — auto-filled ProductID
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
 * Stroke columns (1-based): ID=1, PRODUCT=2, TYPE=3, BOX=4, PACK=5, BOTTLES=6, QTY=7
 *
 * Unit rules:
 *   ឈុត (default) → ដក PACK ផ្ទាល់ → recalc BOX & BOTTLES & QTY
 *   កេស           → ដក BOX + ដក PACK (qty×ppb) ផ្ទាល់ → recalc BOTTLES & QTY
 *   លាយ           → ដក BOTTLES ផ្ទាល់ → recalc PACK & BOX & QTY
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
    const orderName   = normalizeForMatch_(safe_(item.name || item.product));
    const orderProdId = safe_(item.productId);
    const qty         = toNumber_(item.qty);
    const unit        = safe_(item.unit || 'ឈុត');
    if (!qty || (!orderName && !orderProdId)) return;

    for (let i = 0; i < data.length; i++) {
      const stockId   = safe_(data[i][STK_COL.ID      - 1]); // col A
      const stockName = normalizeForMatch_(safe_(data[i][STK_COL.PRODUCT - 1]));
      // Match by ID first (exact, reliable) — fall back to fuzzy name only if no ID
      const idMatch   = orderProdId && stockId && orderProdId === stockId;
      if (!idMatch && !stockMatch_(orderName, stockName)) continue;

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
        // ដក BOX + ដក PACK (qty × ppb) ផ្ទាល់ — រក្សា pack ដែលនៅសេសសល់
        newBox  = Math.max(0, curBox  - qty);
        newPack = Math.max(0, curPack - qty * ppb);
        newBott = newPack * bpp;

      } else if (unit === 'លាយ') {
        // ដក BOTTLES ផ្ទាល់
        newBott = Math.max(0, curBott - qty);
        newPack = bpp > 0 ? Math.floor(newBott / bpp) : 0;
        newBox  = ppb > 0 ? Math.floor(newPack  / ppb) : 0;

      } else {
        // ឈុត — 1 ឈuot = 1 pack; sale = bottles per ឈuot (from NewOrder sheet col E)
        const salePerUnit = toNumber_(item.sale) || bpp;
        const ppbFinal    = toNumber_(item.packPerBox) || ppb; // prefer explicit over derived
        newPack = Math.max(0, curPack - qty);
        newBox  = Math.max(0, curBox - (ppbFinal > 0 ? Math.floor(qty / ppbFinal) : 0));
        newBott = Math.max(0, curBott - qty * salePerUnit);
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
        safe_(row[STK_COL.PRODUCT  - 1]),  // col B — Product name
        safe_(row[STK_COL.TYPE     - 1]),  // col C — Type
        toNumber_(row[STK_COL.BOX  - 1]),  // col D — Box
        toNumber_(row[STK_COL.PACK - 1]),  // col E — Pack
        toNumber_(row[STK_COL.BOTTLES-1]), // col F — Bottles
        toNumber_(row[STK_COL.QTY  - 1]),  // col G — QTY
        safe_(row[STK_COL.ID       - 1])   // col H — ID (last, backward-compatible)
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
  // Read existing default values so we don't overwrite when not provided
  const existingDefaults = sheet.getRange(rowNum, STK_COL.DEF_BOX, 1, 3).getValues()[0];
  const defBox  = data.defBox  != null ? toNumber_(data.defBox)  : toNumber_(existingDefaults[0]) || 1;
  const defPack = data.defPack != null ? toNumber_(data.defPack) : toNumber_(existingDefaults[1]);
  const defBott = data.defBott != null ? toNumber_(data.defBott) : toNumber_(existingDefaults[2]);
  sheet.getRange(rowNum, 1, 1, 10).setValues([[
    id,
    safe_(data.product || originalName),
    safe_(data.type   || ''),
    box,
    toNumber_(data.pack),
    toNumber_(data.bottles),
    box,   // QTY = BOX
    defBox,
    defPack,
    defBott
  ]]);
}

function strokeAdd_(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(STROKE_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(STROKE_SHEET);
    sheet.getRange(1, 1, 1, 10).setValues([['ID','Products','Types','Box','Pack','Bottles','QTY','DefaultBox','DefaultPack','DefaultBottle']]);
    sheet.setFrozenRows(1);
  }
  const box  = toNumber_(data.box || data.qty);
  const name = safe_(data.product || data.name || '');
  const id   = findProductIdByName_(name) || '';
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, 10).setValues([[
    id, name,
    safe_(data.type || data.cat || ''),
    box,
    toNumber_(data.pack),
    toNumber_(data.bottles),
    box,
    toNumber_(data.defBox) || 1,
    toNumber_(data.defPack),
    toNumber_(data.defBott)
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
  const numCols = Math.max(sheet.getLastColumn(), 10);
  const data = sheet.getRange(2, 1, lastRow - 1, numCols).getValues();
  return data.map(function(row) {
    return {
      id:      safe_(row[STK_COL.ID       - 1]),
      product: safe_(row[STK_COL.PRODUCT  - 1]),
      type:    safe_(row[STK_COL.TYPE     - 1]),
      box:     toNumber_(row[STK_COL.BOX      - 1]),
      pack:    toNumber_(row[STK_COL.PACK     - 1]),
      bottles: toNumber_(row[STK_COL.BOTTLES  - 1]),
      qty:     toNumber_(row[STK_COL.QTY      - 1]),
      defBox:  toNumber_(row[STK_COL.DEF_BOX  - 1]) || 1,
      defPack: toNumber_(row[STK_COL.DEF_PACK - 1]),
      defBott: toNumber_(row[STK_COL.DEF_BOTT - 1])
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

  // Read all rows (skip header row 1) — 8 cols: DateTime,Product,Type,Box,Pack,Bottles,QTY,ID
  // Old rows have 7 cols (no ID in col H) — handled gracefully: r[7] → ''
  const data = sh.getRange(2, 1, lastRow - 1, 8).getValues();

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
      product: safe_(r[1]),      // col B = Product
      type:    safe_(r[2]),      // col C = Type
      box:     toNumber_(r[3]),  // col D = Box
      pack:    toNumber_(r[4]),  // col E = Pack
      bottles: toNumber_(r[5]),  // col F = Bottles
      qty:     toNumber_(r[6]),  // col G = QTY
      id:      safe_(r[7])       // col H = ID (empty for rows recorded before ID migration)
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
  } else {
    // Update header if old 7-col format (no ID column yet)
    const existingCols = sheet.getRange(1, 1, 1, HIST_HEADER.length).getValues()[0];
    if (!existingCols[HIST_HEADER.length - 1]) {
      sheet.getRange(1, 1, 1, HIST_HEADER.length).setValues([HIST_HEADER]);
    }
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

  // Load NewOrder [ID, Name] pairs ONCE for ProductID auto-lookup
  const noCache = _loadNoCache_();

  return products.map((line, idx) => {
    const qty      = toNumber_(line.qty);
    const price    = toNumber_(line.price);
    const discount = toNumber_(line.discount);
    const unit     = safe_(line.unit || 'ឈុត');
    const subtotal = (line.subtotal != null && line.subtotal !== '')
      ? toNumber_(line.subtotal)
      : Math.max(0, qty * price - discount);
    // Use productId from payload if present, else auto-lookup from NewOrder by name
    const productId = safe_(line.productId) || _lookupIdFromCache_(noCache, safe_(line.name || line.product));

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
      idx === 0 ? grandTotal : 0,  // GrandTotal on first row only
      productId                    // ProductID auto-filled from NewOrder (col 22)
    ];
  });
}

// Load all [ID, Name] pairs for ProductID auto-lookup — read once per order save.
// Reads Stock sheet (col A=ID, col B=Products) as primary source since that is where
// CAMBO-A-001 etc. are defined. Falls back to NewOrder sheet if Stock not found.
function _loadNoCache_() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    // Stock sheet: col A = ID, col B = Products (authoritative product catalog)
    const stockSheet = ss.getSheetByName('Stock');
    const rows = [];
    if (stockSheet && stockSheet.getLastRow() > 1) {
      stockSheet.getRange(2, 1, stockSheet.getLastRow() - 1, 2).getValues()
        .forEach(r => { if (safe_(r[0]) && safe_(r[1])) rows.push(r); });
    }
    // Also read NewOrder sheet (col A = ID, col B = Name) as supplemental source
    const noSheet = ss.getSheetByName('NewOrder');
    if (noSheet && noSheet.getLastRow() > 1) {
      noSheet.getRange(2, 1, noSheet.getLastRow() - 1, 2).getValues()
        .forEach(r => { if (safe_(r[0]) && safe_(r[1])) rows.push(r); });
    }
    return rows;
  } catch(e) { return []; }
}

// Find ProductID from pre-loaded NewOrder cache by fuzzy name match
function _lookupIdFromCache_(cache, name) {
  if (!name || !cache.length) return '';
  const norm = normalizeForMatch_(name);
  for (let i = 0; i < cache.length; i++) {
    if (stockMatch_(normalizeForMatch_(safe_(cache[i][1])), norm)) return safe_(cache[i][0]);
  }
  return '';
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
        name:       safe_(item.name || item.product),
        productId:  safe_(item.productId),   // needed for exact ID match in deductStroke_
        sale:       toNumber_(item.sale),     // bottles per ឈុត
        packPerBox: toNumber_(item.packPerBox), // packs per box (box deduction threshold)
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
 * backfillSaleOrderProductIds — Run ONCE to fill empty ProductID (col V) for all existing SaleOrder rows.
 * Matches product name (col O) against NewOrder sheet to find the ID.
 */
function backfillSaleOrderProductIds() {
  const ss        = SpreadsheetApp.getActiveSpreadsheet();
  const sheet     = ss.getSheetByName('SaleOrder');
  if (!sheet) { Logger.log('SaleOrder sheet not found'); return; }

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) { Logger.log('No data rows'); return; }

  const data    = sheet.getRange(2, 1, lastRow - 1, 22).getValues();
  const noCache = _loadNoCache_();
  let updated = 0, skipped = 0, notFound = 0;

  data.forEach((row, i) => {
    const productName = String(row[14] || '').trim(); // col O = Product
    const existingId  = String(row[21] || '').trim(); // col V = ProductID
    if (!productName) return;
    if (existingId)  { skipped++; return; }           // already filled — skip

    const pid = _lookupIdFromCache_(noCache, productName);
    if (pid) {
      sheet.getRange(i + 2, 22).setValue(pid);
      updated++;
    } else {
      notFound++;
      Logger.log('⚠️ No match: ' + productName);
    }
  });

  Logger.log('════ backfillSaleOrderProductIds done ════');
  Logger.log('Updated: ' + updated + ' | Skipped (already had ID): ' + skipped + ' | Not found: ' + notFound);
  SpreadsheetApp.getUi().alert('Backfill done!\nUpdated: ' + updated + '\nNot found: ' + notFound);
}

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

/* ════════════════════════════════════════
   HELEN LOAN FUNCTIONS
   ════════════════════════════════════════ */
const LOAN_SHEET   = 'HelenLoan';
const LOAN_HEADER  = ['DateTime','FullName','NationalID','DOB','Gender','Phone','Groups','Status','Money','Note'];

/**
 * listHelenLoans_ — Read all rows from HelenLoan sheet
 */
function listHelenLoans_() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(LOAN_SHEET);
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const data = sheet.getRange(2, 1, lastRow - 1, LOAN_HEADER.length).getValues();
  return data.map(function(r) {
    const obj = {};
    LOAN_HEADER.forEach(function(col, i) {
      if (r[i] instanceof Date) {
        obj[col] = col === 'DOB'
          ? Utilities.formatDate(r[i], TZ, 'dd/MM/yyyy')
          : Utilities.formatDate(r[i], TZ, "yyyy-MM-dd'T'HH:mm:ss");
      } else {
        obj[col] = String(r[i] || '');
      }
    });
    return obj;
  }).filter(function(r) { return r.FullName; });
}

/**
 * listHelenLoanTrash_ — Read all rows from HelenLoanT (Trash) sheet
 */
function listHelenLoanTrash_() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('HelenLoanT');
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  const data = sheet.getRange(2, 1, lastRow - 1, LOAN_HEADER.length).getValues();
  return data.map(function(r) {
    const obj = {};
    LOAN_HEADER.forEach(function(col, i) {
      if (r[i] instanceof Date) {
        obj[col] = col === 'DOB'
          ? Utilities.formatDate(r[i], TZ, 'dd/MM/yyyy')
          : Utilities.formatDate(r[i], TZ, "yyyy-MM-dd'T'HH:mm:ss");
      } else {
        obj[col] = String(r[i] || '');
      }
    });
    return obj;
  }).filter(function(r) { return r.FullName; });
}

/**
 * listHelenInfor_ — Read Groups (col A) and Statuses (col B) from HelenInfor sheet
 */
function listHelenInfor_(type) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('HelenInfor');
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  if (lastRow < 1) return [];
  const col = (type === 'statuses') ? 2 : 1;
  const data = sheet.getRange(1, col, lastRow, 1).getValues();
  return data.map(function(r) { return String(r[0] || '').trim(); }).filter(Boolean);
}

/**
 * addHelenInfor_ — Add new value to HelenInfor sheet (col A=groups, col B=statuses)
 */
function addHelenInfor_(type, value) {
  if (!value || !String(value).trim()) return { ok:false, message:'Value is empty' };
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('HelenInfor') || ss.insertSheet('HelenInfor');
  const col   = (type === 'statuses') ? 2 : 1;
  const val   = String(value).trim();
  // Check duplicate
  const lastRow = sheet.getLastRow();
  if (lastRow > 0) {
    const existing = sheet.getRange(1, col, lastRow, 1).getValues().map(r => String(r[0]||'').trim());
    if (existing.includes(val)) return { ok:false, message:'Already exists' };
  }
  // Append to next empty row in the column
  var nextRow = 1;
  if (lastRow > 0) {
    const colData = sheet.getRange(1, col, lastRow, 1).getValues();
    for (var i = 0; i < colData.length; i++) {
      if (!String(colData[i][0]||'').trim()) { nextRow = i + 1; break; }
      nextRow = i + 2;
    }
  }
  sheet.getRange(nextRow, col).setValue(val);
  return { ok:true, message:'Added' };
}

/**
 * deleteHelenInfor_ — Delete a value from HelenInfor sheet
 */
function deleteHelenInfor_(type, value) {
  if (!value) return { ok:false, message:'Value is empty' };
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('HelenInfor');
  if (!sheet) return { ok:false, message:'Sheet not found' };
  const col     = (type === 'statuses') ? 2 : 1;
  const val     = String(value).trim();
  const lastRow = sheet.getLastRow();
  if (lastRow < 1) return { ok:false, message:'Not found' };
  const data = sheet.getRange(1, col, lastRow, 1).getValues();
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][0]||'').trim() === val) {
      sheet.getRange(i + 1, col).clearContent();
      return { ok:true, message:'Deleted' };
    }
  }
  return { ok:false, message:'Not found' };
}

/**
 * addSaleInfor_ — Add new value to SaleInfor sheet
 * Columns: A=Province(1), B=Delivery(2), C=Pages(3), D=CloseBy(4), E=Payment(5)
 */
function addSaleInfor_(type, value) {
  if (!value || !String(value).trim()) return { ok:false, message:'Value is empty' };
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('SaleInfor');
  if (!sheet) return { ok:false, message:'Sheet SaleInfor not found' };
  const colMap = { provinces:1, delivery:2, pages:3, closeby:4, payment:5 };
  const col = colMap[type];
  if (!col) return { ok:false, message:'Unknown type: ' + type };
  const val = String(value).trim();
  const lastRow = sheet.getLastRow();
  // Skip row 1 (header), check duplicates in col from row 2
  if (lastRow >= 2) {
    const existing = sheet.getRange(2, col, lastRow - 1, 1).getValues().map(r => String(r[0]||'').trim());
    if (existing.includes(val)) return { ok:false, message:'Already exists' };
  }
  // Append to next empty row in the column (starting from row 2)
  var nextRow = 2;
  if (lastRow >= 2) {
    const colData = sheet.getRange(2, col, lastRow - 1, 1).getValues();
    for (var i = 0; i < colData.length; i++) {
      if (!String(colData[i][0]||'').trim()) { nextRow = i + 2; break; }
      nextRow = i + 3;
    }
  }
  sheet.getRange(nextRow, col).setValue(val);
  return { ok:true, message:'Added' };
}

/**
 * deleteSaleInfor_ — Delete a value from SaleInfor sheet
 */
function deleteSaleInfor_(type, value) {
  if (!value) return { ok:false, message:'Value is empty' };
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('SaleInfor');
  if (!sheet) return { ok:false, message:'Sheet not found' };
  const colMap = { provinces:1, delivery:2, pages:3, closeby:4, payment:5 };
  const col = colMap[type];
  if (!col) return { ok:false, message:'Unknown type: ' + type };
  const val = String(value).trim();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { ok:false, message:'Not found' };
  const data = sheet.getRange(2, col, lastRow - 1, 1).getValues();
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][0]||'').trim() === val) {
      sheet.getRange(i + 2, col).clearContent();
      return { ok:true, message:'Deleted' };
    }
  }
  return { ok:false, message:'Not found' };
}

/**
 * findHelenLoanRow_ — find row number by DateTime key (col A)
 */
function findHelenLoanRow_(key) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(LOAN_SHEET);
  if (!sheet) return -1;
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return -1;
  const vals = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < vals.length; i++) {
    var cell = vals[i][0];
    var cellStr = cell instanceof Date ? Utilities.formatDate(cell, TZ, "yyyy-MM-dd'T'HH:mm:ss") : String(cell || '');
    if (cellStr === key) return i + 2; // 1-based row number
  }
  return -1;
}

/**
 * updateHelenLoan_ — Update row matched by DateTime key
 */
function updateHelenLoan_(key, loan) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(LOAN_SHEET);
  if (!sheet) return false;
  const rowNum = findHelenLoanRow_(key);
  if (rowNum < 0) return false;
  const row = [
    key,
    String(loan.FullName   || '').trim(),
    String(loan.NationalID || '').trim(),
    String(loan.DOB        || '').trim(),
    String(loan.Gender     || '').trim(),
    String(loan.Phone      || '').trim(),
    String(loan.Groups     || '').trim(),
    String(loan.Status     || '').trim(),
    loan.Money ? Number(loan.Money) : '',
    String(loan.Note       || '').trim(),
  ];
  sheet.getRange(rowNum, 3, 1, 1).setNumberFormat('@');
  sheet.getRange(rowNum, 6, 1, 1).setNumberFormat('@');
  sheet.getRange(rowNum, 1, 1, row.length).setValues([row]);
  return true;
}

/**
 * deleteHelenLoan_ — Move row to HelenLoanT (trash/archive) instead of permanent delete
 */
function deleteHelenLoan_(key) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(LOAN_SHEET);
  if (!sheet) return false;
  const rowNum = findHelenLoanRow_(key);
  if (rowNum < 0) return false;

  /* Read the row data */
  const rowData = sheet.getRange(rowNum, 1, 1, LOAN_HEADER.length).getValues()[0];

  /* Get or create HelenLoanT sheet */
  var trash = ss.getSheetByName('HelenLoanT');
  if (!trash) {
    trash = ss.insertSheet('HelenLoanT');
    trash.getRange(1, 1, 1, LOAN_HEADER.length).setValues([LOAN_HEADER]);
    trash.getRange(1, 1, 1, LOAN_HEADER.length).setFontWeight('bold');
    trash.setFrozenRows(1);
  }

  /* Append to HelenLoanT at row 2 (newest first) */
  const lastTrash = trash.getLastRow();
  if (lastTrash > 1) trash.insertRowBefore(2);
  const destRow = lastTrash > 1 ? 2 : trash.getLastRow() + 1;
  trash.getRange(destRow, 1, 1, rowData.length).setValues([rowData]);

  /* Delete from HelenLoan */
  sheet.deleteRow(rowNum);
  return true;
}

/**
 * permDeleteHelenLoan_ — Permanently delete a row from HelenLoanT (no recovery)
 */
function permDeleteHelenLoan_(key) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const trash = ss.getSheetByName('HelenLoanT');
  if (!trash) return false;
  const lastRow = trash.getLastRow();
  if (lastRow < 2) return false;
  const keys = trash.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < keys.length; i++) {
    var val = keys[i][0];
    var valStr = val instanceof Date
      ? Utilities.formatDate(val, TZ, "yyyy-MM-dd'T'HH:mm:ss")
      : String(val || '');
    if (valStr === key) {
      trash.deleteRow(i + 2);
      return true;
    }
  }
  return false;
}

/**
 * recoverHelenLoan_ — Move row from HelenLoanT back to HelenLoan (recover from trash)
 */
function recoverHelenLoan_(key) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const trash = ss.getSheetByName('HelenLoanT');
  if (!trash) return false;

  /* Find the row in HelenLoanT by DateTime key (col A) */
  const lastRow = trash.getLastRow();
  if (lastRow < 2) return false;
  const keys = trash.getRange(2, 1, lastRow - 1, 1).getValues();
  let rowNum = -1;
  for (var i = 0; i < keys.length; i++) {
    var val = keys[i][0];
    var valStr = val instanceof Date
      ? Utilities.formatDate(val, TZ, "yyyy-MM-dd'T'HH:mm:ss")
      : String(val || '');
    if (valStr === key) { rowNum = i + 2; break; }
  }
  if (rowNum < 0) return false;

  /* Read the row data */
  const rowData = trash.getRange(rowNum, 1, 1, LOAN_HEADER.length).getValues()[0];

  /* Get or create HelenLoan sheet */
  let sheet = ss.getSheetByName(LOAN_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(LOAN_SHEET);
    sheet.getRange(1, 1, 1, LOAN_HEADER.length).setValues([LOAN_HEADER]);
    sheet.getRange(1, 1, 1, LOAN_HEADER.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  /* Insert at row 2 (newest first) */
  const lastLoan = sheet.getLastRow();
  if (lastLoan >= 1) sheet.insertRowBefore(2);
  const destRow = lastLoan >= 1 ? 2 : 1;
  sheet.getRange(destRow, 1, 1, rowData.length).setValues([rowData]);

  /* Delete from HelenLoanT */
  trash.deleteRow(rowNum);
  return true;
}

/**
 * addHelenLoan_ — Append a new row to HelenLoan sheet (newest at TOP)
 */
function addHelenLoan_(loan) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let   sheet = ss.getSheetByName(LOAN_SHEET);

  /* Auto-create sheet with header if missing */
  if (!sheet) {
    sheet = ss.insertSheet(LOAN_SHEET);
    sheet.getRange(1, 1, 1, LOAN_HEADER.length).setValues([LOAN_HEADER]);
    sheet.getRange(1, 1, 1, LOAN_HEADER.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  const now = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd'T'HH:mm:ss");

  /* DOB arrives already as dd/mm/yyyy from the UI text input — store as-is */
  const row = [
    now,
    String(loan.FullName   || '').trim(),
    String(loan.NationalID || '').trim(),
    String(loan.DOB        || '').trim(),
    String(loan.Gender     || '').trim(),
    String(loan.Phone      || '').trim(),
    String(loan.Groups     || 'SS3').trim(),
    String(loan.Status     || '').trim(),
    loan.Money ? Number(loan.Money) : '',
    String(loan.Note       || '').trim(),
  ];

  /* Insert at row 2 so newest appears first */
  if (sheet.getLastRow() > 1) sheet.insertRowBefore(2);
  const range = sheet.getRange(2, 1, 1, row.length);
  /* Force Phone (col 6) and NationalID (col 3) as plain text to preserve leading zeros */
  sheet.getRange(2, 3, 1, 1).setNumberFormat('@');
  sheet.getRange(2, 6, 1, 1).setNumberFormat('@');
  range.setValues([row]);
}


/* ════════════════════════════════════════
   PRINT STATUS FUNCTIONS
   PrintStatus sheet: A=OrderID, B=Status, C=UpdatedAt
   ════════════════════════════════════════ */
const PRINT_STATUS_SHEET = 'PrintStatus';

function getPrintStatuses_() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(PRINT_STATUS_SHEET);
  if (!sheet || sheet.getLastRow() <= 1) return {};
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
  const result = {};
  data.forEach(function(r) {
    if (safe_(r[0])) result[safe_(r[0])] = safe_(r[1]);
  });
  return result;
}

function setPrintStatus_(orderId, status) {
  if (!orderId) return;
  const ss  = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(PRINT_STATUS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(PRINT_STATUS_SHEET);
    sheet.getRange(1, 1, 1, 3).setValues([['OrderID','Status','UpdatedAt']]);
    sheet.setFrozenRows(1);
  }
  const now = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd HH:mm:ss");
  const lastRow = sheet.getLastRow();
  // Check if orderId already exists → update
  if (lastRow > 1) {
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
    for (let i = 0; i < ids.length; i++) {
      if (safe_(ids[i]) === safe_(orderId)) {
        if (status) {
          sheet.getRange(i + 2, 2, 1, 2).setValues([[status, now]]);
        } else {
          sheet.deleteRow(i + 2); // clear = delete row
        }
        return;
      }
    }
  }
  // Not found → append new row (only if setting a status)
  if (status) sheet.appendRow([safe_(orderId), status, now]);
}

/**
 * updateOrderStatus_ — Update Status column (col E) in SaleOrder sheet for all rows matching orderId
 */
function updateOrderStatus_(orderId, status) {
  if (!safe_(orderId)) return;
  const sheet   = getSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;
  const ids = sheet.getRange(2, 2, lastRow - 1, 1).getValues().flat(); // col B = OrderID
  for (let i = 0; i < ids.length; i++) {
    if (safe_(ids[i]) === safe_(orderId)) {
      sheet.getRange(i + 2, 5).setValue(safe_(status)); // col E = Status
    }
  }
}

