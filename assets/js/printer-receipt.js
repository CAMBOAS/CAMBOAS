(function (global) {
  const ReceiptPrinter = {
    fromSelectors(config = {}) {
      const getValue = (selector, fallback = "") => {
        if (!selector) return fallback;
        const el = document.querySelector(selector);
        if (!el) return fallback;
        return (("value" in el ? el.value : el.textContent) || "").trim();
      };

      const items = readItemsFromTable(config.tableSelector || "#itemsTable");
      const deliveryFee = toNumber(getValue(config.deliveryFeeSelector, 0));
      const subtotal = items.reduce((sum, item) => sum + toNumber(item.subtotal), 0);
      const grandTotal = subtotal + deliveryFee;
      const rielRate = Number(config.rielRate || 4100);

      return normalizeData({
        title: config.title || "",
        paperWidth: config.paperWidth || "80mm",
        autoPrint: config.autoPrint !== false,
        showQR: config.showQR !== false,
        date: getValue(config.dateSelector),
        customer: getValue(config.customerSelector),
        phone: getValue(config.phoneSelector),
        address: getValue(config.addressSelector),
        deliveryName: getValue(config.deliverySelector),
        note: getValue(config.noteSelector, "-") || "-",
        page: getValue(config.pageSelector),
        closeBy: getValue(config.closeBySelector),
        payment: getValue(config.paymentSelector),
        servicePhone: getValue(config.servicePhoneSelector),
        qrImage: getValue(config.qrImageSelector),
        accountName: getValue(config.accountNameSelector, "CHEA CHANROTHA"),
        items,
        subtotal,
        deliveryFee,
        grandTotal,
        grandRiel: Math.round(grandTotal * rielRate)
      });
    },

    printFromSelectors(config = {}) {
      const data = ReceiptPrinter.fromSelectors(config);
      return ReceiptPrinter.print(data, config);
    },

    print(data = {}, options = {}) {
      const normalized = normalizeData({ ...data, paperWidth: options.paperWidth || data.paperWidth || "80mm", showQR: options.showQR !== false && data.showQR !== false });
      return printInHiddenFrame(buildReceiptDocument(normalized));
    },

    previewFromSelectors(config = {}) {
      const data = ReceiptPrinter.fromSelectors(config);
      return ReceiptPrinter.preview(data, config);
    },

    preview(data = {}, options = {}) {
      const normalized = normalizeData({ ...data, paperWidth: options.paperWidth || data.paperWidth || "80mm", showQR: options.showQR !== false && data.showQR !== false, autoPrint: false });
      return openPreviewModal(normalized);
    },

    closePreview() {
      const modal = document.getElementById("receiptPreviewModal");
      if (modal) modal.remove();
      const style = document.getElementById("receiptPreviewStyle");
      if (style) style.remove();
    },

    fromTable(tableSelector = "#itemsTable") {
      return readItemsFromTable(tableSelector);
    }
  };

  function toNumber(value) {
    const cleaned = String(value ?? "").replace(/[^\d.-]/g, "");
    return Number(cleaned || 0);
  }

  function readItemsFromTable(tableSelector) {
    const rows = document.querySelectorAll(`${tableSelector} tbody tr`);
    const items = [];

    rows.forEach((row) => {
      const getCellText = (selector, index) => {
        const bySelector = selector ? row.querySelector(selector) : null;
        if (bySelector) {
          return (("value" in bySelector ? bySelector.value : bySelector.textContent) || "").trim();
        }

        const cells = row.querySelectorAll("td");
        const cell = cells[index];
        if (!cell) return "";

        const input = cell.querySelector("input, select, textarea");
        return ((input ? input.value : cell.textContent) || "").trim();
      };

      const product = getCellText(".item-product", 0);
      const qty = toNumber(getCellText(".item-qty", 1));
      const price = toNumber(getCellText(".item-price", 2));
      const discount = toNumber(getCellText(".item-discount", 3));
      let subtotal = toNumber(getCellText(".item-subtotal", 4));

      if (!subtotal) subtotal = Math.max(qty * price - discount, 0);
      if (product) items.push({ product, qty, price, discount, subtotal });
    });

    return items;
  }

  function normalizeData(data) {
    const items = Array.isArray(data.items) ? data.items : [];
    const subtotal = toNumber(data.subtotal || items.reduce((sum, item) => sum + toNumber(item.subtotal), 0));
    const deliveryFee = toNumber(data.deliveryFee);
    const grandTotal = toNumber(data.grandTotal || subtotal + deliveryFee);

    return {
      title: data.title || "",
      paperWidth: data.paperWidth || "80mm",
      autoPrint: data.autoPrint !== false,
      showQR: data.showQR !== false,
      date: data.date || "",
      customer: data.customer || "",
      phone: data.phone || "",
      address: data.address || "",
      deliveryName: data.deliveryName || "",
      note: data.note || "-",
      page: data.page || "",
      closeBy: data.closeBy || "",
      payment: data.payment || "",
      receiptNo: data.receiptNo || "",
      servicePhone: data.servicePhone || "",
      qrImage: data.qrImage || "",
      accountName: data.accountName || "CHEA CHANROTHA",
      items,
      subtotal,
      deliveryFee,
      grandTotal,
      grandRiel: toNumber(data.grandRiel || Math.round(grandTotal * 4100))
    };
  }

  function money(value) {
    return toNumber(value).toFixed(2).replace(/\.00$/, "");
  }

  function escapeHtml(text) {
    return String(text ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function buildReceiptRows(data) {
    return data.items.map((item, index) => `
      <tr>
        <td class="product">${index + 1}. ${escapeHtml(item.product)}</td>
        <td class="qty">${escapeHtml(item.qty)} ឈុត</td>
        <td class="price">$${money(item.price)}</td>
        <td class="total">$${money(item.subtotal)}</td>
      </tr>
    `).join("");
  }

  function buildReceiptBody(data) {
    const rows = buildReceiptRows(data);
    const width = escapeHtml(data.paperWidth);

    return `
      <div class="receipt" data-paper-width="${width}">
        <div class="top">
          <div class="order-num">${escapeHtml(data.receiptNo || 'វិក័យប័ត្រ')}</div>
          <div class="date">កាលបរិច្ឆេទ: ${escapeHtml(data.date)}</div>
        </div>

        <div class="dash"></div>

        <table class="info">
          <tr><td class="label strong">ឈ្មោះ:</td><td class="value strong">${escapeHtml(data.customer)}</td></tr>
          <tr><td class="label strong">លេខទូរសព្ទ:</td><td class="value strong">${escapeHtml(data.phone)}</td></tr>
          <tr><td class="label strong">ទីតាំង:</td><td class="value strong">${escapeHtml(data.address)}</td></tr>
          <tr><td class="label strong">អ្នកដឹកជញ្ជូន:</td><td class="value strong">${escapeHtml(data.deliveryName)}</td></tr>
          <tr><td class="label">Note:</td><td class="value">${escapeHtml(data.note || "-")}</td></tr>
        </table>

        <div class="dash"></div>

        <table class="line-items">
          <colgroup>
            <col class="col-product" />
            <col class="col-qty" />
            <col class="col-price" />
            <col class="col-total" />
          </colgroup>
          <thead class="head">
            <tr>
              <th>ផលិតផល</th>
              <th>ចំនួន</th>
              <th>តម្លៃ</th>
              <th>សរុប</th>
            </tr>
          </thead>
          <tbody class="items">${rows}</tbody>
        </table>

        <div class="dash"></div>

        <table class="summary">
          <tr><td>សរុបទំនិញ</td><td>$${money(data.subtotal)}</td></tr>
          <tr><td>សេវាដឹក</td><td>${Number(data.deliveryFee) > 0 ? "$" + money(data.deliveryFee) : "ហ្វ្រីដឹក"}</td></tr>
        </table>

        <div class="pay-row">
          <div class="left">ការទូទាត់: <strong>${escapeHtml(data.payment)}</strong></div>
          <div class="grand">$${money(data.grandTotal)}</div>
        </div>

        <div class="riel-row">
          <div class="left">ប្រាក់រៀល:</div>
          <div class="value">${Number(data.grandRiel || 0).toLocaleString("en-US")}៛</div>
        </div>

        <div class="dash"></div>

        <div class="bottom">Page: <strong>${escapeHtml(data.page)}</strong> | CloseBy: <strong>${escapeHtml(data.closeBy)}</strong></div>

        <div class="contact-line">
          <span class="contact-label">លេខប្រើប្រាស់ទំនាក់ទំនង</span>
          <span class="contact-value">${escapeHtml(data.servicePhone)}</span>
        </div>
        <div class="disclaimer">បញ្ជាក់៖ ទំនិញទិញហើយ មិនអាចប្ដូរយកប្រាក់វិញបានទេ</div>

        ${(data.showQR && data.qrImage) ? `
          <div class="dash"></div>
          <div class="qr-receipt-row ${!(data.showQR && data.qrImage) ? 'no-qr' : ''} ${!data.receiptNo ? 'no-number' : ''}">
            <div class="qr-col ${!(data.showQR && data.qrImage) ? 'is-hidden' : ''}">
              ${data.showQR && data.qrImage ? `
                <div class="qr-wrap">
                  <img src="${escapeHtml(data.qrImage)}" alt="QR Code" />
                  <div class="qr-type">${escapeHtml(data.payment)}</div>
                  <div class="qr-name">${escapeHtml(data.accountName)}</div>
                </div>
              ` : `<div class="qr-empty" aria-hidden="true"></div>`}
            </div>


          </div>
        ` : ""}
      </div>
    `;
  }

  function buildReceiptStyles(paperWidth) {
    return `
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        background: #fff;
        color: #000;
        font-family: "Noto Sans Khmer", "Noto Sans Khmer", sans-serif;
      }
      body {
        width: ${paperWidth};
        margin: 0 auto;
        height: fit-content !important;
        overflow: hidden;
      }
      .receipt {
        width: ${paperWidth};
        padding: 10mm 1.1mm 0;
        padding-bottom: 0 !important;
        margin-bottom: 0 !important;
      }
      .top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 8px;
      }
      .title {
        font-size: 28px;
        font-weight: 700;
        line-height: 1.1;
        margin: 0;
      }
      .order-num {
        font-size: 38px;
        font-weight: 900;
        line-height: 1.1;
        color: #0f172a;
        letter-spacing: 0;
        margin: 0;
      }
      .date {
        font-size: 14px;
        color: #475569;
        text-align: right;
        line-height: 1.4;
        padding-top: 4px;
      }
      .dash {
        border-top: 1px dashed #7a8597;
        margin: 9px 0 11px;
      }
      .info, .summary, .line-items {
        width: 100% !important;
        min-width: 0 !important;
        max-width: 100% !important;
        border-collapse: collapse;
        table-layout: fixed;
      }
      .info td, .summary td {
        padding: 1.2px 0;
        vertical-align: top;
        font-size: 14px;
        line-height: 1.2;
        word-break: break-word;
        overflow-wrap: anywhere;
      }
      .info .label {
        width: 25%;
        font-weight: 500;
        padding-right: 6px;
        white-space: nowrap;
        text-align: left;
      }
      .info .value {
        width: 75%;
        padding-left: 4px;
        text-align: left;
      }
      .strong { font-weight: 700; }
      .line-items {
        margin-top: 3px;
      }
      .line-items .col-product { width: 55%; }
      .line-items .col-qty { width: 15%; }
      .line-items .col-price { width: 15%; }
      .line-items .col-total { width: 15%; }
      .head th {
        font-size: 15px;
        font-weight: 700;
        text-align: left;
        padding: 5px 0 7px;
        border-bottom: 1.3px solid #000;
        white-space: nowrap;
      }
      .head th:first-child,
      .items td:first-child {
        text-align: left;
      }
      .head th:nth-child(2), .head th:nth-child(3), .head th:nth-child(4) {
        text-align: right;
      }
      .items td {
        padding: 6px 0;
        font-size: 14px;
        line-height: 1.2;
        vertical-align: top;
        overflow-wrap: anywhere;
      }
      .items .product { padding-right: 8px; word-break: break-word; text-align: left; }
      .items .qty { text-align: right; white-space: nowrap; padding-right: 4px; }
      .items .price { text-align: right; white-space: nowrap; padding-right: 4px; }

      .items .total {
        width: 18%;
        text-align: right;
        white-space: nowrap;
        font-weight: 400;
      }
      .summary td:first-child { width: 60%; }
      .summary td:last-child { width: 40%; text-align: right; white-space: nowrap; }
      .pay-row, .riel-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 10px;
      }
      .pay-row { margin-top: 8px; }
      .pay-row .left, .riel-row .left { font-size: 14px; }
      .pay-row .left strong { font-size: 18px; font-weight: 700; }
      .grand {
        font-size: 20px;
        font-weight: 700;
      }
       .riel-row .value {
        font-size: 18px;
        font-weight: 400;
      }



      .disclaimer {
        font-size: 11px;
        color: #e53e3e;
        font-weight: 600;
        margin-top: 4px;
        padding: 3px 6px;
        background: rgba(229,62,62,.07);
        border-left: 3px solid #e53e3e;
        border-radius: 2px;
        line-height: 1.4;
      }
      .bottom {
        font-size: 13px;
        line-height: 1.55;
        word-break: normal;
        overflow-wrap: normal;
      }
      .contact-line {
        margin-top: 4px;
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 10px;
        font-size: 11px;
        line-height: 1.4;
        white-space: nowrap;
      }
      .contact-label,
      .contact-value {
        white-space: nowrap;
      }
      .contact-label {
        flex: 0 0 auto;
      }
      .contact-value {
        flex: 0 0 auto;
        text-align: right;
        font-variant-numeric: tabular-nums;
      }
      .qr-receipt-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        column-gap: 10px;
        align-items: stretch;
        margin-top: 6px;
        min-height: auto;
      }
      .qr-receipt-row.no-qr {
        grid-template-columns: minmax(0, 1fr);
      }
      .qr-receipt-row.no-number {
        grid-template-columns: minmax(0, 1fr);
      }
      .qr-col,
      .receiptno-col {
        min-width: 0;
        display: flex;
      }
      .qr-col {
        justify-content: center;
        align-items: flex-start;
      }
      .receiptno-col {
        justify-content: center;
        align-items: center;
      }
      .qr-col.is-hidden,
      .receiptno-col.is-hidden {
        display: none;
      }
      .qr-wrap,
      .receiptno-box,
      .qr-empty,
      .receiptno-empty {
        width: 100%;
      }
      .qr-wrap {
        text-align: center;
        margin-top: 10px;
      }
      .qr-wrap img {
        width: 145px;
        height: 145px;
        object-fit: contain;
        display: block;
        margin: 0 auto;
      }
      .qr-type {
        margin-top: 4px;
        font-size: 24px;
        font-weight: 700;
        line-height: 1.1;
      }
      .qr-name {
        margin-top: 4px;
        font-size: 16px;
        font-weight: 700;
        text-transform: uppercase;
        word-break: break-word;
        overflow-wrap: anywhere;
      }
      .receiptno-box {
        min-height: 220px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .receiptno-value {
        width: 100%;
        text-align: center;
        font-size: 96px;
        font-weight: 700;
        line-height: 0.9;
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
        overflow: hidden;
      }
      .qr-empty,
      .receiptno-empty {
        min-height: 220px;
      }
      @page {
        size: ${paperWidth} auto;
        margin: 0;
      }
      @media print {
        html, body { width: ${paperWidth}; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `;
  }

  function buildReceiptDocument(data) {
    return `<!DOCTYPE html>
<html lang="km">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Receipt Print</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Khmer:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>${buildReceiptStyles(data.paperWidth)}</style>
</head>
<body>
  ${buildReceiptBody(data)}
</body>
</html>`;
  }

  function printInHiddenFrame(html) {
    const oldFrame = document.getElementById("receiptPrintFrame");
    if (oldFrame) oldFrame.remove();

    const iframe = document.createElement("iframe");
    iframe.id = "receiptPrintFrame";
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    document.body.appendChild(iframe);

    const frameDoc = iframe.contentWindow.document;
    frameDoc.open();
    frameDoc.write(html);
    frameDoc.close();

    iframe.onload = function () {
      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }, 250);
    };


    const cleanup = () => setTimeout(() => iframe.remove(), 1200);
    if (iframe.contentWindow) {
      iframe.contentWindow.onafterprint = cleanup;
    }
    return iframe;
  }

  function openPreviewModal(data) {
    const paperWidth = data.paperWidth || "80mm";
    const bodyHtml = buildReceiptBody(data);
    ReceiptPrinter.closePreview();

    const modal = document.createElement("div");
    modal.id = "receiptPreviewModal";
    modal.innerHTML = `
      <div class="rpm-backdrop"></div>
      <div class="rpm-dialog">
        <div class="rpm-toolbar">
          <strong>Receipt Preview</strong>
          <div class="rpm-actions">
            <button type="button" class="rpm-btn rpm-print">Print</button>
            <button type="button" class="rpm-btn rpm-close">Close</button>
          </div>
        </div>
        <div class="rpm-body">
          <div class="rpm-paper">${bodyHtml}</div>
        </div>
      </div>
    `;

    const style = document.createElement("style");
    style.id = "receiptPreviewStyle";
    style.textContent = `
      #receiptPreviewModal {
        position: fixed;
        inset: 0;
        z-index: 99999;
        font-family: "Noto Sans Khmer", sans-serif;
      }
      #receiptPreviewModal .rpm-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(15, 23, 42, 0.58);
      }
      #receiptPreviewModal .rpm-dialog {
        position: relative;
        z-index: 1;
        width: min(94vw, 920px);
        height: min(92vh, 980px);
        margin: 4vh auto;
        background: #fff;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 30px 80px rgba(0,0,0,0.35);
        display: flex;
        flex-direction: column;
      }
      #receiptPreviewModal .rpm-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 18px;
        border-bottom: 1px solid #e2e8f0;
        background: #f8fafc;
      }
      #receiptPreviewModal .rpm-actions { display: flex; gap: 10px; }
      #receiptPreviewModal .rpm-btn {
        border: 0;
        border-radius: 12px;
        padding: 10px 14px;
        font: inherit;
        cursor: pointer;
        font-weight: 700;
      }
      #receiptPreviewModal .rpm-print { background: #0f766e; color: #fff; }
      #receiptPreviewModal .rpm-close { background: #e2e8f0; color: #0f172a; }
      #receiptPreviewModal .rpm-body {
        flex: 1;
        overflow: auto;
        background: #e5e7eb;
        padding: 22px;
      }
      #receiptPreviewModal .rpm-paper {
        width: ${paperWidth};
        min-height: fit-content;
        margin: 0 auto;
        background: #fff;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.14);
      }
      #receiptPreviewModal .receipt {
        width: ${paperWidth} !important;
        min-width: 0 !important;
        max-width: ${paperWidth} !important;
      }
      #receiptPreviewModal .receipt,
      #receiptPreviewModal .receipt * { font-family: "Noto Sans Khmer", "Noto Sans Khmer", sans-serif; }
      #receiptPreviewModal .receipt table {
        width: 100% !important;
        min-width: 0 !important;
        max-width: 100% !important;
        table-layout: fixed;
      }
      #receiptPreviewModal .receipt .info .label,
      #receiptPreviewModal .receipt .info .value,
      #receiptPreviewModal .receipt .head th,
      #receiptPreviewModal .receipt .items td {
        text-align: left;
      }
      #receiptPreviewModal .receipt .head th:nth-child(2),
      #receiptPreviewModal .receipt .head th:nth-child(3),
      #receiptPreviewModal .receipt .head th:nth-child(4),
      #receiptPreviewModal .receipt .items .qty,
      #receiptPreviewModal .receipt .items .price,
      #receiptPreviewModal .receipt .items .total,
      #receiptPreviewModal .receipt .summary td:last-child {
        text-align: right;
      }
      #receiptPreviewModal .rpm-paper { padding: 0; }
      #receiptPreviewModal .rpm-paper style { display: none; }
      @media (max-width: 640px) {
        #receiptPreviewModal .rpm-dialog { width: 100vw; height: 100vh; margin: 0; border-radius: 0; }
        #receiptPreviewModal .rpm-body { padding: 12px; }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(modal);

    const receiptStyle = document.createElement("style");
    receiptStyle.textContent = buildReceiptStyles(paperWidth);
    modal.querySelector(".rpm-paper").prepend(receiptStyle);

    modal.querySelector(".rpm-close").addEventListener("click", () => ReceiptPrinter.closePreview());
    modal.querySelector(".rpm-backdrop").addEventListener("click", () => ReceiptPrinter.closePreview());
    modal.querySelector(".rpm-print").addEventListener("click", () => {
      const receiptHtml = buildReceiptDocument(data);
      ReceiptPrinter.closePreview();
      setTimeout(() => {
        printInHiddenFrame(receiptHtml);
      }, 120);
    });

    return modal;
  }

  // printTable — styled order list table
  ReceiptPrinter.printTable = function(rows){
    if(!rows || !rows.length) return;
    var grand = rows.reduce(function(s,o){
      return s + (o.products||[]).reduce(function(ss,p){ return ss+Number(p.qty||0)*Number(p.price||0)-Number(p.discount||0); },0) + Number(o.deliveryFee||0);
    }, 0);
    function fmtD(s){
      if(!s) return '';
      if(/^\d{2}\/\d{2}\/\d{4}/.test(s)) return s.slice(0,10);
      if(/^\d{4}-\d{2}-\d{2}/.test(s)){ var p=s.slice(0,10).split('-'); return p[2]+'/'+p[1]+'/'+p[0]; }
      try{ var d=new Date(s); if(!isNaN(d)) return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear(); }catch(e){}
      return s;
    }
    function e(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    function tot(o){ return (o.products||[]).reduce(function(s,p){ return s+Number(p.qty||0)*Number(p.price||0)-Number(p.discount||0); },0)+Number(o.deliveryFee||0); }

    var html = '<!DOCTYPE html><html lang="km"><head><meta charset="UTF-8">'
      +'<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Khmer:wght@400;500;600;700&display=swap" rel="stylesheet">'
      +'<style>'
      +'*{box-sizing:border-box;margin:0;padding:0}'
      +'body{font-family:"Noto Sans Khmer",Arial,sans-serif;font-size:12px;background:#fff}'
      +'.header{background:#045f80;color:#fff;padding:12px 20px;display:flex;justify-content:space-between;align-items:center}'
      +'.header h1{font-size:17px;font-weight:800;letter-spacing:-.3px}'
      +'.header span{font-size:11px;opacity:.85}'
      +'table{width:100%;border-collapse:collapse}'
      +'thead tr{background:#0c1a2e;color:#94a3b8}'
      +'th{padding:9px 10px;text-align:left;font-size:10px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;white-space:nowrap;border-bottom:2px solid #045f80}'
      +'td{padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;vertical-align:top}'
      +'tr:nth-child(even) td{background:#f8fafc}'
      +'tr:hover td{background:#eff6ff}'
      +'.num{color:#64748b;font-size:11px}'
      +'.name{font-weight:700;color:#0f172a}'
      +'.phone{color:#2563eb}'
      +'.prod{color:#374151;font-size:11px;line-height:1.5}'
      +'.prod-more{color:#9ca3af}'
      +'.pending{color:#d97706;font-weight:700}'
      +'.delivered{color:#16a34a;font-weight:700}'
      +'.cancelled{color:#dc2626;font-weight:700}'
      +'.amt{font-weight:800;color:#045f80}'
      +'.grand{background:#045f80!important}'
      +'.grand td{color:#fff!important;font-weight:800;font-size:13px;border:none!important}'
      +'.grand .amt{color:#fff!important}'
      +'@media print{body{padding:0}thead{display:table-header-group}}'
      +'</style></head><body>'
      +'<div class="header">'
      +'<h1>📋 CAMBO MINI — Order List</h1>'
      +'<span>'+new Date().toLocaleDateString('km-KH')+' &nbsp;|&nbsp; '+rows.length+' orders</span>'
      +'</div>'
      +'<table><thead><tr>'
      +'<th>#</th><th>ថ្ងៃ</th><th>អតិថិជន</th><th>ទូរស័ព្ទ</th>'
      +'<th>ខេត្ត</th><th>ផលិតផល</th><th>PAGE</th><th>CloseBy</th>'
      +'<th style="text-align:right">Total</th><th>Status</th>'
      +'</tr></thead><tbody>';

    rows.forEach(function(o,i){
      var t=tot(o);
      var st=(o.status||o.orderStatus||'Pending');
      var stcls=st.toLowerCase();
      var prods=(o.products||[]);
      var prodHtml=prods.slice(0,3).map(function(p){
        return '• '+e(p.name||'')+(p.qty>1?' ×'+p.qty:'');
      }).join('<br>');
      if(prods.length>3) prodHtml+='<br><span class="prod-more">+'+(prods.length-3)+' more</span>';
      html+='<tr>'
        +'<td class="num">'+(i+1)+'</td>'
        +'<td style="white-space:nowrap;color:#64748b">'+fmtD(o.date)+'</td>'
        +'<td class="name">'+e(o.customer||'—')+'</td>'
        +'<td class="phone">'+e(o.phone||'')+'</td>'
        +'<td>'+e(o.province||'')+'</td>'
        +'<td class="prod">'+prodHtml+'</td>'
        +'<td style="color:#64748b;font-size:11px">'+e(o.page||o.pages||'')+'</td>'
        +'<td style="color:#64748b;font-size:11px">'+e(o.closeBy||o.closeby||'')+'</td>'
        +'<td class="amt" style="text-align:right;white-space:nowrap">$'+t.toFixed(2)+'</td>'
        +'<td class="'+stcls+'">'+e(st)+'</td>'
        +'</tr>';
    });

    html+='<tr class="grand">'
      +'<td colspan="8" style="text-align:right;padding-right:12px">Grand Total</td>'
      +'<td class="amt" style="text-align:right">$'+grand.toFixed(2)+'</td>'
      +'<td></td></tr>'
      +'</tbody></table></body></html>';

    return printInHiddenFrame(html);
  };

  // Expose internal helpers for batch printing
  ReceiptPrinter.buildDocument = function(data){ return buildReceiptDocument(normalizeData(data)); };
  ReceiptPrinter.printBatch    = function(dataArray){
    if(!dataArray || !dataArray.length) return;
    if(dataArray.length === 1){ return ReceiptPrinter.print(dataArray[0]); }
    // Combine all receipts into ONE iframe → ONE print dialog
    var combined = dataArray.map(function(d, i){
      var normalized = normalizeData(Object.assign({}, d, {paperWidth: d.paperWidth||'80mm', showQR: d.showQR !== false}));
      var body = buildReceiptBody(normalized);
      var isLast = i === dataArray.length - 1;
      return '<div style="'+(isLast?'':'page-break-after:always')+'">'+body+'</div>';
    }).join('');
    var styles = buildReceiptStyles('80mm');
    var html = '<!DOCTYPE html><html lang="km"><head><meta charset="UTF-8">'
      +'<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Khmer:wght@400;500;600;700&display=swap" rel="stylesheet">'
      +'<style>'+styles+'</style></head><body>'+combined+'</body></html>';
    return printInHiddenFrame(html);
  };

  global.ReceiptPrinter = ReceiptPrinter;
})(window);
