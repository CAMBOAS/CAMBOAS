/**
 * export-delivery-report.js
 * Cambo Mini — Report Delivery (A4 Landscape)
 * window.CamboDeliveryReport.exportRows(rows, options)
 */
(function () {
  'use strict';
  var DEFAULT_RATE = 4100;

  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (s) {
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[s];
    });
  }
  function money(v) {
    var n = Number(v || 0);
    return '$' + n.toFixed(2).replace(/\.00$/, '');
  }
  function riel(v) {
    return Number(v || 0).toLocaleString('en-US') + ' ៛';
  }
  function fmtDate(v) {
    if (!v) return '-';
    var s = String(v).trim();
    // already DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      var p = s.slice(0,10).split('-');
      return p[2] + '/' + p[1] + '/' + p[0];
    }
    // any other parseable date string (e.g. "Wed Apr 08 2026")
    var d = new Date(s);
    if (!isNaN(d.getTime())) {
      var dd   = String(d.getDate()).padStart(2,'0');
      var mm   = String(d.getMonth()+1).padStart(2,'0');
      var yyyy = d.getFullYear();
      return dd + '/' + mm + '/' + yyyy;
    }
    return s;
  }
  function getDate(rows) {
    // Collect unique dates from rows
    var d = rows.map(function(r){ return String(r.date||'').trim(); }).filter(Boolean);
    var unique = d.filter(function(v,i,a){ return a.indexOf(v) === i; });
    // If all orders are on the same day → use that date
    if (unique.length === 1) return unique[0];
    // Multiple different dates → use today
    var t = new Date();
    var dd   = String(t.getDate()).padStart(2,'0');
    var mm   = String(t.getMonth()+1).padStart(2,'0');
    var yyyy = t.getFullYear();
    return dd + '/' + mm + '/' + yyyy;
  }
  function summarize(rows, rate) {
    var count     = rows.length;
    var totalAmt  = rows.reduce(function(s,r){ return s+Number(r.amt||r.total||0); }, 0);
    var rielTotal = Math.round(totalAmt * rate);
    return { count:count, totalAmt:totalAmt, rielTotal:rielTotal };
  }

  function buildRows(rows) {
    return rows.map(function(r, i) {
      var amt = Number(r.amt || r.total || 0);
      return '<tr>' +
        '<td class="c">'    + (i+1) + '</td>' +
        '<td class="nm">'   + esc(r.name||r.customer||'-') + '</td>' +
        '<td class="c">'    + esc(r.phone||'-') + '</td>' +
        '<td class="c mo">' + money(amt) + '</td>' +
        '<td class="loc">'  + esc(r.addr||r.address||r.province||'-') + '</td>' +
        '<td></td><td></td><td></td><td></td>' +
        '</tr>';
    }).join('\n');
  }

  function buildTemplate(rows, options) {
    var opts    = options || {};
    var rate    = Number(opts.exchangeRate || DEFAULT_RATE);
    var title   = opts.title || 'ភ្នំពេញ';
    var dateStr = fmtDate(getDate(rows));
    var s       = summarize(rows, rate);

    var css = [
      '@page{size:A4 landscape;margin:10mm}',
      'html,body{margin:0;padding:0;background:#e8e8e8}',
      'body{font-family:"Noto Sans Khmer",Arial,sans-serif;color:#111;font-size:13px}',
      '.no-print{display:flex;justify-content:flex-end;gap:10px;width:1150px;margin:10px auto 8px}',
      '.no-print button{border:0;padding:10px 22px;border-radius:10px;font:700 13px "Noto Sans Khmer",sans-serif;cursor:pointer}',
      '.btn-print{background:#1e293b;color:#fff}',
      '.btn-close{background:#f1f5f9;color:#1e293b;border:1px solid #cbd5e1!important}',
      '.sheet{width:1150px;margin:0 auto 18px;background:#fff;padding:28px 32px 28px;box-sizing:border-box}',
      '.rpt-date{font-size:17px;font-weight:700;color:#1e3a5f;margin-bottom:6px}',
      '.rpt-title{text-align:center;font-size:38px;font-weight:600;color:#1e3a5f;margin:0 0 18px;letter-spacing:.03em}',
      'table{width:100%;border-collapse:collapse;table-layout:fixed}',
      'col.c1{width:55px}col.c2{width:170px}col.c3{width:125px}col.c4{width:95px}',
      'col.c5{width:230px}col.c6{width:95px}col.c7{width:110px}col.c8{width:130px}col.c9{width:110px}',
      'th,td{border:1.5px solid #8096b4;padding:8px 7px;vertical-align:middle;font-size:13px}',
      'th{background:#1e3a5f;color:#fff;font-weight:700;text-align:center}',
      '.sr td{background:#c8d8ec!important;font-weight:700;color:#1e293b}',
      '.sr td.mo{color:#1d4ed8}',
      '.sr td.ri{background:#fef9e7!important;color:#92400e}',
      'tbody tr:nth-child(odd) td{background:#fff}',
      'tbody tr:nth-child(even) td{background:#f4f7fb}',
      '.c{text-align:center}.nm{text-align:left;font-weight:600}.loc{text-align:left;font-size:12px}.mo{font-weight:700;text-align:center}',
      '@media print{html,body{background:#fff!important}.no-print{display:none!important}.sheet{width:auto;margin:0;padding:0}}'
    ].join('\n');

    var summaryRow =
      '<tr class="sr">' +
      '<td class="c">'    + s.count + '</td>' +
      '<td class="c">'    + s.count + '</td>' +
      '<td class="c">'    + s.count + '</td>' +
      '<td class="c mo">' + money(s.totalAmt) + '</td>' +
      '<td class="c">'    + s.count + '</td>' +
      '<td class="c mo">$00</td>' +
      '<td class="c mo">' + money(s.totalAmt) + '</td>' +
      '<td class="c ri">' + riel(s.rielTotal) + '</td>' +
      '<td class="c mo">' + money(s.totalAmt) + '</td>' +
      '</tr>';

    return '<!DOCTYPE html><html lang="km"><head><meta charset="UTF-8"/>' +
      '<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Khmer:wght@400;600;700&display=swap" rel="stylesheet">' +
      '<style>' + css + '</style></head><body>' +
      '<div class="no-print">' +
        '<button class="btn-close" onclick="window.close()">✕ បិទ</button>' +
        '<button class="btn-print" onclick="window.print()">🖨️ បោះពុម្ព</button>' +
      '</div>' +
      '<div class="sheet">' +
        '<div class="rpt-date">របាយការណ៍ ថ្ងៃទី ' + esc(dateStr) + '</div>' +
        '<div class="rpt-title">' + esc(title) + '</div>' +
        '<table>' +
          '<colgroup>' +
            '<col class="c1"><col class="c2"><col class="c3"><col class="c4"><col class="c5">' +
            '<col class="c6"><col class="c7"><col class="c8"><col class="c9">' +
          '</colgroup>' +
          '<thead><tr>' +
            '<th>សរុបកញ្ចប់</th><th>ឈ្មោះ</th><th>លេខទូរសព្ទ</th><th>តម្លៃសរុប</th><th>ទីតាំង</th>' +
            '<th>តម្លៃដក</th><th>តម្លៃនៅសល់</th><th>តម្លៃសរុប ៛</th><th>តម្លៃសរុប $</th>' +
          '</tr></thead>' +
          '<tbody>' + summaryRow + '\n' + buildRows(rows) + '</tbody>' +
        '</table>' +
      '</div>' +
      '<script>' +
      'document.fonts.ready.then(function(){' +
        'window.print();' +
      '});' +
      'window.addEventListener("afterprint", function(){' +
        'window.close();' +
      '});' +
      '</script>' +
      '</body></html>';
  }

  function exportRows(rows, options) {
    if (!Array.isArray(rows) || !rows.length) {
      window.toast ? window.toast('មិនមានទិន្នន័យ','error') : alert('⚠️ មិនមានទិន្នន័យ');
      return;
    }
    var html = buildTemplate(rows, options);
    var w = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    if (!w) {
      alert('⚠️ Please allow popups for this site.');
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    // Auto-close window after print dialog is dismissed (Print or Cancel)
    w.onload = function() {
      w.addEventListener('afterprint', function() {
        w.close();
      });
    };
  }

  window.CamboDeliveryReport = { exportRows:exportRows, buildTemplate:buildTemplate };
})();
