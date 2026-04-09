
(function(){
  const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzd1g4M2oIFIl5MYkUnVd-WtxTzaEgXXepuIXYJ-KZboRNJGIOXfPOd8ANWX-dzay-ynQ/exec';
  const STORAGE_KEY = 'cambo_search_edit_orders_v3';
  function normalizeLooseText(value){ return String(value ?? '').replace(/\s+/g,' ').trim(); }
  function compactCompareText(value){ return String(value ?? '').toLowerCase().replace(/[\s\-_:|/\\]+/g,''); }
  function normalizeDeliveryName(value){
    const clean = compactCompareText(value);
    if (clean.includes('វិរៈប៊ុនថាំ') || clean.includes('virak') || clean.includes('buntham')) return 'វិរៈ ប៊ុនថាំ';
    if (clean.includes('ភ្នំពេញតាធំ')) return 'ភ្នំពេញ តាធំ';
    if (clean.includes('ភ្នំពេញតាតូច')) return 'ភ្នំពេញ តាតូច';
    if (clean.includes('ដឹកខ្លួនឯង')) return 'ដឹកខ្លួនឯង';
    if (clean.includes('drsb')) return 'DRSB';
    if (clean.includes('jt')) return 'J&T';
    return normalizeLooseText(value);
  }
  function pickFirst(obj, keys, fallback=''){ for(const key of keys){ if(obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key]; } return fallback; }
  function toNumber(value, fallback=0){ const n = Number(String(value ?? '').replace(/,/g,'').trim()); return Number.isFinite(n) ? n : fallback; }
  function toYMD(value){
    if (!value) return '';
    const text = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime())) return '';
    return `${parsed.getFullYear()}-${String(parsed.getMonth()+1).padStart(2,'0')}-${String(parsed.getDate()).padStart(2,'0')}`;
  }
  function sameLooseText(left,right){ return compactCompareText(left)===compactCompareText(right); }
  function aggregateServerOrders(rows){
    if (!Array.isArray(rows) || !rows.length) return [];
    const hasNestedOrders = rows.some((row)=>Array.isArray(row?.products));
    if (hasNestedOrders) return rows;
    const grouped = new Map();
    rows.forEach((raw,index)=>{
      const orderId = normalizeLooseText(pickFirst(raw,['id','orderId','OrderID','orderID'],`ROW-${index+1}`));
      const productName = normalizeLooseText(pickFirst(raw,['product','Product','productName','ProductName','name','Name'],''));
      const qty = toNumber(pickFirst(raw,['qty','QTY','quantity','Quantity'],1),1);
      const price = toNumber(pickFirst(raw,['price','Price'],0),0);
      const discount = toNumber(pickFirst(raw,['discount','Discount'],0),0);
      if(!grouped.has(orderId)) grouped.set(orderId, {
        id: orderId,
        date: pickFirst(raw,['date','dateTime','DateTime','datetime'],''),
        customer: pickFirst(raw,['customer','Customer'],''),
        phone: pickFirst(raw,['phone','Phone'],''),
        page: pickFirst(raw,['page','Page'],''),
        closeBy: pickFirst(raw,['closeBy','CloseBy'],''),
        province: pickFirst(raw,['province','Province'],''),
        address: pickFirst(raw,['address','detailAddress','Detail Address','detail_address'],''),
        payment: pickFirst(raw,['payment','Payment'],''),
        status: pickFirst(raw,['status','Status'],'Pending'),
        priority: pickFirst(raw,['priority','Priority'],'Medium'),
        deliveryName: pickFirst(raw,['deliveryName','delivery','DeliveryName','Delivery Name','delivery_name'],''),
        deliveryFee: pickFirst(raw,['deliveryFee','DeliveryFee'],0),
        note: pickFirst(raw,['note','Note'],''),
        receiptNo: pickFirst(raw,['receiptNo','ReceiptNo','receipt_no'],''),
        products: []
      });
      const target = grouped.get(orderId);
      if(productName){
        const duplicate = target.products.some((item)=> sameLooseText(item.name,productName) && Number(item.qty||0)===qty && Number(item.price||0)===price && Number(item.discount||0)===discount);
        if(!duplicate) target.products.push({name:productName, qty, price, discount});
      }
    });
    return [...grouped.values()];
  }
  function normalizePriority(value){ const text = String(value ?? '').trim().toLowerCase(); if(text==='high') return 'High'; if(text==='low') return 'Low'; return 'Medium'; }
  function normalizeOrder(order, i=0){
    const dateValue = pickFirst(order,['date','dateTime','DateTime','datetime'],new Date().toISOString().slice(0,10));
    const normalizedProducts = (Array.isArray(order.products) ? order.products : []).map((p)=> typeof p==='string' ? {name:p,qty:1,price:0,discount:0} : {
      name: normalizeLooseText(p.name || p.product || p.Product || ''),
      qty: toNumber(p.qty ?? p.QTY ?? p.quantity, 1),
      price: toNumber(p.price ?? p.Price, 0),
      discount: toNumber(p.discount ?? p.Discount, 0)
    }).filter((line)=> line.name || line.qty || line.price || line.discount);
    return {
      id: pickFirst(order,['id','orderId','OrderID','orderID'],`A${String(i+1).padStart(3,'0')}`),
      date: toYMD(dateValue) || String(dateValue).slice(0,10),
      customer: normalizeLooseText(pickFirst(order,['customer','Customer'],'')),
      phone: normalizeLooseText(pickFirst(order,['phone','Phone'],'')),
      page: normalizeLooseText(pickFirst(order,['page','Page'],'')),
      closeBy: normalizeLooseText(pickFirst(order,['closeBy','CloseBy'],'')),
      province: normalizeLooseText(pickFirst(order,['province','Province'],'')),
      address: normalizeLooseText(pickFirst(order,['address','detailAddress','Detail Address','detail_address'],'')),
      payment: normalizeLooseText(pickFirst(order,['payment','Payment'],'')),
      status: normalizeLooseText(pickFirst(order,['status','Status'],'Pending')) || 'Pending',
      priority: normalizePriority(pickFirst(order,['priority','Priority'],'Medium')),
      deliveryName: normalizeDeliveryName(pickFirst(order,['deliveryName','delivery','DeliveryName','Delivery Name','delivery_name'],'')),
      deliveryFee: toNumber(pickFirst(order,['deliveryFee','DeliveryFee'],0),0),
      note: normalizeLooseText(pickFirst(order,['note','Note'],'')),
      receiptNo: normalizeLooseText(pickFirst(order,['receiptNo','ReceiptNo','receipt_no'],'')),
      showQrEnabled: order.showQrEnabled !== false,
      products: normalizedProducts
    };
  }
  async function fetchOrders(limit=5000){
    try{
      const url = new URL(WEB_APP_URL); url.searchParams.set('action','list'); url.searchParams.set('limit', String(limit)); url.searchParams.set('_', Date.now());
      const res = await fetch(url.toString(), {method:'GET'});
      const data = await res.json();
      let rows = [];
      if (Array.isArray(data?.orders)) rows = data.orders;
      else if (Array.isArray(data?.data?.orders)) rows = data.data.orders;
      else if (Array.isArray(data?.rows)) rows = data.rows;
      else if (Array.isArray(data?.data)) rows = data.data;
      const aggregated = aggregateServerOrders(rows).map(normalizeOrder);
      if (aggregated.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(aggregated));
        return aggregated;
      }
    }catch(err){ console.warn('fetchOrders fallback to local', err); }
    try{
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(raw) ? raw.map(normalizeOrder) : [];
    }catch{ return []; }
  }
  function calcSubtotal(line){ return (Number(line.qty||0)*Number(line.price||0))-Number(line.discount||0); }
  function calcOrderTotal(order){ return (order.products||[]).reduce((sum, line)=> sum + calcSubtotal(line), 0) + Number(order.deliveryFee || 0); }
  function formatMoney(v){ const n=Number(v||0); return `$${n.toFixed(2).replace(/\.00$/,'')}`; }
  function formatDate(value){ if(!value) return '-'; const ymd = toYMD(value); if(!ymd) return String(value); const [y,m,d]=ymd.split('-'); return `${d}/${m}/${y}`; }
  window.CamboOrdersData = { fetchOrders, calcOrderTotal, formatMoney, formatDate, normalizePriority, normalizeDeliveryName, toYMD };
})();
