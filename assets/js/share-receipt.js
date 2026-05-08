(function (global) {
  const ShareReceipt = {
    async share(data = {}, options = {}) {
      if (typeof html2canvas !== "function") {
        throw new Error("html2canvas library is missing.");
      }

      const normalized = normalizeData(data);
      const target = options.target || document.getElementById("printArea");
      if (!target) throw new Error("Print area not found.");

      const blob = await captureInvoiceBlob(normalized, target);

      const fileName = options.fileName || `invoice-${Date.now()}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: options.title || "Invoice",
          text: options.text || "Invoice image",
          files: [file]
        });
        return { mode: "share", file };
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      return { mode: "download", file };
    }
  };

  function normalizeData(data) {
    const items = Array.isArray(data.items) ? data.items : [];
    const deliveryFee = Math.max(0, Number(data.deliveryFee || 0));
    const subtotal = Number(data.subtotal || items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0));
    const grandTotal = Number(data.grandTotal || subtotal + deliveryFee);

    return {
      title: data.title || "វិក័យប័ត្រ",
      date: data.date || "-",
      customer: data.customer || "-",
      phone: data.phone || "-",
      address: data.address || "-",
      deliveryName: data.deliveryName || "-",
      note: data.note || "-",
      page: data.page || "-",
      closeBy: data.closeBy || "-",
      payment: data.payment || "-",
      servicePhone: data.servicePhone || "015 58 68 78 / 089 58 68 78",
      receiptNo: data.receiptNo || "",
      qrImage: data.qrImage || "",
      qrLabel: data.qrLabel || data.payment || "",
      accountName: data.accountName || "",
      items,
      subtotal,
      deliveryFee,
      grandTotal,
      grandRiel: Number(data.grandRiel || Math.round(grandTotal * 4100))
    };
  }

  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m]));
  }

  function formatDisplayMoney(num) {
    const n = Number(num || 0);
    return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
  }

  function renderInvoiceArea(data, target) {
    target.style.display = "block";
    target.innerHTML = `
      <style id="captureReceiptStyles">${getShareReceiptStyles()}</style>
      <div class="share-capture-stage">
        <div id="invoiceArea" class="share-capture-shell">
          ${buildShareReceiptHTML(data)}
        </div>
        <!-- BOTTOM FRAME -->
        <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="180" viewBox="0 0 1080 180" style="display:block;flex-shrink:0;">
          <!-- white background -->
          <rect x="0" y="0" width="1080" height="180" fill="#ffffff"/>
          <!-- Layer 2 (bottom): dark brownish-red arc from right -->
          <circle cx="1060" cy="340" r="260" fill="#7a1a1a"/>
          <!-- Layer 1 (top): bright red big circle -->
          <circle cx="980" cy="220" r="195" fill="#e8302a"/>
          <!-- Layer 1 (top): bright red small circle overlapping -->
          <circle cx="760" cy="270" r="148" fill="#c82020"/>
          <!-- teal bar at very bottom -->
          <rect x="0" y="320" width="1080" height="20" fill="#045f80"/>
        </svg>
      </div>
    `;
    return target.querySelector("#invoiceArea");
  }

  function cleanupInvoiceCaptureArea(target) {
    target.innerHTML = "";
    target.style.display = "none";
  }

  function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Failed to read image blob."));
      reader.readAsDataURL(blob);
    });
  }

  function waitForImageElement(img) {
    return new Promise((resolve) => {
      if (!img) return resolve();
      if (img.complete && img.naturalWidth > 0) return resolve();
      const done = () => resolve();
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
    });
  }

  async function imageElementToDataURL(img) {
    await waitForImageElement(img);
    if (!img || !img.naturalWidth || !img.naturalHeight) {
      throw new Error("Image not ready.");
    }

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context unavailable.");
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL("image/png");
  }

  async function inlineInvoiceImages(container) {
    if (!container) return;

    const images = Array.from(container.querySelectorAll("img"));
    await Promise.all(images.map(async (img) => {
      const rawSrc = img.getAttribute("src") || "";
      if (!rawSrc || rawSrc.startsWith("data:")) return;

      const absoluteSrc = toAbsoluteUrl(rawSrc);

      try {
        const response = await fetch(absoluteSrc, { cache: "no-store" });
        if (!response.ok) throw new Error(`Image request failed: ${response.status}`);
        const blob = await response.blob();
        img.src = await blobToDataURL(blob);
        if (img.decode) {
          try { await img.decode(); } catch {}
        }
        return;
      } catch (error) {
        console.warn("Fetch inline failed, trying canvas fallback:", absoluteSrc, error);
      }

      try {
        img.src = await imageElementToDataURL(img);
        if (img.decode) {
          try { await img.decode(); } catch {}
        }
      } catch (fallbackError) {
        console.warn("Canvas inline fallback failed:", absoluteSrc, fallbackError);
        await waitForImageElement(img);
      }
    }));
  }

  async function captureInvoiceBlob(data, target) {
    const invoiceArea = renderInvoiceArea(data, target);
    if (!invoiceArea) throw new Error("Invoice area not found.");

    await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 220)));
    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch {}
    }

    await inlineInvoiceImages(invoiceArea);

    const captureHeight = Math.max(200, Math.ceil(invoiceArea.scrollHeight || invoiceArea.offsetHeight || 0));

    try {
      const canvas = await html2canvas(invoiceArea, {
        width: 1080,
        height: captureHeight,
        scale: Math.max(2, Math.min(window.devicePixelRatio || 1, 3)),
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        imageTimeout: 0,
        foreignObjectRendering: false,
        windowWidth: 1080,
        windowHeight: captureHeight,
        scrollX: 0,
        scrollY: 0
      });

      return await new Promise((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) resolve(result);
          else reject(new Error("Failed to create image."));
        }, "image/png", 1);
      });
    } catch (error) {
      if (error && /tainted canvases/i.test(String(error.message || error))) {
        throw new Error("Share មិនដំណើរការ ព្រោះមានរូបភាព ឬ QR code មួយចំនួនមិនអនុញ្ញាតឱ្យ browser បម្លែងជា image។ សូមពិនិត្យរូបភាព/QR source ឬសាកបើកតាម localhost/http server។");
      }
      throw error;
    } finally {
      cleanupInvoiceCaptureArea(target);
    }
  }

  function buildShareReceiptHTML(data) {
    const deliveryFee = Math.max(0, Number(data.deliveryFee || 0));
    const itemsTotal = Number(data.subtotal || 0);
    const grand = Number(data.grandTotal || 0);
    const grandRiel = Number(data.grandRiel || 0);
    const qrEnabled = !!(data.qrImage);
    const receiptNo = (data.receiptNo || "").trim();
    const hasBottomBlock = qrEnabled;

    const rows = data.items.map((it, i) => `
      <div class="share-item-row">
        <div class="share-col-product">${i + 1}. ${escapeHtml(it.product)}</div>
        <div class="share-col-qty">${escapeHtml(String(it.qty))} ឈុត</div>
        <div class="share-col-price">${escapeHtml(formatDisplayMoney(it.price))}</div>
        <div class="share-col-subtotal">${escapeHtml(formatDisplayMoney(it.subtotal))}</div>
      </div>
    `).join("");

    const bottomBlock = hasBottomBlock ? `
      <div class="share-dash share-bottom-separator"></div>
      <div class="share-bottom-grid ${!qrEnabled ? 'no-qr' : ''} ${!receiptNo ? 'no-number' : ''}">
        <div class="share-qr-side ${!qrEnabled ? 'is-hidden' : ''}">
          ${qrEnabled ? `
            <div class="share-qr-box">
              <img class="share-qr-image" src="${escapeHtml(toAbsoluteUrl(data.qrImage))}" alt="${escapeHtml(data.qrLabel || data.payment)} QR Code" />
            </div>
            <div class="share-qr-label">${escapeHtml(data.qrLabel || data.payment)}</div>
            ${data.accountName ? `<div class="share-qr-name">${escapeHtml(data.accountName)}</div>` : ""}
          ` : `<div class="share-qr-empty" aria-hidden="true"></div>`}
        </div>

      </div>
    ` : `<div class="share-tail-space"></div>`;

    return `
      <div class="share-poster ${hasBottomBlock ? 'has-bottom-block' : 'trim-bottom'}">
        <!-- TOP FRAME: teal bar -->
        <div style="width:100%;height:20px;background:#045f80;flex-shrink:0;display:block;"></div>
        <div class="share-content">
          <div class="share-head">
            <div class="share-title">${escapeHtml(data.receiptNo || 'វិក័យប័ត្រ')}</div>
            <div class="share-date-bar">កាលបរិច្ឆេទ: ${escapeHtml(data.date)}</div>
          </div>

          <div class="share-dash"></div>

          <div class="share-info-grid">
            <div class="share-info-labels">
              <div>ឈ្មោះ:</div>
              <div>លេខទូរសព្ទ:</div>
              <div>ទីតាំង</div>
              <div>អ្នកដឹកជញ្ជូន</div>
              <div>Note:</div>
            </div>
            <div class="share-info-values">
              <div><strong>${escapeHtml(data.customer)}</strong></div>
              <div><strong>${escapeHtml(data.phone)}</strong></div>
              <div>${escapeHtml(data.address)}</div>
              <div><strong>${escapeHtml(data.deliveryName)}</strong></div>
              <div>${escapeHtml(data.note)}</div>
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

          <div class="share-total-row"><span>សរុបទំនិញ</span><span>${escapeHtml(formatDisplayMoney(itemsTotal))}</span></div>
          <div class="share-total-row bold-row"><span>សេវាដឹក</span><span>${deliveryFee === 0 ? 'ហ្វ្រីដឹក' : escapeHtml(formatDisplayMoney(deliveryFee))}</span></div>
          <div class="share-pay-row">
            <div class="share-pay-left">ការទូទាត់ <strong>${escapeHtml(data.payment)}</strong></div>
            <div class="share-grand-wrap">
              <div class="share-grand-total">${escapeHtml(formatDisplayMoney(grand))}</div>
            </div>
          </div>
          <div class="share-riel-row bold-row"><span>ប្រាក់រៀល</span><span>${escapeHtml(grandRiel.toLocaleString())}៛</span></div>

          <div class="share-dash"></div>

          <div class="share-mini-meta">Page: ${escapeHtml(data.page)} | CloseBy: ${escapeHtml(data.closeBy)}</div>
          <div class="share-service-row">
            <span>លេខបម្រើអតិថិជន:</span>
            <span>${escapeHtml(data.servicePhone)}</span>
          </div>
          <div class="share-disclaimer">
            បញ្ជាក់៖ ទំនិញទិញហើយ មិនអាចប្តូរយកប្រាក់វិញបានទេ
          </div>

          ${bottomBlock}
        </div>
        <!-- BOTTOM FRAME -->
        <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="180" viewBox="0 0 1080 180" style="display:block;flex-shrink:0;">
          <!-- white background -->
          <rect x="0" y="0" width="1080" height="180" fill="#ffffff"/>
          <!-- Layer 2 (bottom): dark brownish-red arc from right -->
          <circle cx="1060" cy="340" r="260" fill="#7a1a1a"/>
          <!-- Layer 1 (top): bright red big circle -->
          <circle cx="980" cy="220" r="195" fill="#e8302a"/>
          <!-- Layer 1 (top): bright red small circle overlapping -->
          <circle cx="760" cy="270" r="148" fill="#c82020"/>
          <!-- teal bar at very bottom -->
          <rect x="0" y="320" width="1080" height="20" fill="#045f80"/>
        </svg>
      </div>
    `;
  }

  function getShareReceiptStyles() {
    return `
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Khmer:wght@300;400;500;600;700;800;900&display=swap');
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: #ffffff; }
      body {
        font-family: "Noto Sans Khmer", "Inter", system-ui, sans-serif;
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
        background: #ffffff;
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        font-family: "Noto Sans Khmer", "Inter", system-ui, sans-serif;
      }

      /* ══ TOP FRAME ══ */
      .share-frame-top {
        width: 100%;
        height: 20px;
        background: #045f80;
        flex-shrink: 0;
        display: block;
      }
      .share-frame-top-bar   { display: none; }
      .share-frame-top-accent{ display: none; }

      /* ══ BOTTOM FRAME ══ */
      .share-frame-bottom {
        position: relative;
        width: 100%;
        height: 220px;
        flex-shrink: 0;
        overflow: hidden;
        background: #ffffff;
      }
      .share-frame-bottom-bar { display: none; }

      /* teal bar at very bottom */
      .share-frame-bottom::before {
        content: '';
        position: absolute;
        bottom: 0; left: 0; right: 0;
        height: 20px;
        background: #045f80;
        z-index: 1;
      }

      /* Large red circle — peeping from bottom-right */
      .share-frame-red-corner {
        position: absolute;
        bottom: -60px;
        right: -60px;
        width: 380px;
        height: 380px;
        background: #e8302a;
        border-radius: 50%;
        z-index: 2;
      }

      /* Smaller red circle — left of big one */
      .share-frame-red-corner2 {
        position: absolute;
        bottom: -80px;
        right: 200px;
        width: 260px;
        height: 260px;
        background: #c82a24;
        border-radius: 50%;
        z-index: 3;
      }
      .share-content {
        width: 1080px;
        position: relative;
        z-index: 2;
        padding: 36px 60px 40px;
        display: flex;
        flex-direction: column;
      }
      .trim-bottom .share-content { padding-bottom: 30px; }
      .has-bottom-block .share-content { padding-bottom: 24px; }
      .share-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 20px;
      }
      .share-title {
        font-size: 90px;
        font-weight: 800;
        line-height: 1.0;
        color: #045f80;
        white-space: nowrap;
      }
      .share-date-bar {
        text-align: right;
        font-size: 30px;
        font-weight: 500;
        color: #9ab6c4;
        white-space: nowrap;
        padding-top: 16px;
      }
      .share-dash {
        height: 2px;
        background-image: repeating-linear-gradient(
          to right,
          #5f99ae 0px, #5f99ae 12px,
          transparent 12px, transparent 22px
        );
        margin: 20px 0 16px;
        border: none;
      }
      .share-info-grid {
        display: grid;
        grid-template-columns: 270px minmax(0, 1fr);
        gap: 0 24px;
        font-size: 32px;
        line-height: 1.85;
        color: #045f80;
      }
      .share-info-labels,
      .share-info-values {
        display: grid;
        gap: 0;
        font-weight: 500;
        line-height: 1.85;
      }
      .share-table-head,
      .share-item-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 130px 130px 130px;
        column-gap: 16px;
        align-items: start;
      }
      .share-table-head {
        color: #045f80;
        font-size: 34px;
        font-weight: 900;
        padding: 0 0 6px;
      }
      .share-table-line {
        height: 3px;
        background-color: #045f80;
        border: none;
        margin-bottom: 10px;
      }
      .share-item-row {
        padding: 8px 0;
        color: #045f80;
        font-size: 28px;
        line-height: 1.85;
      }
      .share-col-product {
        text-align: left;
        padding-right: 8px;
        word-break: break-word;
      }
      .share-col-qty,
      .share-col-price,
      .share-col-subtotal {
        text-align: right;
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
      }
      /* total rows */
      .share-total-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        font-size: 30px;
        color: #045f80;
        font-weight: 600;
        margin: 6px 0;
        line-height: 1.9;
        padding: 2px 0;
      }
      .share-total-row span { white-space: nowrap; }
      .share-total-row.bold-row span:first-child { font-weight: 800; }

      /* payment row */
      .share-pay-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin: 6px 0;
        padding: 2px 0;
      }
      .share-pay-left {
        font-size: 30px;
        line-height: 1.9;
        font-weight: 600;
        color: #045f80;
        white-space: nowrap;
        display: flex;
        align-items: baseline;
        gap: 12px;
      }
      .share-pay-left strong {
        font-size: 30px;
        line-height: 1.9;
        font-weight: 800;
        white-space: nowrap;
      }
      .share-grand-wrap {
        text-align: right;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }
      .share-grand-total {
        font-size: 42px;
        line-height: 1.4;
        font-weight: 800;
        color: #045f80;
      }

      /* riel row */
      .share-riel-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        font-size: 30px;
        font-weight: 600;
        color: #2c7f9c;
        margin: 6px 0;
        line-height: 1.9;
        padding: 2px 0;
      }
      .share-riel-row span { white-space: nowrap; }
      .share-riel-row.bold-row span:first-child { font-weight: 800; }

      /* footer meta */
      .share-mini-meta {
        color: #2c7f9c;
        font-size: 24px;
        line-height: 2.0;
        margin: 14px 0 8px;
      }
      .share-disclaimer {
        font-size: 22px;
        color: #e53e3e;
        font-weight: 600;
        margin-top: 14px;
        padding: 12px 16px;
        background: rgba(229,62,62,.07);
        border-left: 4px solid #e53e3e;
        border-radius: 4px;
        line-height: 2.0;
      }
      .share-service-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 16px;
        color: #2c7f9c;
        font-size: 24px;
        line-height: 2.0;
        flex-wrap: nowrap;
        white-space: nowrap;
      }
      .share-bottom-separator {
        margin-top: 18px;
        margin-bottom: 20px;
      }
      .share-bottom-grid {
        display: grid;
        grid-template-columns: 430px minmax(0, 1fr);
        column-gap: 36px;
        align-items: end;
        min-height: 500px;
      }
      .share-bottom-grid.no-qr,
      .share-bottom-grid.no-number {
        grid-template-columns: minmax(0, 1fr);
      }
      .share-qr-side,
      .share-receipt-side {
        min-width: 0;
        display: flex;
      }
      .share-qr-side {
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
      }
      .share-qr-side.is-hidden,
      .share-receipt-side.is-hidden {
        display: none;
      }
      .share-qr-box {
        width: 470px;
        max-width: 100%;
        aspect-ratio: 1 / 1;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        background: transparent;
      }
      .share-qr-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
      }
      .share-qr-label {
        margin-top: 16px;
        font-size: 76px;
        line-height: 0.96;
        font-weight: 800;
        color: #045f80;
        text-align: center;
      }
      .share-qr-name {
        margin-top: 6px;
        font-size: 44px;
        line-height: 1.08;
        font-weight: 800;
        color: #045f80;
        text-align: center;
        text-transform: uppercase;
        word-break: break-word;
      }
      .share-qr-empty,
      .share-receipt-empty {
        width: 100%;
        min-height: 470px;
      }
      .share-receipt-side {
        min-height: 470px;
        border-left: 2px dashed #5f99ae;
        align-items: center;
        justify-content: center;
        padding-left: 26px;
        padding-bottom: 20px;
      }
      .share-bottom-grid.no-qr .share-receipt-side {
        border-left: none;
        padding-left: 0;
        justify-content: center;
      }
      .share-receipt-number {
        font-size: 190px;
        line-height: 0.88;
        font-weight: 800;
        color: #045f80;
        font-variant-numeric: tabular-nums;
        text-align: center;
      }
      .share-tail-space {
        height: 50px;
      }
    `;
  }

  function toAbsoluteUrl(path) {
    if (!path) return "";
    try {
      return new URL(path, window.location.href).href;
    } catch {
      return path;
    }
  }

  global.ShareReceipt = ShareReceipt;
})(window);
