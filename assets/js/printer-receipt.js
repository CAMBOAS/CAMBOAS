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
        title: config.title || "វិក្កយបត្រ",
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
      title: data.title || "វិក្កយបត្រ",
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
          <h1 class="title">${escapeHtml(data.title)}</h1>
          <div class="date">កាលបរិច្ឆេទ: ${escapeHtml(data.date)}</div>
        </div>

        <div class="dash"></div>

        <table class="info">
          <tr><td class="label">ឈ្មោះ:</td><td class="value strong">${escapeHtml(data.customer)}</td></tr>
          <tr><td class="label">លេខទូរសព្ទ:</td><td class="value strong">${escapeHtml(data.phone)}</td></tr>
          <tr><td class="label">ទីតាំង:</td><td class="value">${escapeHtml(data.address)}</td></tr>
          <tr><td class="label">អ្នកដឹកជញ្ជូន:</td><td class="value strong">${escapeHtml(data.deliveryName)}</td></tr>
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

        ${(data.showQR && data.qrImage) || data.receiptNo ? `
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

            <div class="receiptno-col ${!data.receiptNo ? 'is-hidden' : ''}">
              ${data.receiptNo ? `
                <div class="receiptno-box">
                  <div class="receiptno-value">${escapeHtml(data.receiptNo)}</div>
                </div>
              ` : `<div class="receiptno-empty" aria-hidden="true"></div>`}
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
        font-family: "Kantumruy Pro", "Noto Sans Khmer", sans-serif;
      }
      body {
        width: ${paperWidth};
        margin: 0 auto;
      }
      .receipt {
        width: ${paperWidth};
        padding: 10mm 1.1mm 1.1mm;
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
        margin-top: 8px;
        min-height: 220px;
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
  <link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;500;600;700&display=swap" rel="stylesheet">
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
        font-family: "Kantumruy Pro", sans-serif;
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
      #receiptPreviewModal .receipt * { font-family: "Kantumruy Pro", "Noto Sans Khmer", sans-serif; }
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

  global.ReceiptPrinter = ReceiptPrinter;
})(window);
