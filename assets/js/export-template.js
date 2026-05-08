
(function () {
  const RATE = 4100;

  function money(n){ return '$' + Number(n||0).toFixed(2).replace('.00',''); }
  function riel(n){ return Number(n||0).toLocaleString() + ' ៛'; }

  function build(rows){
    const totalCustomers = rows.length;
    const total = rows.reduce((s,r)=> s + Number(r.total||0),0);
    const delivery = rows.reduce((s,r)=> s + Number(r.deliveryFee||0),0);
    const net = total;
    const rielTotal = Math.round(net * RATE);

    const body = rows.map((r,i)=>`
      <tr>
        <td>${i+1}</td>
        <td>Customer</td>
        <td>${r.phone||''}</td>
        <td>${money(r.total)}</td>
        <td>${r.province||''}</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    `).join('');

    return `
    <html>
    <head>
    <style>
      @page { size: A4 landscape; margin:10mm; }
      body{font-family: Arial;}
      table{width:100%; border-collapse:collapse;}
      th,td{border:1px solid #000; padding:6px; text-align:center;}
      th{background:#bcd;}
      .red{color:red;}
    </style>
    </head>
    <body>

    <h2 style="text-align:center;">Delivery Name</h2>

    <table>
      <tr>
        <th>ល.រ</th>
        <th>Customer</th>
        <th>Phone</th>
        <th>តម្លៃ</th>
        <th>ទីតាំង</th>
        <th>ដឹក</th>
        <th>សរុប</th>
        <th>៛</th>
      </tr>

      <tr class="red">
        <td>${totalCustomers}</td>
        <td>${totalCustomers}</td>
        <td>${money(total)}</td>
        <td>${totalCustomers}</td>
        <td>${money(delivery)}</td>
        <td>${money(net)}</td>
        <td>${riel(rielTotal)}</td>
        <td>${money(net)}</td>
      </tr>

      ${body}

    </table>

    </body>
    </html>
    `;
  }

  function exportRows(rows){
    const w = window.open('');
    w.document.write(build(rows));
    w.document.close();
    w.print();
  }

  window.CamboExport = { exportRows };
})();
