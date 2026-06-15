(function(){
'use strict';

var SCRIPT_URL = (window.CamboAPI && window.CamboAPI.getBase()) ||
  'https://script.google.com/macros/s/AKfycbzCMeZ_UUUQX2t2ITwS-ucyyn8HMFST0s-Kqyho_b5Gf5VlKN6xDOjlxY6-J8x4nYyQFg/exec';
/* localStorage cache removed — always fetch direct from Google Sheet */

var _orders = [], _sel = new Set();
var _qrOn = true; // QR Code toggle state
var _sort = {col:'date', dir:'desc'};
var _q = '', _f = {};
var _date = {preset:'today', start:'', end:'', label:'Today'}; // start/end filled on DOMContentLoaded

/* ── helpers ── */
function $id(id){ return document.getElementById(id); }
function isDark(){ return document.documentElement.getAttribute('data-theme') !== 'light'; }
function themeVal(dark, light){ return isDark() ? dark : light; }
function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* Convert any date string → DD/MM/YYYY */
function fmtDisplay(s){
  if(!s) return '';
  // Already DD/MM/YYYY (with optional time after)
  if(/^\d{2}\/\d{2}\/\d{4}/.test(s)) return s.slice(0,10);
  // YYYY-MM-DD (date-only, no timezone) — safe to slice
  if(/^\d{4}-\d{2}-\d{2}$/.test(s)){ var p=s.split('-'); return p[2]+'/'+p[1]+'/'+p[0]; }
  // YYYY-MM-DDTHH:MM with NO timezone suffix — safe to slice (local time)
  if(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s) && !/Z|[+-]\d{2}:?\d{2}$/.test(s)){
    var p=s.slice(0,10).split('-'); return p[2]+'/'+p[1]+'/'+p[0];
  }
  // ISO with Z or +07:00 suffix — MUST parse via Date() to get LOCAL date (not UTC)
  try{
    var d = new Date(s);
    if(!isNaN(d)){
      return pad(d.getDate())+'/'+pad(d.getMonth()+1)+'/'+d.getFullYear();
    }
  }catch(e){}
  return s;
}

/* fmtDisplayFull — show date + time when time is available (not midnight 00:00) */
function fmtDisplayFull(s){
  if(!s) return '';
  var str = String(s).trim();
  // DD/MM/YYYY HH:MM... → show date + time
  var m1 = str.match(/^(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})/);
  if(m1) return m1[1]+' '+m1[2];
  // ISO with Z or timezone offset — parse via Date() to get LOCAL time
  if(/^\d{4}-\d{2}-\d{2}T/.test(str) && (/Z$/.test(str) || /[+-]\d{2}:?\d{2}$/.test(str))){
    try{
      var d = new Date(str);
      if(!isNaN(d)){
        var dateStr = pad(d.getDate())+'/'+pad(d.getMonth()+1)+'/'+d.getFullYear();
        var hh2 = d.getHours(), mm2 = d.getMinutes();
        return (hh2===0 && mm2===0) ? dateStr : dateStr+' '+pad(hh2)+':'+pad(mm2);
      }
    }catch(e){}
  }
  // YYYY-MM-DDTHH:MM (no timezone, local time) → safe regex parse
  var m2 = str.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if(m2){
    var dateStr = m2[3]+'/'+m2[2]+'/'+m2[1];
    var hh = m2[4], mm = m2[5];
    // Hide midnight (00:00) — date-only orders saved without real time
    return (hh==='00' && mm==='00') ? dateStr : dateStr+' '+hh+':'+mm;
  }
  // Fallback to date-only
  return fmtDisplay(s);
}

/* toDatetimeLocalEdit — like toDatetimeLocal but replaces midnight 00:00 with current time
   Used in edit mode so old date-only orders don't show "12:00 AM" */
function toDatetimeLocalEdit(s){
  var base = toDatetimeLocal(s);
  var now  = new Date();
  var padN = function(x){ return String(x).padStart(2,'0'); };
  var curTime = padN(now.getHours())+':'+padN(now.getMinutes());
  if(!base){
    // No date at all → full current datetime
    return now.getFullYear()+'-'+padN(now.getMonth()+1)+'-'+padN(now.getDate())+'T'+curTime;
  }
  // If time is midnight (00:00) → replace with current time
  if(base.slice(11,16) === '00:00'){
    return base.slice(0,11)+curTime;
  }
  return base;
}

/* Format YYYY-MM-DDTHH:MM → "DD/MM/YY HH:MM AM/PM" for custom date display */
function fmtDtDisplay(s){
  if(!s) return '';
  var m = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if(!m) return s;
  var hh = parseInt(m[4],10), mi = m[5];
  var ampm = hh >= 12 ? 'PM' : 'AM';
  var h12 = hh % 12 || 12;
  var yy = m[1].slice(2);
  return m[3]+'/'+m[2]+'/'+yy+' '+pad(h12)+':'+mi+' '+ampm;
}
window.fmtDtDisplay = fmtDtDisplay;

/* Convert any date format → "YYYY-MM-DDTHH:MM" for datetime-local input */
function toDatetimeLocal(s){
  if(!s) return '';
  // Already datetime-local: YYYY-MM-DDTHH:MM
  if(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return s.slice(0,16);
  // ISO with Z: YYYY-MM-DDTHH:MM:SS.sssZ
  if(/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.replace('Z','').slice(0,16);
  // YYYY-MM-DD only
  if(/^\d{4}-\d{2}-\d{2}$/.test(s)) return s+'T00:00';
  // DD/MM/YYYY HH:MM or DD/MM/YYYY
  if(/^\d{2}\/\d{2}\/\d{4}/.test(s)){
    var parts = s.split(' ');
    var dp = parts[0].split('/');          // [DD, MM, YYYY]
    var dateStr = dp[2]+'-'+dp[1]+'-'+dp[0];
    var timeStr = (parts[1]||'00:00').slice(0,5);
    return dateStr+'T'+timeStr;
  }
  // Fallback: try JS Date parse
  try{
    var d = new Date(s);
    if(!isNaN(d)){
      return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())
            +'T'+pad(d.getHours())+':'+pad(d.getMinutes());
    }
  }catch(e){}
  return '';
}

/* ── position:fixed dropdown helper ── */
function positionDrop(drop, btn){
  var rect = btn.getBoundingClientRect();
  var vw   = window.innerWidth;
  var vh   = window.innerHeight;
  var w    = drop.offsetWidth || parseInt(drop.style.width) || 200;

  // Horizontal: align right edge, clamp to viewport
  var left = rect.right - w;
  if(left < 8) left = 8;
  if(left + w > vw - 8) left = vw - w - 8;

  var spaceBelow = vh - rect.bottom - 10;
  var spaceAbove = rect.top - 10;

  // Reset max-height and measure natural height using correct display type
  drop.style.maxHeight = '';
  drop.style.top  = '-9999px';
  drop.style.left = left + 'px';
  var needFlex = (drop.id === 'olFilterDropdown');
  drop.style.display = needFlex ? 'flex' : 'block';
  if(needFlex) drop.style.flexDirection = 'column';
  var dropH = drop.scrollHeight;
  drop.style.display = '';
  drop.style.flexDirection = '';
  drop.style.top = '';

  if(dropH <= spaceBelow){
    // Fits below — no constraint needed
    drop.style.top       = (rect.bottom + 6) + 'px';
    drop.style.maxHeight = '';
  } else if(spaceAbove > spaceBelow && spaceAbove > 150){
    // More space above — flip upward
    var mh = Math.min(spaceAbove, dropH);
    drop.style.top       = (rect.top - mh - 6) + 'px';
    drop.style.maxHeight = mh + 'px';
  } else {
    // Use space below, constrain height
    drop.style.top       = (rect.bottom + 6) + 'px';
    drop.style.maxHeight = Math.max(spaceBelow, 150) + 'px';
  }
  drop.style.left = left + 'px';
}

function closeAllDrops(){
  document.querySelectorAll('.ol-dropdown.open').forEach(function(d){ d.classList.remove('open'); });
  var bd = document.getElementById('olBackdrop');
  if(bd) bd.classList.remove('show');
}

// Backdrop click closes all dropdowns
document.addEventListener('DOMContentLoaded', function(){
  var bd = document.getElementById('olBackdrop');
  if(bd) bd.addEventListener('click', closeAllDrops);
});

document.addEventListener('click', function(e){
  if(!e.target.closest('.ol-dropdown') && !e.target.closest('[id$="Btn"]') && !e.target.closest('[id$="Btn2"]')){
    closeAllDrops();
  }
});

/* ── data ── */
async function loadOrders(){
  try{
    var d = window.CamboAPI
      ? await window.CamboAPI.get({action:'list',limit:1000})
      : await fetch(SCRIPT_URL+'?action=list&limit=1000&_='+Date.now()).then(function(r){return r.json();});
    var arr = Array.isArray(d?.orders)?d.orders
             :Array.isArray(d?.data?.orders)?d.data.orders
             :Array.isArray(d?.rows)?d.rows
             :Array.isArray(d?.data)?d.data
             :null;
    if(arr) return normalizeOrders(arr);
    return [];
  }catch(e){ return []; }
}
function fixPhone(v){
  var ph = String(v||'').trim();
  // Cambodian numbers: 7–10 digits without leading 0 → add 0 prefix
  if(ph && /^[1-9]\d{6,9}$/.test(ph)) ph = '0' + ph;
  return ph;
}
function normalizeOrders(arr){
  return (Array.isArray(arr)?arr:[]).map(function(o){
    // Normalize field names: Sheet may return Capital or camelCase keys
    function pick(keys){ for(var i=0;i<keys.length;i++){ if(o[keys[i]]!==undefined&&o[keys[i]]!==null&&o[keys[i]]!=='') return o[keys[i]]; } return ''; }
    var norm = {
      id:           o.id||o.ID||o.orderId||o.OrderId||(Date.now()+Math.random()),
      date:         pick(['date','Date','dateTime','DateTime','ORDER DATE']),
      customer:     pick(['customer','Customer','CUSTOMER','name','Name']),
      phone:        pick(['phone','Phone','PHONE','tel','Tel']),
      province:     pick(['province','Province','PROVINCE']),
      addressDetail:pick(['addressDetail','address','Address','detailAddress','Detail Address']),
      address:      pick(['addressDetail','address','Address','detailAddress','Detail Address']),
      page:         pick(['page','Page','PAGE','pages','Pages']),
      pages:        pick(['page','Page','pages','Pages']),
      closeBy:      pick(['closeBy','CloseBy','CLOSEBY','closeby','close_by']),
      closeby:      pick(['closeBy','CloseBy','closeby']),
      status:       pick(['status','Status','STATUS','orderStatus'])||'Pending',
      orderStatus:  pick(['status','Status','orderStatus'])||'Pending',
      priority:     pick(['priority','Priority'])||'Medium',
      payment:      pick(['payment','Payment','PAYMENT']),
      deliveryName: pick(['deliveryName','delivery','DeliveryName','Delivery','DELIVERY','delivery_name']),
      deliveryFee:  Number(pick(['deliveryFee','DeliveryFee','delivery_fee','Delivery Fee'])||0),
      note:         pick(['note','Note','NOTE']),
      receiptNo:    pick(['receiptNo','ReceiptNo','receipt_no']),
      products:     o.products||o.Products||o.items||[],
    };
    // Fix phone leading zero
    norm.phone = fixPhone(norm.phone||o.phone||'');
    // Keep original fields too (for compatibility)
    Object.assign(norm, o);
    // Override with normalized values
    norm.customer     = norm.customer     || pick(['customer','Customer','name','Name']);
    norm.phone        = fixPhone(pick(['phone','Phone','tel','Tel']));
    norm.date         = pick(['dateTime','DateTime','date','Date']); // prefer full datetime (incl. time) over date-only
    norm.province     = pick(['province','Province']);
    norm.page         = pick(['page','Page','pages','Pages']);
    norm.closeBy      = pick(['closeBy','CloseBy','closeby']);
    norm.status       = pick(['status','Status','orderStatus'])||'Pending';
    norm.deliveryName = pick(['deliveryName','delivery','DeliveryName','Delivery']);
    norm.deliveryFee  = Number(pick(['deliveryFee','DeliveryFee','delivery_fee'])||0);
    norm.note         = pick(['note','Note']);
    norm.addressDetail= pick(['addressDetail','address','Address','detailAddress']);
    norm.address      = norm.addressDetail;
    return norm;
  });
}

/* ── date ── */
function todayYMD(){ var d=new Date(); return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
function pad(n){ return String(n).padStart(2,'0'); }
function shiftDate(ymd,n){ var d=new Date(ymd+'T00:00:00'); d.setDate(d.getDate()+n); return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
function monthRange(d){ var s=new Date(d.getFullYear(),d.getMonth(),1),e=new Date(d.getFullYear(),d.getMonth()+1,0); return {start:fmt(s),end:fmt(e)}; }
function fmt(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
function displayDate(ymd){ if(!ymd) return ''; var p=ymd.split('-'); return p[2]+'/'+p[1]+'/'+p[0]; }

function getPreset(p){
  var t=todayYMD(), now=new Date(t+'T00:00:00');
  if(p==='today')     return {start:t,end:t,label:'Today'};
  if(p==='yesterday') { var y=shiftDate(t,-1); return {start:y,end:y,label:'Yesterday'}; }
  if(p==='last7')     return {start:shiftDate(t,-6),end:t,label:'Last 7 Days'};
  if(p==='lastMonth') { var m=new Date(now.getFullYear(),now.getMonth()-1,1); var r=monthRange(m); return {...r,label:'Last Month'}; }
  if(p==='all')       return {start:'',end:'',label:'All Time'};
  var r=monthRange(now); return {...r,label:'This Month'};
}

function parseD(s){
  if(!s) return null;
  s = String(s).trim();
  if(!s) return null;
  // DD/MM/YYYY (optional time after)
  var m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if(m){
    var hh = m[4]||'00', mi = m[5]||'00', ss = m[6]||'00';
    return new Date(m[3]+'-'+m[2]+'-'+m[1]+'T'+hh+':'+mi+':'+ss);
  }
  // YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS or with Z
  if(/^\d{4}-\d{2}-\d{2}/.test(s)){
    var d = new Date(s);
    if(!isNaN(d)) return d;
    return new Date(s.slice(0,10)+'T00:00:00');
  }
  // Try general parse
  var dt = new Date(s);
  return isNaN(dt) ? null : dt;
}
function inDate(o){
  // 'all' preset → show ALL orders (including no-date)
  if(_date.preset==='all') return true;
  // No date filter set → show all
  if(!_date.start && !_date.end) return true;
  var d=parseD(o.date);
  // Order has no date or invalid date → HIDE (date filter active, exclude unknown dates)
  if(!d||isNaN(d)) return false;
  var t=new Date(d.getFullYear(),d.getMonth(),d.getDate());
  if(_date.start){ var s=new Date(_date.start+'T00:00:00'); if(t<s) return false; }
  if(_date.end)  { var e=new Date(_date.end  +'T00:00:00'); if(t>e) return false; }
  return true;
}

/* ── helper: get product lines regardless of field name ── */
function getProds(o){
  return (Array.isArray(o.items)    && o.items.length    ? o.items    : null)
      || (Array.isArray(o.products) && o.products.length ? o.products : null)
      || [];
}

/* ── Unit helpers ── */
function getProdUnit(p){
  // Name suffix is most reliable — "(unit)" is always appended for non-default units
  var m=(p.name||'').match(/\(([^)]+)\)\s*$/);
  if(m) return m[1].trim();
  // Fall back to explicit unit field
  if(p.unit && p.unit.trim()) return String(p.unit).trim();
  return 'ឈុត';
}
function cleanProdName(p){
  // Always strip trailing "(unit)" suffix so name input stays clean
  return (p.name||'').replace(/\s*\([^)]+\)\s*$/,'').trim();
}
function unitBadgeStyle(unit){
  if(unit==='កេស') return 'background:rgba(14,165,233,.18);color:#38bdf8;border:1px solid rgba(14,165,233,.35)';
  if(unit==='លាយ') return 'background:rgba(245,158,11,.18);color:#fbbf24;border:1px solid rgba(245,158,11,.35)';
  return 'background:rgba(124,92,255,.18);color:#a78bfa;border:1px solid rgba(124,92,255,.35)';
}
function unitBadgeHtml(p){
  var u=getProdUnit(p);
  return '<span style="display:inline-block;margin-top:3px;padding:1px 8px;border-radius:10px;font-size:10px;font-weight:800;letter-spacing:.02em;'+unitBadgeStyle(u)+'">'+esc(u)+'</span>';
}

/* ── filter ── */
function orderTotal(o){ return getProds(o).reduce(function(s,p){return s+Number(p.qty||0)*Number(p.price||0)-Number(p.discount||0);},0)+Number(o.deliveryFee||0); }

function getFiltered(){
  return _orders.filter(function(o){
    if(_q && !(o.customer||'').toLowerCase().includes(_q) && !(o.phone||'').includes(_q)) return false;
    if(_f.delivery){
      var dn = normalizeDeliveryName(o.deliveryName||'');
      if(dn!==_f.delivery) return false;
    }
    if(_f.province){
      var pv=(o.province||'').trim();
      if(_f.province==='រាជធានីភ្នំពេញ'){
        // Exact match Phnom Penh
        if(pv!=='រាជធានីភ្នំពេញ') return false;
      } else if(_f.province==='ខេត្ត'){
        // All other provinces
        if(pv==='រាជធានីភ្នំពេញ'||pv==='') return false;
      } else {
        if(!pv.includes(_f.province)) return false;
      }
    }
    if(_f.status   && (o.status||o.orderStatus||'')!==_f.status) return false;
    if(_f.pages){
      var pg=(o.page||o.pages||'').trim();
      if(pg!==_f.pages) return false;
    }
    if(_f.priority && (o.priority||'')!==_f.priority) return false;
    if(_f.closeBy){
      var cb=(o.closeBy||o.closeby||'').trim();
      if(cb.toLowerCase()!==_f.closeBy.toLowerCase()) return false;
    }
    if(!inDate(o)) return false;
    return true;
  }).sort(function(a,b){
    var av,bv;
    if(_sort.col==='date'){av=parseD(a.date)||0;bv=parseD(b.date)||0;}
    else if(_sort.col==='customer'){av=(a.customer||'').toLowerCase();bv=(b.customer||'').toLowerCase();}
    else if(_sort.col==='total'){av=orderTotal(a);bv=orderTotal(b);}
    else return 0;
    return _sort.dir==='asc'?(av<bv?-1:av>bv?1:0):(av>bv?-1:av<bv?1:0);
  });
}

/* ── stats ── */
function updateStats(rows){
  // Stats based on FILTERED rows (not all orders)
  var t   = rows.length;
  var rev = rows.reduce(function(s,o){ return s+orderTotal(o); }, 0);

  // Top Agent — closeBy with most orders in filtered rows
  var agentMap = {};
  rows.forEach(function(o){
    var a = (o.closeBy||o.closeby||'').trim();
    if(!a) return;
    if(!agentMap[a]) agentMap[a] = { count:0, rev:0 };
    agentMap[a].count++;
    agentMap[a].rev += orderTotal(o);
  });
  var topAgent = '—', topAgentCount = '';
  Object.keys(agentMap).forEach(function(a){
    if(topAgent==='—' || agentMap[a].count > agentMap[topAgent].count) topAgent = a;
  });
  if(topAgent !== '—'){
    var d = agentMap[topAgent];
    topAgentCount = d.count + ' orders · $' + d.rev.toFixed(2);
  }

  // Latest customer from filtered rows (respects date/search filter)
  var latestCust = '—', latestPhone = '', latestTotal = '';
  for (var i = 0; i < rows.length; i++) {
    var cn = (rows[i].customer || '').trim();
    if (cn) {
      latestCust  = cn;
      latestPhone = (rows[i].phone || '').trim();
      latestTotal = '$' + orderTotal(rows[i]).toFixed(2);
      break;
    }
  }

  $id('olTotal').textContent      = t;
  $id('olRevenue').textContent    = '$'+rev.toFixed(2);
  $id('olFooter').textContent     = 'Showing '+rows.length+' of '+_orders.length+' records';
  var ta = $id('olTopAgent');      if(ta) ta.textContent = topAgent;
  var tc = $id('olTopAgentCount'); if(tc) tc.textContent = topAgentCount;
  $id('olLatestCust').textContent = latestCust;
  var ph = $id('olLatestPhone'); if(ph) ph.textContent = latestPhone;
  var lt = $id('olLatestTotal'); if(lt) lt.textContent = latestTotal;
}

/* ── render ── */
function render(){
  var rows = getFiltered();
  updateStats(rows);

  // Selected badge
  var sel = $id('olSel'), cnt = $id('olSelCnt');
  if(sel){ sel.classList.toggle('show', _sel.size>0); }
  if(cnt) cnt.textContent = _sel.size;

  // Select all checkbox
  var chkAll = $id('olChkAll');
  if(chkAll){ chkAll.checked = rows.length>0 && rows.every(function(o){return _sel.has(String(o.id));}); chkAll.indeterminate = _sel.size>0 && !chkAll.checked; }

  var tbody = $id('olBody');
  if(!tbody) return;

  if(!rows.length){
    var emptyMsg = _date.preset === 'today'
      ? '📭 គ្មាន Order ថ្ងៃនេះ (' + displayDate(todayYMD()) + ')'
      : _date.preset === 'all'
        ? '📭 គ្មាន Order ទាំងអស់'
        : '📭 គ្មាន Order ' + (_date.start === _date.end
            ? displayDate(_date.start)
            : displayDate(_date.start) + ' → ' + displayDate(_date.end));
    tbody.innerHTML = '<tr><td colspan="10" class="ol-empty">' + emptyMsg + '</td></tr>';
    // Clear mobile card view too
    try { if(typeof window._olRenderCards==='function') window._olRenderCards([]); } catch(e){}
    return;
  }

  tbody.innerHTML = rows.map(function(o, idx){
    var total = orderTotal(o);
    var prods = getProds(o);
    // Show first product + (+N) for rest
    var first = prods[0] ? esc(prods[0].name||'')+(prods[0].qty>1?' <b style="color:#8b5cf6">×'+prods[0].qty+'</b>':'') : '';
    var ptxt = first;
    if(prods.length > 1){
      ptxt += ' <span style="color:#8b5cf6;font-weight:700;background:rgba(139,92,246,.1);padding:1px 6px;border-radius:6px;font-size:11px;margin-left:4px">+'+(prods.length-1)+'</span>';
    }
    var pmore = '';
    var selected = _sel.has(String(o.id));
    return '<tr class="'+(selected?'sel':'')+'" data-id="'+o.id+'">'
      +'<td class="ol-cb-th ol-col-cb"><input type="checkbox" class="ol-chk" data-id="'+o.id+'" '+(selected?'checked':'')+' onclick="event.stopPropagation()"></td>'
      +'<td class="ol-col-num">'+(idx+1)+'</td>'
      +'<td class="ol-customer ol-col-cust">'+esc(o.customer||'—')+'</td>'
      +'<td class="ol-phone ol-col-tel">'+esc(o.phone||'')+'</td>'
      +'<td class="ol-col-prov">'+esc(o.province||'')+'</td>'
      +'<td class="ol-col-prod">'+ptxt+'</td>'
      +'<td class="ol-muted ol-col-page">'+esc(o.page||o.pages||'')+'</td>'
      +'<td class="ol-muted ol-col-cb2">'+esc(o.closeBy||o.closeby||'')+'</td>'
      +'<td class="ol-total ol-col-tot">$'+total.toFixed(2)+'</td>'
      +'<td class="ol-muted ol-col-date">'+fmtDisplay(o.date)+'</td>'
      +'</tr>';
  }).join('');

  // Sync card view (wrapped so any error doesn't prevent row-click setup below)
  try { if(typeof window._olRenderCards==='function') window._olRenderCards(rows); } catch(e) { console.warn('Card render error:', e); }

  // Row click → open drawer
  // Checkbox click → toggle selection
  tbody.querySelectorAll('tr').forEach(function(tr){
    // Row click (not on checkbox) → open drawer
    tr.addEventListener('click', function(e){
      if(e.target.classList.contains('ol-chk') || e.target.closest('.ol-cb-th')) return;
      olOpenDrawer(tr.dataset.id);
    });
  });

  // Checkbox change → toggle _sel
  tbody.querySelectorAll('.ol-chk').forEach(function(chk){
    chk.addEventListener('change', function(e){
      e.stopPropagation();
      var id = String(chk.dataset.id);
      if(chk.checked){ _sel.add(id); } else { _sel.delete(id); }
      // Update row highlight
      var row = chk.closest('tr');
      if(row) row.classList.toggle('sel', chk.checked);
      updateSelBadge();
    });
    // Also handle click to prevent row click firing
    chk.addEventListener('click', function(e){ e.stopPropagation(); });
  });
}

function updateSelBadge(){
  var sel=$id('olSel'),cnt=$id('olSelCnt');
  if(sel) sel.classList.toggle('show',_sel.size>0);
  if(cnt) cnt.textContent=_sel.size;
}

/* ── date label ── */
function updateDateBtn(){
  var btn  = $id('olDateBtn');
  var chip = $id('olDateChip');
  if(btn) btn.textContent = _date.label || 'Date';
  if(chip){
    // Show chip ONLY for custom date range (start ≠ end)
    // Hide for: today, yesterday, last7, thisMonth, lastMonth, all
    var singlePresets = ['today','yesterday','last7','thisMonth','lastMonth','all'];
    var isCustomRange = _date.preset === 'custom' && _date.start && _date.end && _date.start !== _date.end;
    var show = isCustomRange;
    chip.classList.toggle('show', show);
    if(show) chip.textContent = displayDate(_date.start)+' → '+displayDate(_date.end);
  }
  // highlight active in popup
  document.querySelectorAll('#olDatePop [data-p]').forEach(function(b){
    b.classList.toggle('active', b.dataset.p===_date.preset);
  });
}

/* ── export / print ── */
function getSrc(){
  if(_sel.size > 0){
    return _orders.filter(function(o){ return _sel.has(String(o.id)); });
  }
  return getFiltered();
}

/* Reload fresh from Sheet */
async function refreshFromSheet(){
  _orders = await loadOrders();
  populateFilterOptions();
  render();
  hideBadge();
}

/* ── Auto-refresh (silent background poll every 30s) ── */
var _autoRefreshTimer = null;
var _knownIds = new Set();

function buildKnownIds(orders){
  var s = new Set();
  orders.forEach(function(o){ if(o.id) s.add(String(o.id)); });
  return s;
}

function hideBadge(){
  var b = $id('olNewBadge'); if(b) b.classList.remove('show');
  var dot = $id('olSyncDot'); if(dot) dot.classList.remove('active');
}

window.olDismissNewBadge = function(){
  hideBadge();
  var btn = $id('olSyncBtn');
  if(btn){ btn.classList.add('spinning'); setTimeout(function(){ btn.classList.remove('spinning'); }, 700); }
  refreshFromSheet();
};

async function silentPoll(){
  /* skip poll while drawer is open — avoid disrupting user mid-edit */
  if(document.body.classList.contains('drawer-open')) return;
  try {
    var fresh = await loadOrders();
    if(!fresh || !fresh.length) return;
    var newOnes = fresh.filter(function(o){ return o.id && !_knownIds.has(String(o.id)); });
    if(newOnes.length > 0){
      var badge = $id('olNewBadge');
      var text  = $id('olNewBadgeText');
      if(text) text.textContent = '🔔 ' + newOnes.length + ' order ថ្មី — ចុចដើម្បីបង្ហាញ';
      if(badge) badge.classList.add('show');
      // pulse the sync dot in toolbar
      var dot = $id('olSyncDot'); if(dot) dot.classList.add('active');
    }
  } catch(e){ /* silent fail */ }
}

function startAutoRefresh(){
  _knownIds = buildKnownIds(_orders);
  if(_autoRefreshTimer) clearInterval(_autoRefreshTimer);
  _autoRefreshTimer = setInterval(silentPoll, 30000);
}

function exportCSV(){
  var src=getSrc();
  var rows=[['Date','Customer','Phone','Province','Products','Page','CloseBy','Total','Status']];
  src.forEach(function(o){ rows.push([o.date||'',o.customer||'',o.phone||'',o.province||'',getProds(o).map(function(p){return p.name+'×'+(p.qty||1);}).join('|'),o.page||o.pages||'',o.closeBy||o.closeby||'',orderTotal(o).toFixed(2),o.status||o.orderStatus||'']); });
  var csv=rows.map(function(r){return r.map(function(v){return '"'+(v||'')+'"';}).join(',');}).join('\n');
  var a=document.createElement('a'); a.href='data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(csv); a.download='orders_'+todayYMD()+'.csv'; a.click();
}

function printTable(){
  var src = getFiltered();
  if(!src.length){ _olShowToast('គ្មានទិន្នន័យ', '#fbbf24'); return; }
  if(typeof ReceiptPrinter === 'undefined'){ _olShowToast('ReceiptPrinter not loaded', '#f87171'); return; }

  var receiptNo = ($id('olReceiptNo')?.value||'').trim();
  var qrOn      = _qrOn;
  var rielRate  = 4100;

  var startNo = receiptNo !== '' ? parseInt(receiptNo, 10) : null;
  var allData = src.map(function(o, i){
    var prods = getProds(o);
    var subtotal = prods.reduce(function(s,p){
      return s+Number(p.qty||0)*Number(p.price||0)-Number(p.discount||0);
    },0);
    var deliveryFee = Number(o.deliveryFee||0);
    var grandTotal  = subtotal+deliveryFee;
    var pay = (o.payment||'').toUpperCase();
    var qrPath='';
    if(qrOn){
      if(pay.includes('ABA'))     qrPath='../images/qr/ABA.png';
      else if(pay.includes('AC')) qrPath='../images/qr/AC.png';
    }
    var dName=o.deliveryName||'';
    if(dName.trim().toLowerCase()==='delivery') dName='-';
    var rNo = (startNo !== null && !isNaN(startNo)) ? String(startNo + i) : '';
    return {
      title:'វិក្កយបត្រ', paperWidth:'80mm',
      customer:o.customer||'', phone:o.phone||'',
      address:((o.addressDetail||o.address||'')?(o.addressDetail||o.address||'')+' ៖ ':'')+( o.province||''),
      date:fmtDisplay(o.date)||'', deliveryName:dName||'-',
      note:o.note||'-', page:o.page||o.pages||'',
      closeBy:o.closeBy||o.closeby||'', payment:o.payment||'',
      servicePhone:'015 58 68 78 / 089 58 68 78',
      qrImage:qrPath,
      qrLabel:pay.includes('ABA')?'ABA':pay.includes('AC')?'AC':(o.payment||''),
      accountName:'CHEA CHANROTHA', receiptNo:rNo,
      items:prods.map(function(p){
        return {product:p.name||'',qty:Number(p.qty||1),price:Number(p.price||0),
          discount:Number(p.discount||0),
          subtotal:Number(p.qty||0)*Number(p.price||0)-Number(p.discount||0),
          unit:getProdUnit(p)};
      }),
      subtotal:subtotal, deliveryFee:deliveryFee,
      grandTotal:grandTotal, grandRiel:Math.round(grandTotal*rielRate)
    };
  });

  ReceiptPrinter.printBatch(allData);
}

function printSelected(){
  var src = getSrc();
  if(!src.length){ _olShowToast('សូមជ្រើសរើស order មុន', '#fbbf24'); return; }
  if(typeof ReceiptPrinter === 'undefined'){ _olShowToast('ReceiptPrinter not loaded', '#f87171'); return; }

  var receiptNo = ($id('olReceiptNo')?.value||'').trim();
  var qrOn      = _qrOn;
  var rielRate  = 4100;

  var startNo = receiptNo !== '' ? parseInt(receiptNo, 10) : null;
  var allData = src.map(function(o, i){
    var prods = getProds(o);
    var subtotal = prods.reduce(function(s,p){
      return s+Number(p.qty||0)*Number(p.price||0)-Number(p.discount||0);
    },0);
    var deliveryFee = Number(o.deliveryFee||0);
    var grandTotal  = subtotal+deliveryFee;
    var pay = (o.payment||'').toUpperCase();
    var qrPath='';
    if(qrOn){
      if(pay.includes('ABA'))     qrPath='../images/qr/ABA.png';
      else if(pay.includes('AC')) qrPath='../images/qr/AC.png';
    }
    var dName=o.deliveryName||'';
    if(dName.trim().toLowerCase()==='delivery') dName='-';
    var rNo = (startNo !== null && !isNaN(startNo)) ? String(startNo + i) : '';
    return {
      title:'វិក្កយបត្រ', paperWidth:'80mm',
      customer:o.customer||'', phone:o.phone||'',
      address:((o.addressDetail||o.address||'')?(o.addressDetail||o.address||'')+' ៖ ':'')+( o.province||''),
      date:fmtDisplay(o.date)||'', deliveryName:dName||'-',
      note:o.note||'-', page:o.page||o.pages||'',
      closeBy:o.closeBy||o.closeby||'', payment:o.payment||'',
      servicePhone:'015 58 68 78 / 089 58 68 78',
      qrImage:qrPath,
      qrLabel:pay.includes('ABA')?'ABA':pay.includes('AC')?'AC':(o.payment||''),
      accountName:'CHEA CHANROTHA', receiptNo:rNo,
      items:prods.map(function(p){
        return {product:p.name||'',qty:Number(p.qty||1),price:Number(p.price||0),
          discount:Number(p.discount||0),
          subtotal:Number(p.qty||0)*Number(p.price||0)-Number(p.discount||0),
          unit:getProdUnit(p)};
      }),
      subtotal:subtotal, deliveryFee:deliveryFee,
      grandTotal:grandTotal, grandRiel:Math.round(grandTotal*rielRate)
    };
  });

  ReceiptPrinter.printBatch(allData);
}


/* ── Share IMG (using ShareReceipt.js) ── */
function shareImg(){
  var src = getSrc();
  if(!src.length){ _olShowToast('សូមជ្រើសរើស order មុន', '#fbbf24'); return; }
  if(typeof ShareReceipt === 'undefined'){ _olShowToast('ShareReceipt not loaded', '#f87171'); return; }

  var o = src[0]; // share first selected order
  var prods = getProds(o);
  var subtotal = prods.reduce(function(s,p){
    return s + Number(p.qty||0)*Number(p.price||0) - Number(p.discount||0);
  }, 0);
  var deliveryFee = Number(o.deliveryFee||0);
  var grandTotal  = subtotal + deliveryFee;
  var payMethod   = (o.payment||'').toUpperCase();

  // QR: only show if _qrOn is true
  var qrPath = '';
  if(_qrOn){
    if(payMethod.includes('ABA'))     qrPath = '../images/qr/ABA.png';
    else if(payMethod.includes('AC')) qrPath = '../images/qr/AC.png';
  }

  // Receipt number: only use if user typed something
  var receiptNo = (document.getElementById('olReceiptNo')?.value || '').trim();

  var data = {
    title:        'វិក្កយបត្រ',
    date:         fmtDisplay(o.date) || '',
    customer:     o.customer      || '',
    phone:        o.phone         || '',
    address:      ((o.addressDetail||o.address||'') ? (o.addressDetail||o.address||'') + ' ៖ ' : '') + (o.province||''),
    deliveryName: (function(){
      var v = o.deliveryName || o.delivery || o.DeliveryName || o['Delivery Name'] || '';
      // Skip if value is just the column header "Delivery"
      if(v.trim().toLowerCase() === 'delivery') return '-';
      return v || '-';
    })(),
    note:         o.note          || '-',
    page:         o.page || o.pages || '',
    closeBy:      o.closeBy || o.closeby || '',
    payment:      o.payment       || '',
    servicePhone: '015 58 68 78 / 089 58 68 78',
    qrImage:      qrPath,
    qrLabel:      payMethod.includes('ABA') ? 'ABA' : payMethod.includes('AC') ? 'AC' : (o.payment||''),
    accountName:  'CHEA CHANROTHA',
    receiptNo:    receiptNo, // blank = not shown in receipt
    items: prods.map(function(p){
      return {
        product:  p.name || '',
        qty:      Number(p.qty||1),
        price:    Number(p.price||0),
        discount: Number(p.discount||0),
        subtotal: Number(p.qty||0)*Number(p.price||0) - Number(p.discount||0),
        unit:     getProdUnit(p)
      };
    }),
    subtotal:    subtotal,
    deliveryFee: deliveryFee,
    grandTotal:  grandTotal,
    grandRiel:   Math.round(grandTotal * 4100)
  };

  if(typeof html2canvas !== 'function'){
    _olShowToast('html2canvas មិនទាន់ load — Reload ហើយព្យាយាមម្តងទៀត', '#f87171');
    return;
  }

  var target = document.getElementById('olPrintArea');
  if(!target){
    _olShowToast('Print area មិនមានទេ', '#f87171');
    return;
  }

  // Show loading toast
  var toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1e293b;color:#60a5fa;padding:10px 20px;border-radius:12px;font-size:13px;font-weight:700;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,.4)';
  toast.textContent = '⏳ កំពុង Generate រូបភាព...';
  document.body.appendChild(toast);

  ShareReceipt.share(data, {
    target:   target,
    fileName: 'receipt-' + (o.customer||'order').replace(/\s+/g,'_') + '.png',
    title:    'វិក្កយបត្រ — ' + (o.customer||''),
    text:     'Order from CAMBO MINI'
  }).then(function(result){
    toast.remove();
    var t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1e293b;color:#4ade80;padding:10px 20px;border-radius:12px;font-size:13px;font-weight:700;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,.4)';
    t.textContent = result.mode==='share' ? '✅ Share បានហើយ!' : '✅ រូបបាន Download!';
    document.body.appendChild(t);
    setTimeout(function(){ t.remove(); }, 2500);
  }).catch(function(err){
    toast.remove();
    _olShowToast('Share មានបញ្ហា: ' + (err && err.message ? err.message : String(err)), '#f87171');
  });
}

/* ══════════ DRAWER — View + Edit Order ══════════ */
var _drawerOrderId = null;
var _editMode = false;

// Snapshot for change-detection (Cancel without confirm if nothing changed)
var _drSnapshot = null;
function _drTakeSnapshot(){
  var snap = {};
  ['drCustomer','drPhone','drAddress','drProvince','drDate','drDelivery',
   'drDeliveryFee','drPayment','drPage','drCloseBy','drPriority','drStatus','drNote']
  .forEach(function(id){ var el=$id(id); if(el) snap[id]=el.value; });
  var prods=[];
  document.querySelectorAll('#drProdList .dr-prod-row').forEach(function(r){
    var n=(r.querySelector('.dr-prod-name')||{}).value||'';
    var q=(r.querySelector('.dr-prod-qty')||{}).value||'';
    var p=(r.querySelector('.dr-prod-price')||{}).value||'';
    prods.push(n+'|'+q+'|'+p);
  });
  snap['__prods__']=prods.join(';;');
  _drSnapshot=snap;
}
function _drHasChanges(){
  if(!_drSnapshot) return false;
  var changed=false;
  ['drCustomer','drPhone','drAddress','drProvince','drDate','drDelivery',
   'drDeliveryFee','drPayment','drPage','drCloseBy','drPriority','drStatus','drNote']
  .forEach(function(id){ var el=$id(id); if(el && _drSnapshot[id]!==undefined && el.value!==_drSnapshot[id]) changed=true; });
  var prods=[];
  document.querySelectorAll('#drProdList .dr-prod-row').forEach(function(r){
    var n=(r.querySelector('.dr-prod-name')||{}).value||'';
    var q=(r.querySelector('.dr-prod-qty')||{}).value||'';
    var p=(r.querySelector('.dr-prod-price')||{}).value||'';
    prods.push(n+'|'+q+'|'+p);
  });
  if(prods.join(';;')!==_drSnapshot['__prods__']) changed=true;
  return changed;
}

function olOpenDrawer(id){
  var o = _orders.find(function(x){ return String(x.id)===String(id); });
  if(!o) return;
  _drawerOrderId = String(id);
  _editMode = true; // Always open directly in edit mode

  var drawer  = $id('olDrawer');
  var overlay = $id('olOverlay');
  var foot    = $id('olDrFoot');
  var editBtn = $id('olDrEditBtn');

  if(drawer)  { drawer.style.display  = 'flex'; }
  if(overlay) { overlay.style.display = 'block'; }
  if(foot)    { foot.style.display    = 'flex'; }
  if(editBtn) { editBtn.style.display = 'none'; } // hide Edit toggle btn

  // Show Save + Cancel immediately
  var saveBtn   = $id('olDrSaveBtn');
  var cancelBtn = $id('olDrCancelBtn');
  if(saveBtn)   saveBtn.style.display   = 'flex';
  if(cancelBtn){
    cancelBtn.style.display    = 'flex';
    cancelBtn.style.border     = '1.5px solid rgba(239,68,68,.4)';
    cancelBtn.style.background = 'rgba(239,68,68,.12)';
    cancelBtn.style.color      = '#f87171';
  }

  var titleEl = $id('olDrTitle');
  if(titleEl) titleEl.textContent = o.customer || 'Order Detail';
  renderDrawerEdit(o);

  // Lock background scroll (mobile: position:fixed trick)
  var sy = window.scrollY || window.pageYOffset || 0;
  document.body.style.top = '-' + sy + 'px';
  document.body.classList.add('drawer-open');
  document.documentElement.classList.add('drawer-open'); // lock html too
  document.body._drawerScrollY = sy;

  // Block touchmove on overlay to stop background bounce (iOS)
  var ol = $id('olOverlay');
  if(ol && !ol._tmBlocked){
    ol._tmBlocked = true;
    ol.addEventListener('touchmove', function(e){ e.preventDefault(); }, { passive: false });
  }

  // Take snapshot AFTER render so change-detection baseline is correct
  setTimeout(_drTakeSnapshot, 80);
}

function olCloseDrawer(){
  $id('olDrawer').style.display  = 'none';
  $id('olOverlay').style.display = 'none';

  // Restore background scroll position
  var sy = document.body._drawerScrollY || 0;
  document.body.classList.remove('drawer-open');
  document.documentElement.classList.remove('drawer-open');
  document.body.style.top = '';
  window.scrollTo(0, sy);

  _drawerOrderId = null; _editMode = false;
}

function olToggleEdit(){
  if(!_drawerOrderId) return;
  var o = _orders.find(function(x){ return String(x.id)===_drawerOrderId; });
  if(!o) return;
  _editMode = !_editMode;
  var foot    = $id('olDrFoot');
  var editBtn = $id('olDrEditBtn');
  // Footer always stays visible — only Save/Cancel toggle
  if(foot) foot.style.display = 'flex';
  if(editBtn) editBtn.style.display = _editMode ? 'none' : 'flex';
  _editMode ? renderDrawerEdit(o) : renderDrawerView(o);
  // Show/hide save+cancel in footer
  var saveBtn   = $id('olDrSaveBtn');
  var cancelBtn = $id('olDrCancelBtn');
  if(saveBtn)   saveBtn.style.display   = _editMode ? 'flex' : 'none';
  if(cancelBtn) cancelBtn.style.display = _editMode ? 'flex' : 'none';
}

async function olCancelEdit(){
  // If nothing changed → close immediately, no dialog
  if(!_drHasChanges()){ olCloseDrawer(); return; }
  // Has unsaved changes → ask for confirmation
  var ok = window.macUI
    ? await macUI.confirm('មានការកែប្រែដែលមិនទាន់ Save។\nតើអ្នកចង់បោះបង់ដែរឬទេ?','បោះបង់ការកែប្រែ',false)
    : window.confirm('មានការកែប្រែដែលមិនទាន់ Save។\nតើអ្នកចង់បោះបង់ដែរឬទេ?');
  if(ok) olCloseDrawer();
}

function _olShowToast(msg, color){
  if(window.macUI){
    var type = color==='#4ade80'||color==='#22c55e' ? 'success'
             : color==='#f59e0b'||color==='#fbbf24' ? 'warning'
             : color==='#f87171'||color==='#ef4444' ? 'error' : 'info';
    macUI.toast(msg, type); return;
  }
  var t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);'
    +'background:#1e293b;color:'+color+';padding:10px 20px;border-radius:12px;'
    +'font-size:13px;font-weight:700;z-index:9999;border-left:3px solid '+color+';'
    +'box-shadow:0 8px 24px rgba(0,0,0,.4);transition:opacity .3s';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function(){ t.style.opacity='0'; setTimeout(function(){ t.remove(); }, 300); }, 2500);
}

async function olSaveEdit(){
  // Guard: must have an open order
  var o = _orders.find(function(x){ return String(x.id) === String(_drawerOrderId); });
  if(!o){ _olShowToast('Order រកមិនឃើញ', '#fbbf24'); return; }

  // Confirm before saving
  var ok = window.macUI
    ? await macUI.confirm('តើអ្នកពិតជាចង់រក្សាទុកការផ្លាស់ប្ដូរដែរឬទេ?','រក្សាទុក',false)
    : window.confirm('តើអ្នកពិតជាចង់រក្សាទុកការផ្លាស់ប្ដូរដែរឬទេ?');
  if(!ok) return;

  try {
    // ── 1. Read edited values from form ──
    var custEl    = document.getElementById('drCustomer');
    var phoneEl   = document.getElementById('drPhone');
    var addrEl    = document.getElementById('drAddress');
    var provEl    = document.getElementById('drProvince');
    var dateEl    = document.getElementById('drDate');
    var delivEl   = document.getElementById('drDelivery');
    var feeEl     = document.getElementById('drDeliveryFee');
    var payEl     = document.getElementById('drPayment');
    var statEl    = document.getElementById('drStatus');
    var noteEl    = document.getElementById('drNote');
    var pageEl    = document.getElementById('drPage');
    var closeEl   = document.getElementById('drCloseBy');
    var priorEl   = document.getElementById('drPriority');

    if(custEl)  o.customer     = custEl.value  || o.customer;
    if(phoneEl) o.phone        = phoneEl.value || o.phone;
    // Province — read hidden input (combo) or plain input fallback
    var _provVal = (document.getElementById('drProvince')||provEl||{}).value;
    if(_provVal !== undefined) o.province = _provVal || o.province;
    if(addrEl){ var _addr = addrEl.value; o.addressDetail = _addr; o.address = _addr; }
    if(dateEl && dateEl.value){
      var _dp = dateEl.value.split('T');
      var _d  = _dp[0].split('-');
      var _formatted = _d[2]+'/'+_d[1]+'/'+_d[0]+' '+(_dp[1]||'00:00');
      o.date     = _formatted;
      o.dateTime = _formatted; // keep dateTime in sync so Apps Script uses the new date
    }
    // Delivery — read hidden input (combo) or plain input fallback
    var _delivVal = (document.getElementById('drDelivery')||delivEl||{}).value;
    if(_delivVal !== undefined) o.deliveryName = _delivVal || o.deliveryName;
    if(feeEl)   o.deliveryFee  = Number(feeEl.value||0);
    if(payEl)   o.payment      = payEl.value   || o.payment;
    if(statEl)  o.status       = statEl.value  || o.status;
    if(noteEl)  o.note         = noteEl.value;
    // Page + CloseBy — read hidden inputs (combo) or plain input fallback
    var _pageVal    = (document.getElementById('drPage')   ||pageEl ||{}).value;
    var _closeVal   = (document.getElementById('drCloseBy')||closeEl||{}).value;
    if(_pageVal  !== undefined) o.page    = _pageVal  || o.page;
    if(_closeVal !== undefined) o.closeBy = _closeVal || o.closeBy;
    if(priorEl) o.priority     = priorEl.value || o.priority;

    // ── 2. Read products ──
    var prodList = document.getElementById('drProdList');
    if(prodList){
      var newProds = [];
      Array.from(prodList.children).forEach(function(row){
        var nameEl2 = row.querySelector('.dr-prod-name');
        if(!nameEl2) return;
        var nm   = nameEl2.value.trim();
        var uEl  = row.querySelector('.dr-prod-unit');
        var qEl  = row.querySelector('.dr-prod-qty');
        var pEl  = row.querySelector('.dr-prod-price');
        var unit = uEl ? uEl.value : 'ឈុត';
        var qty  = Number(qEl ? qEl.value : 1);
        var pr   = Number(pEl ? pEl.value : 0);
        // Rebuild display name: append "(unit)" for non-default units (matches new-order.html convention)
        var dispName = (unit && unit !== 'ឈុត') ? nm+' ('+unit+')' : nm;
        if(nm) newProds.push({name:dispName, qty:qty, price:pr, discount:0, unit:unit, subtotal:qty*pr});
      });
      if(newProds.length){ o.products = newProds; o.items = newProds; }
    }

    // ── 3. Close drawer + refresh table ──
    olCloseDrawer();
    render(); // refresh table row

    // ── 5. Toast: saving ──
    _olShowToast('⏳ កំពុង Save...', '#60a5fa');

    // ── 6. Sync to Google Sheet (background) ──
    fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {'Content-Type': 'text/plain;charset=utf-8'},
      body: JSON.stringify({action:'update', orderId:o.id, order:o})
    })
    .then(function(r){ return r.json(); })
    .then(function(d){
      if(d && d.ok === false) _olShowToast('⚠️ Local ✓ | Sheet: '+(d.message||'Error'), '#f59e0b');
      else _olShowToast('✅ Save បានជោគជ័យ!', '#4ade80');
    })
    .catch(function(){ _olShowToast('✅ Saved locally (Sheet offline)', '#fbbf24'); });

  } catch(err){
    console.error('olSaveEdit error:', err);
    _olShowToast('Save មានបញ្ហា: '+(err && err.message ? err.message : String(err)), '#f87171');
  }
}

/* ── View mode ── */
function renderDrawerView(o){
  var total = orderTotal(o);
  var prods = getProds(o);
  $id('olDrBody').innerHTML =
    '<div style="display:flex;flex-direction:column;gap:16px">'

    // Customer info card
    +'<div style="background:'+themeVal('rgba(255,255,255,.04)','#f8fafc')+';border:1px solid '+themeVal('rgba(148,163,200,.1)','rgba(148,163,184,.15)')+';border-radius:10px;padding:10px 8px">'
    +'<div style="font-size:11px;font-weight:800;letter-spacing:.07em;color:#64748b;text-transform:uppercase;margin-bottom:10px">👤 ព័ត៌មានអតិថិជន</div>'
    +drRow('ឈ្មោះ', o.customer||'—')
    +drRow('ទូរស័ព្ទ', '<span style="color:#60a5fa">'+esc(o.phone||'—')+'</span>')
    +drRow('អាសយដ្ឋាន', (o.addressDetail||o.address||'')||'—')
    +drRow('ខេត្ត/ក្រុង', o.province||'—')
    // Date — read-only text in view mode (edit via Edit button only)
    +drRow('ថ្ងៃ/ម៉ោង', fmtDisplayFull(o.date)||'—')
    +drRow('ដឹកជញ្ជូន', o.deliveryName||'—')
    +drRow('ថ្លៃដឹក', o.deliveryFee ? '$'+Number(o.deliveryFee).toFixed(2) : 'ហ្វ្រីដឹក')
    +drRow('Payment', o.payment||'—')
    +drRow('Pages', o.page||o.pages||'—')
    +drRow('CloseBy', o.closeBy||o.closeby||'—')
    +drRow('Priority', o.priority||'Medium')
    +drRow('Status', (function(st){
      var s=String(st||'Pending');
      var isDel=s==='Delivered', isCan=s==='Cancelled';
      var bg=isDel?'rgba(34,197,94,.15)':isCan?'rgba(239,68,68,.15)':'rgba(245,158,11,.15)';
      var clr=isDel?themeVal('#4ade80','#16a34a'):isCan?themeVal('#f87171','#dc2626'):themeVal('#fbbf24','#d97706');
      return '<span style="background:'+bg+';color:'+clr+';padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700">'+esc(s)+'</span>';
    })(o.status||o.orderStatus||'Pending'))
    +(o.note ? drRow('Note', '<span style="color:#f87171">'+esc(o.note)+'</span>') : '')
    +'</div>'

    // Products card — card layout (mobile-friendly, no 5-col grid)
    +'<div style="background:'+themeVal('rgba(255,255,255,.04)','#f8fafc')+';border:1px solid '+themeVal('rgba(148,163,200,.1)','rgba(148,163,184,.15)')+';border-radius:10px;padding:10px 8px">'
    +'<div style="font-size:11px;font-weight:800;letter-spacing:.07em;color:#64748b;text-transform:uppercase;margin-bottom:10px">🛍️ ផលិតផល ('+prods.length+')</div>'
    // Header row — ផលិតផល | ចំនួន | ប្រភេទ | តម្លៃ | សរុប
    +'<div style="display:grid;grid-template-columns:1fr 80px 52px 52px 52px;gap:0 5px;padding-bottom:8px;border-bottom:2px solid '+themeVal('rgba(148,163,200,.15)','rgba(148,163,184,.2)')+';margin-bottom:2px">'
      +'<span style="font-size:11px;font-weight:800;color:#64748b">ផលិតផល</span>'
      +'<span style="font-size:11px;font-weight:800;color:#64748b;text-align:center">ចំនួន</span>'
      +'<span style="font-size:11px;font-weight:800;color:#64748b;text-align:center">ប្រភេទ</span>'
      +'<span style="font-size:11px;font-weight:800;color:#64748b;text-align:right">តម្លៃ</span>'
      +'<span style="font-size:11px;font-weight:800;color:#64748b;text-align:right">សរុប</span>'
    +'</div>'
    +'<div style="display:flex;flex-direction:column;gap:0">'
    +prods.map(function(p,i){
      var sub=Number(p.qty||0)*Number(p.price||0)-Number(p.discount||0);
      var txtClr=themeVal('#e2e8f0','#0f172a');
      var isLast=(i===prods.length-1);
      var br=isLast?'':'border-bottom:1px solid '+themeVal('rgba(148,163,200,.07)','rgba(148,163,184,.1)');
      var u=getProdUnit(p);
      var ubs=unitBadgeStyle(u);
      return '<div style="display:grid;grid-template-columns:1fr 80px 52px 52px 52px;gap:0 5px;align-items:center;padding:9px 0;'+br+'">'
        // ផលិតផល
        +'<div style="font-weight:600;font-size:13px;color:'+txtClr+';line-height:1.4;word-break:break-word">'+esc(cleanProdName(p))+'</div>'
        // ចំនួន: [ - ] qty [ + ]
        +'<div style="display:flex;align-items:center;justify-content:center;gap:3px">'
          +'<span style="width:22px;height:22px;border-radius:5px;background:'+themeVal('rgba(148,163,200,.15)','rgba(148,163,184,.18)')+';display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#94a3b8">−</span>'
          +'<span style="font-size:13px;font-weight:800;color:'+txtClr+';min-width:18px;text-align:center">'+p.qty+'</span>'
          +'<span style="width:22px;height:22px;border-radius:5px;background:'+themeVal('rgba(148,163,200,.15)','rgba(148,163,184,.18)')+';display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#94a3b8">+</span>'
        +'</div>'
        // ប្រភេទ badge
        +'<div style="display:flex;justify-content:center">'
          +'<span style="padding:2px 6px;border-radius:8px;font-size:10px;font-weight:800;white-space:nowrap;'+ubs+'">'+esc(u)+'</span>'
        +'</div>'
        // តម្លៃ
        +'<div style="font-size:12px;color:#94a3b8;text-align:right">$'+Number(p.price||0).toFixed(2).replace(/\.00$/,'')+'</div>'
        // សរុប
        +'<div style="font-size:13px;font-weight:800;color:'+themeVal('#7dd3fc','#4f46e5')+';text-align:right">$'+sub.toFixed(2).replace(/\.00$/,'')+'</div>'
      +'</div>';
    }).join('')
    +'</div>'
    +(function(){
      var khrRate = (function(){ try{ var r=Number(localStorage.getItem('cambo_khr_rate')); return r>0?r:4100; }catch(e){ return 4100; } })();
      var fee = Number(o.deliveryFee||0);
      var riel = Math.round(total * khrRate);
      return '<div style="margin-top:10px;padding:10px 12px;border-radius:10px;background:'+themeVal('rgba(124,92,255,.08)','rgba(99,102,241,.06)')+';border:1px solid '+themeVal('rgba(124,92,255,.2)','rgba(99,102,241,.15)')+'">'
        +'<div style="display:flex;justify-content:space-between;font-size:11px;color:#64748b;margin-bottom:5px"><span>🚚 ថ្លៃដឹក</span><span>'+(fee>0?'$'+fee.toFixed(2):'ហ្វ្រីដឹក')+'</span></div>'
        +'<div style="display:flex;justify-content:space-between;align-items:baseline">'
          +'<span style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em">Grand Total</span>'
          +'<div style="text-align:right">'
            +'<div style="font-size:15px;font-weight:900;color:'+themeVal('#7dd3fc','#4f46e5')+'">$'+total.toFixed(2)+'</div>'
            +'<div style="font-size:11px;font-weight:700;color:#a78bfa;margin-top:1px">'+riel.toLocaleString()+'៛</div>'
          +'</div>'
        +'</div>'
      +'</div>';
    })()
    +'</div>'
    +'</div>';
}

function drRow(label, value){
  return '<div style="display:grid;grid-template-columns:120px 1fr;gap:12px;align-items:center;padding:7px 0;border-bottom:1px solid '+themeVal('rgba(148,163,200,.07)','rgba(148,163,184,.1)')+';font-size:13px">'
    +'<span class="dr-label" style="color:#64748b">'+label+'</span>'
    +'<span style="color:'+themeVal('#e2e8f0','#0f172a')+';font-weight:600;text-align:left;word-break:break-word">'+value+'</span>'
    +'</div>';
}

/* ── Edit mode (same layout as view, just inputs instead of text) ── */
function renderDrawerEdit(o){
  var inputStyle = 'width:100%;height:32px;padding:0 8px;border-radius:8px;border:1px solid '+themeVal('rgba(148,163,200,.22)','rgba(148,163,184,.3)')+';background:'+themeVal('rgba(255,255,255,.06)','#f8fafc')+';color:'+themeVal('#e2e8f0','#0f172a')+';font-size:12px;font-family:inherit;outline:none;box-sizing:border-box;font-weight:500;touch-action:manipulation';
  var rowWrap = 'display:flex;align-items:center;gap:6px;padding:3px 0;border-bottom:1px solid '+themeVal('rgba(148,163,200,.06)','rgba(148,163,184,.09)');
  var labelSt = 'flex-shrink:0;width:80px;font-size:10.5px;font-weight:600;color:#94a3b8;text-align:right';
  function rowInp(id, val, label, type){
    type = type||'text';
    return '<div class="dr-row" style="'+rowWrap+'">'
      +'<span class="dr-lbl" style="'+labelSt+'">'+label+'</span>'
      +'<input id="'+id+'" type="'+type+'" value="'+esc(val||'')+'" style="'+inputStyle+';flex:1">'
      +'</div>';
  }
  function rowCombo(wrapId, hidId, val, label, placeholder){
    var comboInpS = inputStyle+';flex:1;cursor:pointer';
    return '<div class="dr-row" style="'+rowWrap+'">'
      +'<span class="dr-lbl" style="'+labelSt+'">'+label+'</span>'
      +'<div style="flex:1;min-width:0;width:100%;position:relative" class="sc-dr-wrap" id="'+wrapId+'">'
        +'<input class="combo-input" type="text" value="'+esc(val||'')+'" placeholder="'+placeholder+'" style="'+comboInpS+'" autocomplete="off">'
        +'<input type="hidden" id="'+hidId+'" value="'+esc(val||'')+'">'
      +'</div>'
    +'</div>';
  }
  function rowSel(id, val, label, opts){
    return '<div class="dr-row" style="'+rowWrap+'">'
      +'<span class="dr-lbl" style="'+labelSt+'">'+label+'</span>'
      +'<select id="'+id+'" style="'+inputStyle+';flex:1">'
      +opts.map(function(op){ return '<option value="'+op+'" '+(op===val?'selected':'')+'>'+op+'</option>'; }).join('')
      +'</select></div>';
  }
  function rowTx(id, val, label){
    return '<div class="dr-row" style="'+rowWrap+';align-items:flex-start">'
      +'<span class="dr-lbl" style="'+labelSt+';padding-top:6px">'+label+'</span>'
      +'<textarea id="'+id+'" rows="2" style="'+inputStyle+';flex:1;height:auto;min-height:34px;padding:5px 8px;resize:none">'+esc(val||'')+'</textarea>'
      +'</div>';
  }

  $id('olDrBody').innerHTML =
    '<div style="font-size:11px;font-weight:800;color:#8b5cf6;padding:6px 0;letter-spacing:.05em;text-transform:uppercase;display:flex;align-items:center;gap:5px">👤 ព័ត៌មានអតិថិជន</div>'
    +rowInp('drCustomer',   o.customer||'',     'ឈ្មោះ')
    +rowInp('drPhone',      o.phone||'',        'ទូរស័ព្ទ')
    +rowInp('drAddress',    (o.addressDetail||o.address||'')||'','អាសយដ្ឋាន')
    +rowCombo('drProvinceCombo','drProvince', o.province||'', 'ខេត្ត/ក្រុង', 'ខេត្ត...')
    +(function(){
      var dtVal = toDatetimeLocalEdit(o.date);
      var disp  = fmtDtDisplay(dtVal);
      var wrapSt = rowWrap;
      var inpHidden = 'position:absolute;top:0;left:0;width:100%;height:100%;opacity:0;pointer-events:none;z-index:0';
      return '<div class="dr-row" style="'+wrapSt+'">'
        +'<span class="dr-lbl" style="'+labelSt+'">ថ្ងៃ/ម៉ោង</span>'
        +'<div style="flex:1;position:relative">'
          +'<div id="drDateDisplay" onclick="var p=document.getElementById(\'drDate\');p.style.pointerEvents=\'auto\';try{p.showPicker();}catch(e){p.focus();}" '
            +'style="'+inputStyle+';flex:1;cursor:pointer;display:flex;align-items:center;justify-content:space-between;padding:0 8px">'
            +'<span id="drDateText">'+esc(disp)+'</span>'
            +''
          +'</div>'
          +'<input id="drDate" type="datetime-local" value="'+esc(dtVal)+'" style="'+inpHidden+'" '
            +'oninput="var d=document.getElementById(\'drDateText\');if(d&&window.fmtDtDisplay)d.textContent=window.fmtDtDisplay(this.value);">'
        +'</div>'
      +'</div>';
    })()
    +rowCombo('drDeliveryCombo','drDelivery', (o.deliveryName&&o.deliveryName.toLowerCase()!=='delivery'?o.deliveryName:''), 'ដឹកជញ្ជូន', 'ដឹកជញ្ជូន...')
    +rowInp('drDeliveryFee',o.deliveryFee||0,   'ថ្លៃដឹក', 'number')
    +rowInp('drPayment',    o.payment||'',      'Payment')
    +rowCombo('drPageCombo',   'drPage',    o.page||o.pages||'',       'Pages',    'Pages...')
    +rowCombo('drCloseByCombo','drCloseBy', o.closeBy||o.closeby||'',  'CloseBy',  'CloseBy...')
    +rowSel('drPriority',   o.priority||'Medium','Priority',['High','Medium','Low'])
    +rowSel('drStatus',     o.status||o.orderStatus||'Pending','Status',['Pending','Delivered','Cancelled'])
    +rowTx ('drNote',       o.note||'',         'Note')

    // Products editor section
    +'<div style="margin-top:12px;padding-bottom:20px">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">'
    +'<span style="font-size:11px;font-weight:800;letter-spacing:.07em;color:#64748b;text-transform:uppercase">🛍️ ផលិតផល</span>'
    +'<button onclick="olAddProdRow()" type="button" style="height:26px;padding:0 10px;border-radius:7px;border:1px solid rgba(34,197,94,.3);background:rgba(34,197,94,.1);color:#4ade80;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">+ Add</button>'
    +'</div>'
    // Header: ផលិតផល | ចំនួន | ប្រភេទ | តម្លៃ | សរុប | ×
    +'<div style="display:grid;grid-template-columns:1fr 38px 60px 46px 46px 24px;gap:4px;padding:5px 0;margin-bottom:3px;border-bottom:2px solid '+themeVal('rgba(148,163,200,.12)','rgba(148,163,184,.18)')+';font-size:10px;font-weight:700;letter-spacing:.04em;color:#64748b">'
    +'<span>ផលិតផល</span><span style="text-align:center">ចំនួន</span><span style="text-align:center">ប្រភេទ</span><span style="text-align:right">តម្លៃ</span><span style="text-align:right">សរុប</span><span></span>'
    +'</div>'
    +'<div id="drProdList">'
    +getProds(o).map(function(p,i){
      return drProdRow(cleanProdName(p), getProdUnit(p), p.qty||1, p.price||0);
    }).join('')
    +'</div>'
    // Grand Total box
    +(function(){
      var khrRate = (function(){ try{ var r=Number(localStorage.getItem('cambo_khr_rate')); return r>0?r:4100; }catch(e){ return 4100; } })();
      var sub = getProds(o).reduce(function(s,p){ return s+Number(p.qty||0)*Number(p.price||0); },0);
      var fee = Number(o.deliveryFee||0);
      var grand = sub + fee;
      var riel = Math.round(grand * khrRate);
      var txtClr = themeVal('#e2e8f0','#0f172a');
      return '<div style="margin-top:14px;padding:12px 14px;border-radius:10px;background:'+themeVal('rgba(124,92,255,.08)','rgba(99,102,241,.06)')+';border:1px solid '+themeVal('rgba(124,92,255,.2)','rgba(99,102,241,.15)')+'">'
        +'<div style="display:flex;justify-content:space-between;font-size:12px;color:#64748b;margin-bottom:6px"><span>🚚 ថ្លៃដឹក</span><span id="drDelivFeeDisp">'+(fee>0?'$'+fee.toFixed(2):'ហ្វ្រីដឹក')+'</span></div>'
        +'<div style="display:flex;justify-content:space-between;align-items:baseline">'
          +'<span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em">Grand Total</span>'
          +'<div style="text-align:right">'
            +'<div id="drGrandTotal" style="font-size:18px;font-weight:900;color:'+themeVal('#7dd3fc','#4f46e5')+'">$'+grand.toFixed(2)+'</div>'
            +'<div id="drGrandRiel" style="font-size:12px;font-weight:700;color:#a78bfa;margin-top:1px">'+riel.toLocaleString()+'៛</div>'
          +'</div>'
        +'</div>'
      +'</div>';
    })()
    +'</div>';

  // Re-bind remove buttons + init combos after render
  setTimeout(function(){
    document.querySelectorAll('.dr-prod-remove').forEach(function(btn){
      btn.addEventListener('click', function(){ btn.closest('.dr-prod-row').remove(); if(window.olRecalcTotal)window.olRecalcTotal(); });
    });
    var feeInp = document.getElementById('drDeliveryFee');
    if(feeInp) feeInp.addEventListener('input', function(){ if(window.olRecalcTotal)window.olRecalcTotal(); });

    // Init searchable combos
    if(window.SearchableCombo && window.SearchableCombo.makeCombo){
      var SC = window.SearchableCombo;
      [
        {id:'drProvinceCombo', list:SC.PROVINCES, title:'ខេត្ត / ក្រុង'},
        {id:'drDeliveryCombo', list:SC.DELIVERY,  title:'ដឹកជញ្ជូន'},
        {id:'drPageCombo',     list:SC.PAGES,     title:'Pages'},
        {id:'drCloseByCombo',  list:SC.CLOSEBY,   title:'CloseBy'}
      ].forEach(function(c){
        var wrap = document.getElementById(c.id);
        if(wrap) SC.makeCombo(wrap, c.list, c.title);
      });
    }
  }, 0);
}

/* Expose to window for inline onclick + cross-IIFE helpers */
window.olCloseDrawer = olCloseDrawer;
window.olOpenDrawer  = olOpenDrawer;
window.getProds      = getProds;
window.orderTotal    = orderTotal;
window.fmtDisplay    = fmtDisplay;

/* ── Drawer QR toggle ── */
var _drQrOn = true;
window.olDrToggleQr = function(){
  _drQrOn = !_drQrOn;
  var btn = $id('olDrQrBtn');
  if(!btn) return;
  // Only change colors — SVG icon stays intact
  btn.style.borderColor = _drQrOn ? 'rgba(34,197,94,.4)'  : 'rgba(239,68,68,.4)';
  btn.style.background  = _drQrOn ? 'rgba(34,197,94,.12)' : 'rgba(239,68,68,.12)';
  btn.style.color       = _drQrOn ? '#4ade80'             : '#f87171';
  btn.title = 'QR Code: ' + (_drQrOn ? 'ON' : 'OFF');
};

/* ── Drawer Delete ── */
window.olDeleteOrder = async function(){
  try {
    if(!_drawerOrderId){ _olShowToast('គ្មាន Order ត្រូវបានជ្រើស', '#fbbf24'); return; }
    var o = _orders.find(function(x){ return String(x.id)===_drawerOrderId; });
    if(!o){ _olShowToast('Order រកមិនឃើញ', '#fbbf24'); return; }

    /* ── Confirm dialog: macUI if available, else native browser ── */
    var ok = window.macUI
      ? await macUI.confirm('លុប Order របស់ '+o.customer+'?', 'លុប Order', true)
      : window.confirm('⚠️ លុប Order របស់ "'+o.customer+'"?\n\nចុច OK ដើម្បីបញ្ជាក់លុប');
    if(!ok) return;

    var deletedId = _drawerOrderId; // snapshot before close

    /* ── 1. Remove from memory ── */
    _orders = _orders.filter(function(x){ return String(x.id)!==deletedId; });

    /* ── 2. Close drawer + re-render table ── */
    olCloseDrawer();
    render();

    /* ── 4. Success toast ── */
    var _t = document.createElement('div');
    _t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1e293b;color:#4ade80;padding:10px 20px;border-radius:12px;font-size:13px;font-weight:700;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,.4)';
    _t.textContent = '✅ Order "'+o.customer+'" ត្រូវបានលុបហើយ';
    document.body.appendChild(_t);
    setTimeout(function(){ _t.remove(); }, 2500);

    /* ── 5. Sync delete to Google Sheet (background, non-blocking) ── */
    fetch(SCRIPT_URL, {
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body: JSON.stringify({action:'delete', orderId: o.id})
    }).then(function(r){ return r.json(); })
    .then(function(d){
      if(d && d.ok === false) console.warn('Sheet delete failed:', d.message);
    }).catch(function(e){ console.warn('Sheet delete error:', e); });

  } catch(err) {
    console.error('olDeleteOrder error:', err);
    _olShowToast('Delete មានបញ្ហា: ' + (err.message || String(err)), '#f87171');
  }
};

/* ── Drawer Copy Text (Receipt) ── */


/* ── Drawer Share IMG ── */
window.olDrShare = function(){
  if(!_drawerOrderId) return;
  // Set _qrOn from drawer toggle
  _qrOn = _drQrOn;
  // Set receipt no from drawer input
  var rno = $id('olDrReceiptNo')?.value || '';
  // Temporarily override olReceiptNo
  var fake = document.createElement('input');
  fake.id = 'olReceiptNo'; fake.value = rno; fake.style.display='none';
  document.body.appendChild(fake);
  // Select this order
  var prev = new Set(_sel);
  _sel.clear(); _sel.add(_drawerOrderId);
  shareImg();
  // Restore
  setTimeout(function(){ _sel = prev; fake.remove(); }, 100);
};

/* ── Drawer Print ── */
window.olDrPrint = function(){
  if(!_drawerOrderId) return;
  _qrOn = _drQrOn;
  var rno = $id('olDrReceiptNo')?.value || '';
  var fake = document.createElement('input');
  fake.id = 'olReceiptNo'; fake.value = rno; fake.style.display='none';
  document.body.appendChild(fake);
  var prev = new Set(_sel);
  _sel.clear(); _sel.add(_drawerOrderId);
  printSelected();
  setTimeout(function(){ _sel = prev; fake.remove(); }, 100);
};
window.olAddProdRow  = function(){
  var list = $id('drProdList'); if(!list) return;
  var tmp = document.createElement('div');
  tmp.innerHTML = drProdRow('','ឈុត',1,0);
  var row = tmp.firstElementChild;
  list.appendChild(row);
  row.querySelector('.dr-prod-remove')?.addEventListener('click', function(){ row.remove(); if(window.olRecalcTotal)window.olRecalcTotal(); });
};

window.olRecalcTotal = function(){
  var khrRate = (function(){ try{ var r=Number(localStorage.getItem('cambo_khr_rate')); return r>0?r:4100; }catch(e){ return 4100; } })();
  var sub = 0;
  document.querySelectorAll('#drProdList .dr-prod-row').forEach(function(row){
    var q = Number((row.querySelector('.dr-prod-qty')||{}).value||0);
    var p = Number((row.querySelector('.dr-prod-price')||{}).value||0);
    sub += q * p;
  });
  var fee = Number((document.getElementById('drDeliveryFee')||{}).value||0);
  var grand = sub + fee;
  var riel = Math.round(grand * khrRate);
  var gtEl = document.getElementById('drGrandTotal');
  var grEl = document.getElementById('drGrandRiel');
  var dfEl = document.getElementById('drDelivFeeDisp');
  if(gtEl) gtEl.textContent = '$'+grand.toFixed(2).replace(/\.00$/,'');
  if(grEl) grEl.textContent = riel.toLocaleString()+'៛';
  if(dfEl) dfEl.textContent = fee>0 ? '$'+fee.toFixed(2) : 'ហ្វ្រីដឹក';
};

function drProdRow(name, unit, qty, price){
  unit = unit || 'ឈុត';
  var sub = Number(qty||0) * Number(price||0);
  var c  = themeVal('#e2e8f0','#0f172a');
  var bg = themeVal('rgba(255,255,255,.07)','#fff');
  var bd = themeVal('rgba(148,163,200,.22)','rgba(148,163,184,.32)');
  var inpS = 'height:30px;padding:0 6px;border-radius:7px;border:1px solid '+bd
    +';background:'+bg+';color:'+c
    +';font-size:11px;font-family:inherit;outline:none;box-sizing:border-box;touch-action:manipulation;width:100%';
  var ubs  = unitBadgeStyle(unit);
  var selS = 'height:30px;padding:0 4px;border-radius:7px;border:1px solid '+bd
    +';font-size:11px;font-weight:700;font-family:inherit;outline:none;box-sizing:border-box;cursor:pointer;touch-action:manipulation;width:100%;'+ubs;
  var onchg = "var r=this.closest('.dr-prod-row');var q=Number(r.querySelector('.dr-prod-qty').value||0);var p=Number(r.querySelector('.dr-prod-price').value||0);var sp=r.querySelector('.dr-prod-sub');if(sp)sp.textContent='$'+(q*p).toFixed(2);if(window.olRecalcTotal)window.olRecalcTotal();";

  // Single row — 6 cols: name | qty | unit | price | subtotal | X
  return '<div class="dr-prod-row" style="display:grid;grid-template-columns:1fr 38px 60px 46px 46px 24px;gap:4px;align-items:center;padding:5px 0;border-bottom:1px solid '+themeVal('rgba(148,163,200,.08)','rgba(148,163,184,.1)')+'">'
    +'<input class="dr-prod-name" type="text" value="'+esc(name)+'" placeholder="ឈ្មោះ" style="'+inpS+';font-weight:600">'
    +'<input class="dr-prod-qty" type="number" value="'+Number(qty||1)+'" min="1" style="'+inpS+';text-align:center" oninput="'+onchg+'">'
    +'<select class="dr-prod-unit" style="'+selS+'">'
    +['ឈុត','កេស','លាយ'].map(function(u){ return '<option value="'+u+'"'+(u===unit?' selected':'')+'>'+u+'</option>'; }).join('')
    +'</select>'
    +'<input class="dr-prod-price" type="number" value="'+Number(price||0)+'" min="0" step="0.01" style="'+inpS+';text-align:right" oninput="'+onchg+'">'
    +'<span class="dr-prod-sub" style="font-size:11px;font-weight:800;color:'+themeVal('#7dd3fc','#4f46e5')+';white-space:nowrap;text-align:right">$'+sub.toFixed(2)+'</span>'
    +'<button class="dr-prod-remove" type="button" title="Remove" style="width:24px;height:24px;border-radius:6px;border:none;background:rgba(239,68,68,.12);color:#f87171;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0">✕</button>'
  +'</div>';
}
window.olToggleEdit  = olToggleEdit;
window.olCancelEdit  = olCancelEdit;
window.olSaveEdit    = olSaveEdit;

/* ── Inline date save (view mode, no full edit needed) ── */
window.olSaveInlineDate = function(){
  /* ── 1. Find order ── */
  var o = _orders.find(function(x){ return String(x.id) === String(_drawerOrderId); });
  if(!o){
    if(window.macUI) macUI.toast('⚠️ រកមិនឃើញ Order', 'error');
    return;
  }

  /* ── 2. Get input value ── */
  var inp = document.getElementById('drInlineDate');
  if(!inp){
    if(window.macUI) macUI.toast('⚠️ Input មិនមាន', 'error');
    return;
  }
  var newDate = inp.value; // browser gives "YYYY-MM-DDTHH:MM"
  if(!newDate){
    if(window.macUI) macUI.toast('⚠️ សូមជ្រើសរើសថ្ងៃខែ', 'warning');
    return;
  }

  /* ── 3. Convert "YYYY-MM-DDTHH:MM" → "DD/MM/YYYY HH:MM" ── */
  var parts = newDate.split('T');
  var dp    = parts[0].split('-');        // ["YYYY","MM","DD"]
  var time  = (parts[1] || '00:00').slice(0, 5);
  var formatted = dp[2]+'/'+dp[1]+'/'+dp[0]+' '+time;
  o.date     = formatted;
  o.dateTime = formatted; // keep dateTime in sync so Apps Script uses the new date

  /* ── 4. Button feedback — show ✅ so user knows it worked ── */
  var btn = document.querySelector('button[onclick="olSaveInlineDate()"]');
  if(btn){
    var origText = btn.textContent;
    var origBg   = btn.style.background;
    btn.textContent      = '✅ Saved!';
    btn.style.background = 'rgba(34,197,94,.25)';
    btn.style.color      = '#16a34a';
    setTimeout(function(){
      btn.textContent      = origText;
      btn.style.background = origBg;
      btn.style.color      = '#8b5cf6';
    }, 2000);
  }

  /* ── 6. Toast with actual saved value ── */
  if(window.macUI) macUI.toast('✅ ថ្ងៃខែ: '+formatted, 'success');

  /* ── 7. Sync to Google Sheet (background, non-blocking) ── */
  fetch(SCRIPT_URL, {
    method: 'POST',
    headers: {'Content-Type': 'text/plain;charset=utf-8'},
    body: JSON.stringify({ action: 'update', orderId: o.id, order: o })
  })
  .then(function(res){ return res.json(); })
  .then(function(data){
    if(data && data.ok === false && window.macUI){
      macUI.toast('⚠️ Local ✓ | Sheet: '+(data.message||'Error'), 'warning');
    }
  })
  .catch(function(){ /* Sheet offline — local save already done */ });
};

/* ── INIT ── */
function normalizeDeliveryName(raw){
  if(!raw) return '';
  var r = raw.trim();
  var lo = r.toLowerCase().replace(/\s+/g,'');
  // J&T
  if(/j[&+]t|jnt/i.test(lo)||lo==='jandt') return 'J&T';
  // DRSB
  if(/d[rn]s[bp]/i.test(r)) return 'DRSB';
  // វិរៈ ប៊ុនថាំ
  if(/vireak|buntham/i.test(r)||r.indexOf('វិរ')===0||r.indexOf('វីរ')===0||r.indexOf('វ឵រ')===0) return 'វិរៈ ប៊ុនថាំ';
  // ភ្នំពេញ តាធំ
  if(/តាធំ/.test(r)||/tathom|ta thom/i.test(r)) return 'ភ្នំពេញ តាធំ';
  // ភ្នំពេញ តាតូច
  if(/តាតូច/.test(r)||/tatoch|ta toch/i.test(r)) return 'ភ្នំពេញ តាតូច';
  // ដឹកខ្លួនឯង
  if(/ដឹកខ្លួន|ខ្លួនអើង|self|pickup/i.test(r)) return 'ដឹកខ្លួនឯង';
  return '';
}

function populateFilterOptions(){
  // Province: 2 groups derived from actual order data
  var provEl = $id('olProvince');
  if(provEl){
    var cur = provEl.value;
    var hasPP    = _orders.some(function(o){ return (o.province||'').trim()==='រាជធានីភ្នំពេញ'; });
    var hasOther = _orders.some(function(o){ var p=(o.province||'').trim(); return p && p!=='រាជធានីភ្នំពេញ'; });
    var opts = '<option value="">All</option>';
    if(hasPP)    opts += '<option value="រាជធានីភ្នំពេញ"'+(cur==='រាជធានីភ្នំពេញ'?' selected':'')+'>អ៊ីវ៉ាន់ ភ្នំពេញ</option>';
    if(hasOther) opts += '<option value="ខេត្ត"'+(cur==='ខេត្ត'?' selected':'')+'>អ៊ីវ៉ាន់ ខេត្ត</option>';
    provEl.innerHTML = opts;
  }
}

/* ── Load filter options from SaleInfor sheet ── */
function loadSaleInforFilters(){
  var CACHE_KEY = 'cambo_saleinfor_v1'; // shared cache with new-order.html

  function fillSelect(id, list){
    var el = $id(id);
    if(!el || !list || !list.length) return;
    var cur = el.value;
    el.innerHTML = '<option value="">All</option>' +
      list.map(function(v){ return '<option'+(v===cur?' selected':'')+'>'+v+'</option>'; }).join('');
    el.value = cur; // restore selection
  }

  function applyData(d){
    if(d.closeby  && d.closeby.length)  fillSelect('olCloseBy',  d.closeby);
    if(d.delivery && d.delivery.length) fillSelect('olDelivery', d.delivery);
    if(d.pages    && d.pages.length)    fillSelect('olPages',    d.pages);
    // Province is NOT loaded from SaleInfor — it uses 2 groups (ភ្នំពេញ / ខេត្ត) from order data
  }

  // Apply cached data immediately (no flicker)
  try {
    var cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if(cached) applyData(cached);
  } catch(_){}

  // Fetch fresh in background
  var url = SCRIPT_URL + (SCRIPT_URL.includes('?') ? '&' : '?') + 'action=saleinfor&_=' + Date.now();
  fetch(url, {redirect:'follow'})
    .then(function(r){ return r.json(); })
    .then(function(res){
      if(res.ok && res.saleinfor){
        applyData(res.saleinfor);
        try{ localStorage.setItem(CACHE_KEY, JSON.stringify(res.saleinfor)); }catch(_){}
      }
    })
    .catch(function(){});
}

async function init(){
  var r = getPreset('today');
  _date = {preset:'today', start:r.start, end:r.end, label:r.label};
  updateDateBtn();

  _orders = await loadOrders();
  // Auto-populate filter dropdowns from loaded data
  populateFilterOptions();
  loadSaleInforFilters();
  render();

  /* show date-desc sort arrow on initial load */
  var initArr = document.getElementById('arr-date');
  if(initArr) initArr.className = 'ol-arr desc';

  /* start background auto-refresh */
  startAutoRefresh();

  /* Search */
  $id('olSearch')?.addEventListener('input', function(e){
    _q=e.target.value.trim().toLowerCase();
    var clr=$id('olSearchClear');
    if(clr) clr.classList.toggle('show', e.target.value.length>0);
    render();
  });

  /* Select all */
  $id('olChkAll')?.addEventListener('change', function(e){
    var rows = getFiltered();
    rows.forEach(function(o){
      e.target.checked ? _sel.add(String(o.id)) : _sel.delete(String(o.id));
    });
    render(); // re-render to show checked state on all rows
  });

  /* Sort */
  document.querySelectorAll('.ol-sortable').forEach(function(th){
    th.addEventListener('click', function(){
      var col = th.dataset.col;
      _sort.dir = (_sort.col===col && _sort.dir==='asc') ? 'desc' : 'asc';
      _sort.col = col;
      // Reset all arrows
      document.querySelectorAll('.ol-arr').forEach(function(a){ a.className='ol-arr'; });
      // Set active arrow
      var arr = document.getElementById('arr-'+col);
      if(arr) arr.className = 'ol-arr ' + _sort.dir;
      render();
    });
  });

  /* ── FILTER button ── */
  $id('olFilterBtn')?.addEventListener('click', function(e){
    e.stopPropagation();
    var d=$id('olFilterDropdown'); if(!d) return;
    var opening = !d.classList.contains('open');
    closeAllDrops();
    if(opening){
      var isMobile = window.innerWidth <= 768;
      if(!isMobile) positionDrop(d, e.currentTarget);
      d.classList.add('open');
      if(isMobile){ var bd=$id('olBackdrop'); if(bd) bd.classList.add('show'); }
    }
  });

  /* Filter selects */
  $id('olClearFilter')?.addEventListener('click', function(e){
    e.stopPropagation();
    ['olDelivery','olProvince','olStatus','olPages','olPriority','olCloseBy'].forEach(function(id){ var el=$id(id); if(el) el.value=''; });
    _f={}; $id('olFilterDot')?.classList.remove('show'); render();
  });
  ['olDelivery','olProvince','olStatus','olPages','olPriority','olCloseBy'].forEach(function(id){
    $id(id)?.addEventListener('change', function(){
      _f.delivery=$id('olDelivery')?.value||'';
      _f.province=$id('olProvince')?.value||'';
      _f.status  =$id('olStatus')?.value  ||'';
      _f.pages   =$id('olPages')?.value   ||'';
      _f.priority=$id('olPriority')?.value||'';
      _f.closeBy =$id('olCloseBy')?.value ||'';
      var any=Object.values(_f).some(function(v){return !!v;});
      $id('olFilterDot')?.classList.toggle('show', any);
      render();
    });
  });

  /* ── DATE button ── */
  $id('olDateBtn')?.addEventListener('click', function(e){
    e.stopPropagation();
    var d=$id('olDatePop'); if(!d) return;
    var opening = !d.classList.contains('open');
    closeAllDrops();
    if(opening){
      var isMobile = window.innerWidth <= 768;
      if(!isMobile) positionDrop(d, e.currentTarget);
      d.classList.add('open');
      if(isMobile){ var bd=$id('olBackdrop'); if(bd) bd.classList.add('show'); }
    }
  });
  document.querySelectorAll('#olDatePop [data-p]').forEach(function(btn){
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      var r=getPreset(btn.dataset.p);
      _date={preset:btn.dataset.p,start:r.start,end:r.end,label:r.label};
      updateDateBtn(); render();
      $id('olDatePop')?.classList.remove('open');
    });
  });
  $id('olDApply')?.addEventListener('click', function(e){
    e.stopPropagation();
    var s=$id('olDs')?.value, en=$id('olDe')?.value;
    if(!s&&!en) return;
    _date={preset:'custom',start:s||en,end:en||s,label:'Custom'};
    updateDateBtn(); render();
    $id('olDatePop')?.classList.remove('open');
  });

  /* ── ACTIONS button ── */
  $id('olActBtn')?.addEventListener('click', function(e){
    e.stopPropagation();
    var d=$id('olActDrop'); if(!d) return;
    var opening = !d.classList.contains('open');
    closeAllDrops();
    if(opening){
      var isMobile = window.innerWidth <= 768;
      if(!isMobile) positionDrop(d, e.currentTarget);
      d.classList.add('open');
      if(isMobile){ var bd=$id('olBackdrop'); if(bd) bd.classList.add('show'); }
    }
  });
  $id('olActDrop')?.addEventListener('click', function(e){
    var btn=e.target.closest('[data-a]'); if(!btn) return;
    var a=btn.dataset.a;
    if(a==='qrtoggle'){
      _qrOn = !_qrOn;
      var qBtn = document.getElementById('olQrToggle');
      if(qBtn){
        qBtn.textContent = _qrOn ? 'QR Code: ON' : 'QR Code: OFF';
        qBtn.style.borderColor   = _qrOn ? 'rgba(34,197,94,.3)'   : 'rgba(239,68,68,.3)';
        qBtn.style.background    = _qrOn ? 'rgba(34,197,94,.12)'  : 'rgba(239,68,68,.1)';
        qBtn.style.color         = _qrOn ? '#4ade80'              : '#f87171';
      }
      return; // don't close panel
    }
    if(a==='shareimg') shareImg();
    if(a==='export')   exportCSV();
    if(a==='printall') printTable();
    if(a==='printsel') printSelected();
    if(a==='reportdelivery') reportDelivery();
    $id('olActDrop')?.classList.remove('open');
  });

  /* Close all on outside click */
  document.addEventListener('click', function(){
    document.querySelectorAll('.ol-dropdown.open').forEach(function(d){ d.classList.remove('open'); });
  });
  document.querySelectorAll('.ol-dropdown').forEach(function(d){
    d.addEventListener('click', function(e){ e.stopPropagation(); });
  });
}

/* ── Report Delivery ── */
function reportDelivery(){
  var src = getSrc();
  if(!src.length){ _olShowToast('មិនមានទិន្នន័យ', '#fbbf24'); return; }
  if(typeof window.CamboDeliveryReport === 'undefined'){
    _olShowToast('CamboDeliveryReport not loaded', '#f87171'); return;
  }
  var rows = src.map(function(o){
    var prods = getProds(o).map(function(p){
      return (p.name||'') + (p.qty && p.qty>1 ? ' x'+p.qty : '');
    }).join(', ');
    var total = getProds(o).reduce(function(s,p){
      return s + Number(p.qty||1)*Number(p.price||0) - Number(p.discount||0);
    },0) + Number(o.deliveryFee||0);
    return {
      id:    o.id || '',
      name:  o.customer || '',
      phone: o.phone || '',
      addr:  (o.addressDetail||o.address||'') || o.detailAddress || o.address || o.province || '-',
      prod:  prods,
      amt:   total,
      st:    o.status || o.orderStatus || '',
      date:  o.date || '',
      deliveryName: o.deliveryName || ''
    };
  });
  var dName = src.map(function(o){ return (o.deliveryName||'').trim(); }).filter(Boolean)[0] || 'ភ្នំពេញ';
  window.CamboDeliveryReport.exportRows(rows, { exchangeRate: 4100, title: dName });
}

/* ── Drawer Copy Text (Receipt format) ── */
window.olDrCopyText = function(){
  if(!_drawerOrderId) return;
  var o = _orders.find(function(x){ return String(x.id)===_drawerOrderId; });
  if(!o) return;

  // Support both o.items (new format) and o.products (old/sheet format)
  var rawLines = Array.isArray(o.items) && o.items.length ? o.items
               : Array.isArray(o.products) && o.products.length ? o.products
               : [];

  var total    = orderTotal(o);
  var subtotal = rawLines.reduce(function(s,p){
    return s + Number(p.qty||0)*Number(p.price||0) - Number(p.discount||0);
  }, 0);
  var dp = (o.date||'').slice(0,10).split('-');
  var dateStr = dp.length===3 ? dp[2]+'/'+dp[1]+'/'+dp[0] : (o.date||'-');

  function showCopyToast(){
    var t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1e293b;color:#4ade80;padding:10px 20px;border-radius:12px;font-size:13px;font-weight:700;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,.4)';
    t.textContent = '✅ Copy Text បានហើយ!';
    document.body.appendChild(t);
    setTimeout(function(){ t.remove(); }, 2000);
  }
  function fallbackCopy(txt){
    var ta = document.createElement('textarea');
    ta.value = txt; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove();
  }

  // Use CopyReceipt module if available, otherwise fall back to inline
  if(window.CopyReceipt){
    var mappedItems = rawLines.map(function(p){
      var qty   = Number(p.qty||1);
      var price = Number(p.price||0);
      var disc  = Number(p.discount||0);
      return { product: p.name||p.product||'', qty: qty, price: price, subtotal: qty*price-disc, unit: getProdUnit(p) };
    });
    window.CopyReceipt.copy({
      date:         dateStr,
      customer:     o.customer||'-',
      phone:        o.phone||'-',
      address:      o.addressDetail||o.address||o.province||'-',
      deliveryName: o.deliveryName||'-',
      note:         o.note||'-',
      page:         o.page||'-',
      closeBy:      o.closeBy||'-',
      payment:      o.payment||'-',
      items:        mappedItems,
      subtotal:     subtotal,
      deliveryFee:  Number(o.deliveryFee||0),
      grandTotal:   total,
      grandRiel:    Math.round(total * (window.KHR_RATE||4100))
    }).then(showCopyToast).catch(showCopyToast);
  } else {
    var dot  = '................................................';
    var fee  = Number(o.deliveryFee||0);
    var riel = Math.round(total*(window.KHR_RATE||4100)).toLocaleString();
    var prods = rawLines.map(function(p,i){
      var qty=Number(p.qty||1),price=Number(p.price||0),disc=Number(p.discount||0);
      return (i+1)+'. '+(p.name||p.product||'')+'\n   ចំនួន '+qty+' '+getProdUnit(p)+' x $'+price+'      = $'+(qty*price-disc);
    }).join('\n');
    var text = [
      '🧾 វិក័យប័ត្រ 📅 '+dateStr, dot,
      '👤 ឈ្មោះ:\t'+(o.customer||'-'),
      '📞 លេខទូរសព្ទ:\t'+(o.phone||'-'),
      '📍 ទីតាំង:\t'+(o.addressDetail||o.address||o.province||'-'),
      '🚚 អ្នកដឹកជញ្ជូន:\t'+(o.deliveryName||'-'),
      '📝 Note:\t\t'+(o.note||'-'), dot,
      '📦 ផលិតផល:', dot, prods, dot,
      '💵 សរុបទំនិញ: $'+subtotal,
      '🚛 សេវាដឹក: '+(fee>0?'$'+fee:'ហ្វ្រីដឹក'),
      '💳 ការទូទាត់: '+(o.payment||'-'),
      '💰 តម្លៃសរុប: $'+total,
      '🇰🇭 ប្រាក់រៀល: '+riel+'៛', dot,
      '📄 Page: '+(o.page||'-')+' | CloseBy: '+(o.closeBy||'-'),
      '☎️ លេខបម្រើអតិថិជន: 015 58 68 78 / 089 58 68 78', dot
    ].join('\n');
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(showCopyToast).catch(function(){ fallbackCopy(text); showCopyToast(); });
    } else { fallbackCopy(text); showCopyToast(); }
  }
};

document.addEventListener('DOMContentLoaded', init);
})();

/* ── Responsive: Mobile Card View ── */
(function(){
  var _origRender = window._olRenderCards;
  var _renderCards = function(rows){
    var cardList = document.getElementById('olCardList');
    if(!cardList) return;
    if(!rows || !rows.length){
      var emptyCard = _date && _date.preset === 'today'
        ? '📭 គ្មាន Order ថ្ងៃនេះ (' + displayDate(todayYMD()) + ')'
        : _date && _date.preset === 'all'
          ? '📭 គ្មាន Order ទាំងអស់'
          : '📭 គ្មាន Order';
      cardList.innerHTML = '<div style="text-align:center;padding:40px 16px;color:#94a3b8;font-size:14px">'+emptyCard+'</div>';
      return;
    }
    cardList.innerHTML = rows.map(function(o, idx){
      var total = orderTotal(o);
      var prodList = getProds(o);
      var itemCount = prodList.length;
      var prods = prodList.map(function(p){
        return (p.name||'')+(p.qty>1?' x'+p.qty:'');
      }).join(' / ');
      var th = typeof fmtDisplay==='function' ? fmtDisplay(o.date) : (o.date||'-');
      var closeBy  = o.closeBy||o.closeby||'-';
      var page     = o.page||o.pages||'-';
      var province = o.province||'-';
      var addrDetail = o.addressDetail||o.address||'-';
      var delivery = o.deliveryName||o.delivery||'-';
      var phone    = o.phone||'-';
      return '<div class="ol-card" data-id="'+o.id+'">'
        +'<div class="ol-card-top">'
          +'<span class="ol-card-num">#'+(idx+1)+'</span>'
          +'<span class="ol-card-name">'+(o.customer||'—')+'</span>'
          +'<span class="ol-card-phone">'+phone+'</span>'
          +'<span class="ol-card-total">$'+total.toFixed(2)+'</span>'
        +'</div>'
        +'<div class="ol-card-info">'
          +'<div class="ol-info-left">'
            +'<span class="ol-info-date">'+th+'</span>'
            +'<span class="ol-info-deli">'+delivery+'</span>'
          +'</div>'
          +'<div class="ol-info-cols">'
            +'<span class="ol-info-cell">'+addrDetail+'</span>'
            +'<span class="ol-info-cell">'+province+'</span>'
            +'<span class="ol-info-cell">'+page+'</span>'
            +'<span class="ol-info-cell">'+closeBy+'</span>'
          +'</div>'
        +'</div>'
        +(prods?'<div class="ol-card-prod">'+prods+'</div>':'')
        +(itemCount>0?'<span class="ol-item-badge">'+itemCount+'</span>':'')
        +'</div>';
    }).join('');
    cardList.querySelectorAll('.ol-card').forEach(function(c){
      c.addEventListener('click',function(){ if(typeof window.olOpenDrawer==='function') window.olOpenDrawer(this.dataset.id); });
    });
  };
  window._olRenderCards = _renderCards;
})();

