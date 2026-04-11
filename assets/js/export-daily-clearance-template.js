(function () {
  const DEFAULT_RATE = 4100;

  function escapeHtml(text) {
    return String(text ?? '').replace(/[&<>"']/g, (s) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));
  }

  function money(value) {
    const n = Number(value || 0);
    return `$${n.toFixed(2).replace(/\.00$/, '')}`;
  }

  function moneyPlain(value) {
    const n = Number(value || 0);
    return `${n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}$`;
  }

  function riel(value) {
    const n = Number(value || 0);
    return `${n.toLocaleString('en-US')} ៛`;
  }

  function toKhDate(value) {
    if (!value) return '-';
    const text = String(value).slice(0, 10);
    const parts = text.includes('-') ? text.split('-') : text.split('/');
    if (parts.length === 3 && parts[0].length === 4) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    if (parts.length === 3) return `${parts[0]}/${parts[1]}/${parts[2]}`;
    return value;
  }

  function calcLineSubtotal(line) {
    const qty = Number(line?.qty || 0);
    const price = Number(line?.price || 0);
    const discount = Number(line?.discount || 0);
    return (qty * price) - discount;
  }

  function calcOrderTotal(order) {
    const items = Array.isArray(order?.products) ? order.products : [];
    const itemsTotal = items.reduce((sum, item) => sum + calcLineSubtotal(item), 0);
    return itemsTotal + Number(order?.deliveryFee || 0);
  }

  function summarize(rows, exchangeRate) {
    const totalCustomers = rows.length;
    const salesTotal = rows.reduce((sum, row) => sum + calcOrderTotal(row), 0);
    const deliveryTotal = rows.reduce((sum, row) => sum + Math.max(0, Number(row?.deliveryFee || 0)), 0);
    const netTotal = salesTotal;
    const rielTotal = Math.round(netTotal * exchangeRate);
    return { totalCustomers, salesTotal, deliveryTotal, netTotal, rielTotal };
  }

  function getCommonDate(rows) {
    const values = [...new Set(rows.map((row) => String(row?.date || row?.dateTime || '').slice(0, 10)).filter(Boolean))];
    return values.length === 1 ? values[0] : (values[0] || '');
  }

  function getCommonDeliveryName(rows) {
    const values = [...new Set(rows.map((row) => String(row?.deliveryName || '').trim()).filter(Boolean))];
    return values.length === 1 ? values[0] : 'Delivery Name';
  }

  function buildBodyRows(rows) {
    return rows.map((row, index) => {
      const orderTotal = calcOrderTotal(row);
      const customer = String(row?.customer || '').trim() || 'Customer';
      const phone = String(row?.phone || '').trim() || '-';
      const location = String(row?.detailAddress  || row?.address || '').trim() || '-';
      return `
        <tr>
          <td class="center row-no">${index + 1}</td>
          <td class="customer-cell"><span class="customer-name">${escapeHtml(customer)}</span> <span class="phone-value">${escapeHtml(phone)}</span></td>
          <td class="money strong">${money(orderTotal)}</td>
          <td class="text kh">${escapeHtml(location)}</td>
          <td class="money"></td>
          <td class="money"></td>
          <td class="money"></td>
          <td class="money"></td>
        </tr>`;
    }).join('');
  }

  function buildTemplate(rows, options = {}) {
    const exchangeRate = Number(options.exchangeRate || DEFAULT_RATE);
    const commonDate = getCommonDate(rows) || new Date().toISOString().slice(0, 10);
    const deliveryName = getCommonDeliveryName(rows);
    const s = summarize(rows, exchangeRate);

    return `<!DOCTYPE html>
<html lang="km">
<head>
<meta charset="UTF-8" />
<link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  @page { size: A4 landscape; margin: 10mm; }
  html, body { margin: 0; padding: 0; background: #ececec; }
  body { font-family: 'Kantumruy Pro', Arial, sans-serif; color: #111; }
  .print-actions { display:flex; justify-content:flex-end; gap:10px; margin: 0 auto 12px; width: 1280px; }
  .print-actions button { border:0; background:#111827; color:#fff; padding:10px 16px; border-radius:10px; font:600 14px 'Kantumruy Pro',sans-serif; cursor:pointer; }
  .sheet { width: 1280px; margin: 0 auto 18px; background: white; padding: 34px 36px 24px; box-sizing: border-box; }
  .top-line { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 14px; }
  .top-line .date-left { font-size: 22px; font-weight: 500; }
  .title { text-align:center; font-size: 46px; line-height:1.15; font-weight: 500; margin: 0 0 18px; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th, td { border: 1.5px solid #595959; padding: 9px 8px; font-size: 16px; vertical-align: middle; }
  th { background: #b8cde1; font-weight: 700; text-align: center; }
  .date-head { background: #e9c1b8; }
  .sum-purple { background: #8f7bc8; color:#e11d48; font-weight:700; }
  .sum-cyan { background: #1fdbe8; color:#e11d48; font-weight:700; }
  .sum-yellow { background: #f0c233; color:#e11d48; font-weight:700; }
  .sum-green { background: #08ff00; color:#e11d48; font-weight:700; }
  .sum-green-soft { background: #99c27d; color:#e11d48; font-weight:700; }
  .blank { background: #fff; }
  .center { text-align:center; }
  .money { text-align:center; white-space:nowrap; }
  .text { text-align:center; }
  .kh { font-family:'Kantumruy Pro', Arial, sans-serif; }
  .strong { font-weight:700; }
  .summary-label { font-weight:700; }
  .customer-cell { text-align:center; }
  .customer-name { display:inline-block; min-width: 90px; }
  .phone-value { display:inline-block; min-width: 120px; }
  .row-no { font-size: 15px; }
  .main col:nth-child(1){ width: 110px; }
  .main col:nth-child(2){ width: 335px; }
  .main col:nth-child(3){ width: 110px; }
  .main col:nth-child(4){ width: 300px; }
  .main col:nth-child(5){ width: 95px; }
  .main col:nth-child(6){ width: 120px; }
  .main col:nth-child(7){ width: 160px; }
  .main col:nth-child(8){ width: 115px; }
  @media print {
    html, body { background:#fff; }
    .print-actions { display:none !important; }
    .sheet { width:auto; margin:0; padding:0; }
  }
</style>
</head>
<body>
<div class="sheet">
  <div class="top-line">
    <div class="date-left">របាយការណ៍ ថ្ងៃទី  ${escapeHtml(toKhDate(commonDate))}</div>
    <div></div>
  </div>
  <div class="title">${escapeHtml(deliveryName)}</div>
  <table class="main">
    <colgroup>
      <col><col><col><col><col><col><col><col>
    </colgroup>
    <tbody>
      <tr>
        <th>សរុបកញ្ចប់</th>
        <th>ឈ្មោះ / លេខទូរសព្ទន</th>
        <th>តម្លៃសរុប</th>
        <th>ទីតាំង</th>
        <th>តម្លៃដក</th>
        <th>តម្លៃនៅសល់</th>
        <th>តម្លៃនៅសល់ជា (៛)</th>
        <th>តម្លៃសរុប ($)</th>
      </tr>
      <tr>
        <td class="center sum-purple">${s.totalCustomers}</td>
        <td class="center sum-purple">${s.totalCustomers}</td>
        <td class="money sum-cyan">${money(s.salesTotal)}</td>
        <td class="center sum-yellow">${s.totalCustomers}</td>
        <td class="money sum-yellow">${money(s.deliveryTotal)}</td>
        <td class="money sum-green">${money(s.netTotal)}</td>
        <td class="money sum-green-soft">${riel(s.rielTotal)}</td>
        <td class="money sum-cyan">${money(s.netTotal)}</td>
      </tr>
      ${buildBodyRows(rows)}
    </tbody>
  </table>
</div>

</body>
</html>`;
  }

  function exportRows(rows, options = {}) {
    if (!Array.isArray(rows) || !rows.length) {
      if (window.toast) window.toast('មិនមានទិន្នន័យសម្រាប់ Export ទេ។', 'error');
      else alert('មិនមានទិន្នន័យសម្រាប់ Export ទេ។');
      return;
    }

    const html = buildTemplate(rows, options);
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);

    const frameWindow = iframe.contentWindow;
    const frameDoc = frameWindow.document;
    frameDoc.open();
    frameDoc.write(html);
    frameDoc.close();

    const runPrint = () => {
      setTimeout(() => {
        try {
          frameWindow.focus();
          frameWindow.print();
        } finally {
          setTimeout(() => {
            iframe.remove();
          }, 1200);
        }
      }, 250);
    };

    iframe.onload = runPrint;
    if (frameDoc.readyState === 'complete') runPrint();
  }

  window.CamboDailyClearanceTemplate = { exportRows, buildTemplate };
})();
