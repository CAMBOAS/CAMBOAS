(function(){
'use strict';

var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzW7fNFKrIoE2hB1afSuQfKGr4laKna4Ife0K82x_viFwM9uUBMsyfYjeNz0RpEG5F2xA/exec';
var LS_KEY  = 'cambo_search_edit_orders_v3';
var PKG_KEY = 'cambo_pkg_status_v1';

var _orders   = [];
var _selected = new Set();
var _filter   = 'pending';
var _dateF    = '';
var _dateStart= '';
var _dateEnd  = '';
// Pending changes (not yet saved)
var _pendingStatus = {}; // {id: 'packed'|'pending'}

/* ── Product image map (auto-generated from images/products folder) ── */
/* ── Product image map: explicit name → image file ── */
var IMG_MAP = {"សាប៊ូកក់&ស្បាសក់ JELY": "../images/products/hair/សាប៊ូកក់សក់ និងស្បាសក់ JELY.png", "សាប៊ូកក់&ស្បាសក់ jely": "../images/products/hair/សាប៊ូកក់សក់ និងស្បាសក់ JELY.png", "សាប៊ូកក់&ស្បាសក់": "../images/products/hair/សាប៊ូកក់សក់ និងស្បាសក់ JELY.png", "សាប៊ូកក់&ម៉ាសសក់ CCR": "../images/products/hair/សាប៊ូកក់សក់ និងម៉ាសសក់ CCR.png", "សាប៊ូកក់&ម៉ាសសក់ ccr": "../images/products/hair/សាប៊ូកក់សក់ និងម៉ាសសក់ CCR.png", "សាប៊ូកក់&ម៉ាសសក់": "../images/products/hair/សាប៊ូកក់សក់ និងម៉ាសសក់ CCR.png", "ស្ព្រាយបាញ់សក់ CCR": "../images/products/hair/ស្រ្ពៃបាញ់សក់.png", "ស្ព្រាយបាញ់សក់ ccr": "../images/products/hair/ស្រ្ពៃបាញ់សក់.png", "ស្ព្រាយបាញ់សក់": "../images/products/hair/ស្រ្ពៃបាញ់សក់.png", "សាប៊ូកក់&ម៉ាសសក់ VIP 5in1 CCR": "../images/products/hair/សក់និងម៉ាស 5in1.png", "សាប៊ូកក់&ម៉ាសសក់ vip 5in1 ccr": "../images/products/hair/សក់និងម៉ាស 5in1.png", "សាប៊ូកក់&ម៉ាសសក់ vip 5in1": "../images/products/hair/សក់និងម៉ាស 5in1.png", "សាប៊ូកក់&ម៉ាសសក់ Premium CCR": "../images/products/hair/សក់និងម៉ាស Premium CCR.png", "សាប៊ូកក់&ម៉ាសសក់ premium ccr": "../images/products/hair/សក់និងម៉ាស Premium CCR.png", "សាប៊ូកក់&ម៉ាសសក់ premium": "../images/products/hair/សក់និងម៉ាស Premium CCR.png", "ប្រេងលាបសក់/សេរ៉ូមសក់ VIP CCR": "../images/products/hair/ប្រេងលាបសក់ CCR.png", "ប្រេងលាបសក់/សេរ៉ូមសក់ vip ccr": "../images/products/hair/ប្រេងលាបសក់ CCR.png", "ប្រេងលាបសក់/សេរ៉ូមសក់ vip": "../images/products/hair/ប្រេងលាបសក់ CCR.png", "ប្រេងលាបសក់/សេរ៉ូមសក់": "../images/products/hair/ប្រេងលាបសក់ CCR.png", "ឡេលាបខ្លួន Gluta SUDO": "../images/products/body/ឡេលាបខ្លួន Gluta SUDO.png", "ឡេលាបខ្លួន gluta sudo": "../images/products/body/ឡេលាបខ្លួន Gluta SUDO.png", "ឡេលាបខ្លួន gluta": "../images/products/body/ឡេលាបខ្លួន Gluta SUDO.png", "ឡេលាបខ្លួន": "../images/products/body/ឡេលាបខ្លួន Gluta SUDO.png", "សេរ៉ូមលាបខ្លួន JELY": "../images/products/body/សេរ៉ូមលាបខ្លួន JELY BODY ESSENCE VC WHITENGING.png", "សេរ៉ូមលាបខ្លួន jely": "../images/products/body/សេរ៉ូមលាបខ្លួន JELY BODY ESSENCE VC WHITENGING.png", "សេរ៉ូមលាបខ្លួន": "../images/products/body/សេរ៉ូមលាបខ្លួន JELY BODY ESSENCE VC WHITENGING.png", "ស្រ្ពៃក្លៀក/ឡេក្លៀក SUDO": "../images/products/body/ស្រ្ពៃក្លៀក និងឡេកលៀត.png", "ស្រ្ពៃក្លៀក/ឡេក្លៀក sudo": "../images/products/body/ស្រ្ពៃក្លៀក និងឡេកលៀត.png", "ស្រ្ពៃក្លៀក/ឡេក្លៀក": "../images/products/body/ស្រ្ពៃក្លៀក និងឡេកលៀត.png", "សាប៊ូដុសខ្លួន CCR (ក្លិនទឹកអប់)": "../images/products/body/សាប៊ូដុសខ្លួនមាសក្លិនទឹកអប់អូតែលផ្កាយ 5.png", "សាប៊ូដុសខ្លួន ccr (ក្លិនទឹកអប់)": "../images/products/body/សាប៊ូដុសខ្លួនមាសក្លិនទឹកអប់អូតែលផ្កាយ 5.png", "សាប៊ូដុសខ្លួនកុលាប CCR": "../images/products/body/សាប៊ូដុសខ្លួនកុលាប.png", "សាប៊ូដុសខ្លួនកុលាប ccr": "../images/products/body/សាប៊ូដុសខ្លួនកុលាប.png", "សាប៊ូដុសខ្លួនកុលាប": "../images/products/body/សាប៊ូដុសខ្លួនកុលាប.png", "ឡេលាបខ្លួន JELY": "../images/products/body/ឡេលាបខ្លួន JELY BODY LOTION.png", "ឡេលាបខ្លួន jely": "../images/products/body/ឡេលាបខ្លួន JELY BODY LOTION.png", "សាប៊ូកក់&ដុសខ្លួនក្មេង CCR": "../images/products/body/សាប៊ូកក់សក់និងដុសខ្លួនក្មេង CCR.png", "សាប៊ូកក់&ដុសខ្លួនក្មេង ccr": "../images/products/body/សាប៊ូកក់សក់និងដុសខ្លួនក្មេង CCR.png", "សាប៊ូកក់&ដុសខ្លួនក្មេង": "../images/products/body/សាប៊ូកក់សក់និងដុសខ្លួនក្មេង CCR.png", "ទឹកអនាម័យស្រ្ដី JELY": "../images/products/body/ទឹកអនាម័យស្រ្ដី JELY.png", "ទឹកអនាម័យស្រ្ដី jely": "../images/products/body/ទឹកអនាម័យស្រ្ដី JELY.png", "ទឹកអនាម័យស្រ្ដី": "../images/products/body/ទឹកអនាម័យស្រ្ដី JELY.png", "ក្រដាស់សើម CCR": "../images/products/face/ក្រដាស់សើម Remove MakeUp CCR.png", "ក្រដាស់សើម ccr": "../images/products/face/ក្រដាស់សើម Remove MakeUp CCR.png", "ក្រដាស់សើម": "../images/products/face/ក្រដាស់សើម Remove MakeUp CCR.png", "សំឡីវីតាមីន JELY Mask Pad": "../images/products/face/សំឡីវីតាមីន​ JELY.png", "សំឡីវីតាមីន jely mask pad": "../images/products/face/សំឡីវីតាមីន​ JELY.png", "សំឡីវីតាមីន jely": "../images/products/face/សំឡីវីតាមីន​ JELY.png", "BB Cream CCR": "../images/products/face/BB Cream.png", "bb cream ccr": "../images/products/face/BB Cream.png", "bb cream": "../images/products/face/BB Cream.png", "bb": "../images/products/face/BB Cream.png", "SUNSCREEN Cream CCR": "../images/products/face/SUNSCREEN CCR.png", "sunscreen cream ccr": "../images/products/face/SUNSCREEN CCR.png", "sunscreen cream": "../images/products/face/SUNSCREEN CCR.png", "sunscreen": "../images/products/face/SUNSCREEN CCR.png", "សាប៊ូមុខ JELY Gluta": "../images/products/face/សាប៊ូដុសមុខ JELY Gluta.png", "សាប៊ូមុខ jely gluta": "../images/products/face/សាប៊ូដុសមុខ JELY Gluta.png", "សាប៊ូមុខ jely": "../images/products/face/សាប៊ូដុសមុខ JELY Gluta.png", "សាប៊ូមុខយិនសិន CCR": "../images/products/face/សាប៊ូដុសមុខ យិនសិន CCR.png", "សាប៊ូមុខយិនសិន ccr": "../images/products/face/សាប៊ូដុសមុខ យិនសិន CCR.png", "សាប៊ូមុខយិនសិន": "../images/products/face/សាប៊ូដុសមុខ យិនសិន CCR.png", "CC SERUM JELY": "../images/products/face/CC SERUM JELY.png", "cc serum jely": "../images/products/face/CC SERUM JELY.png", "cc serum": "../images/products/face/CC SERUM JELY.png", "ឈុតមុខស្អាត JELY": "../images/products/face/ឈុតមុខស្អាត JELY.png", "ឈុតមុខស្អាត jely": "../images/products/face/ឈុតមុខស្អាត JELY.png", "ឈុតមុខស្អាត": "../images/products/face/ឈុតមុខស្អាត JELY.png", "ថ្នាំដុសធ្មេញ CCR": "../images/products/face/ថ្នាំដុសធ្មេញ CCR.png", "ថ្នាំដុសធ្មេញ ccr": "../images/products/face/ថ្នាំដុសធ្មេញ CCR.png", "ថ្នាំដុសធ្មេញ": "../images/products/face/ថ្នាំដុសធ្មេញ CCR.png", "ម៉ាស់បិទមុខ 6D CCR": "../images/products/face/ម៉ាស់បិទមុខ 6D CCR.png", "ម៉ាស់បិទមុខ 6d ccr": "../images/products/face/ម៉ាស់បិទមុខ 6D CCR.png", "ម៉ាស់បិទមុខ 6d": "../images/products/face/ម៉ាស់បិទមុខ 6D CCR.png", "ហ្វៃប័រផាសសិន CCR": "../images/products/drink/ហ្វៃប័រផាសសិន CCR.png", "ហ្វៃប័រផាសសិន ccr": "../images/products/drink/ហ្វៃប័រផាសសិន CCR.png", "ហ្វៃប័រផាសសិន": "../images/products/drink/ហ្វៃប័រផាសសិន CCR.png", "កាហ្វេសម្រក CCR": "../images/products/drink/កាហ្វេសម្រក CCR.png", "កាហ្វេសម្រក ccr": "../images/products/drink/កាហ្វេសម្រក CCR.png", "កាហ្វេសម្រក": "../images/products/drink/កាហ្វេសម្រក CCR.png"};

function getProductImg(product){
  // 1. base64 from IndexedDB (custom products)
  if(product.img && product.img.startsWith('data:')) return product.img;
  var name = (product.name||'').trim().toLowerCase();
  if(!name) return '';
  // 2. Exact match
  if(IMG_MAP[name]) return IMG_MAP[name];
  // 3. Fuzzy: find key that contains product name OR product name contains key
  var keys = Object.keys(IMG_MAP);
  for(var i=0;i<keys.length;i++){
    if(name.includes(keys[i]) || keys[i].includes(name)) return IMG_MAP[keys[i]];
  }
  // 4. Word match: any word in product name matches any word in key
  var words = name.split(/[\s&]+/).filter(function(w){return w.length>2;});
  for(var j=0;j<keys.length;j++){
    for(var k=0;k<words.length;k++){
      if(keys[j].includes(words[k])) return IMG_MAP[keys[j]];
    }
  }
  return '';
}

/* ── Data ── */

function todayYMD(){ var d=new Date(); return d.getFullYear()+'-'+(d.getMonth()+1<10?'0':'')+(d.getMonth()+1)+'-'+(d.getDate()<10?'0':'')+d.getDate(); }
function fixPhone(v){ var ph=String(v||'').trim(); if(ph && /^[1-9]\d{7,9}$/.test(ph)) ph='0'+ph; return ph; }

function normalizeOrders(arr){
  return (Array.isArray(arr)?arr:[]).map(function(o){
    // Normalize field name variations (Sheet may return different casing)
    function pick(keys){ for(var i=0;i<keys.length;i++){ if(o[keys[i]]!==undefined&&o[keys[i]]!==null&&o[keys[i]]!=='') return o[keys[i]]; } return ''; }
    if(o.phone!==undefined) o.phone = fixPhone(pick(['phone','Phone','PHONE','tel','Tel'])||o.phone||'');
    o.customer     = pick(['customer','Customer','name','Name'])     || o.customer     || '';
    o.province     = pick(['province','Province'])                   || o.province     || '';
    o.addressDetail= pick(['addressDetail','address','Address'])     || o.addressDetail|| '';
    o.deliveryName = pick(['deliveryName','delivery','DeliveryName','Delivery']) || o.deliveryName || '';
    o.deliveryFee  = Number(pick(['deliveryFee','DeliveryFee','delivery_fee','Delivery Fee'])||o.deliveryFee||0);
    o.status       = pick(['status','Status'])                       || o.status       || 'Pending';
    o.note         = pick(['note','Note'])                           || o.note         || '';
    o.page         = pick(['page','Page','pages','Pages'])           || o.page         || '';
    o.closeBy      = pick(['closeBy','CloseBy','closeby'])           || o.closeBy      || '';
    o.payment      = pick(['payment','Payment'])                     || o.payment      || '';
    // Map items → products (new-order.html saves as 'items')
    o.products = o.products || o.Products || o.items || [];
    if(!Array.isArray(o.products)) o.products = [];
    return o;
  });
}

/* Orders saved by new-order.html → key: 'camboOrders' */
function localCamboOrders(){
  try{ return normalizeOrders(JSON.parse(localStorage.getItem('camboOrders')||'[]')); }catch(e){ return []; }
}

/* Orders saved/edited via order-list → key: LS_KEY */
function localV3Orders(){
  try{ return normalizeOrders(JSON.parse(localStorage.getItem(LS_KEY)||'[]')); }catch(e){ return []; }
}

/* Merge: Sheet/primary wins on duplicate IDs; camboOrders appended for local-only entries */
function mergeOrders(primary, cambo){
  var ids = new Set(primary.map(function(o){ return String(o.id); }));
  var extra = cambo.filter(function(o){ return !ids.has(String(o.id)); });
  return primary.concat(extra);
}

async function loadOrders(){
  var camboLocal = localCamboOrders(); // always read new-order.html orders first
  try{
    var r = await fetch(SCRIPT_URL+'?action=list&limit=500&_='+Date.now());
    var d = await r.json();
    var arr = Array.isArray(d?.orders)      ? d.orders
            : Array.isArray(d?.data?.orders)? d.data.orders
            : Array.isArray(d?.rows)        ? d.rows
            : Array.isArray(d?.data)        ? d.data
            : null;
    if(arr) return mergeOrders(normalizeOrders(arr), camboLocal);
    return mergeOrders(localV3Orders(), camboLocal);
  }catch(e){ return mergeOrders(localV3Orders(), camboLocal); }
}

function savedPkg(){try{return JSON.parse(localStorage.getItem(PKG_KEY)||'{}');}catch{return{};}}
function savePkg(m){localStorage.setItem(PKG_KEY,JSON.stringify(m));}

// Get effective status (pending change OR saved)
function getStatus(id){
  if(_pendingStatus[id]!==undefined) return _pendingStatus[id];
  return savedPkg()[id]||'pending';
}
function isPacked(id){ return getStatus(id)==='packed'; }
function hasPendingChanges(){ return Object.keys(_pendingStatus).length>0; }

function orderTotal(o){
  return(o.products||[]).reduce((s,p)=>s+Number(p.qty||0)*Number(p.price||0)-Number(p.discount||0),0)
        +Number(o.deliveryFee||0);
}

/* ── Stats ── */
function updateStats(){
  const df=_orders.filter(o=>{
    if(!_dateStart&&!_dateEnd) return true;
    const d=toYMD(o.date);
    if(!d) return false;
    if(_dateStart&&d<_dateStart) return false;
    if(_dateEnd&&d>_dateEnd) return false;
    return true;
  });
  const t=df.length, pk=df.filter(o=>isPacked(o.id)).length;
  const rev=df.reduce((s,o)=>s+orderTotal(o),0);
  qs('stTotal').textContent=t;
  qs('stPending').textContent=t-pk;
  qs('stPacked').textContent=pk;
  qs('stRevenue').textContent='$'+rev.toFixed(2);
  // Show save button if pending changes
  const saveBtn=qs('pkgSaveBtn');
  if(saveBtn) saveBtn.style.display=hasPendingChanges()?'flex':'none';
}

/* ── Filter ── */
function toYMD(v){
  if(!v) return '';
  var s=String(v).trim();
  var pad2=function(x){return String(x).padStart(2,'0');};
  // ISO with time/timezone (e.g. "2026-05-17T17:00:00Z") → parse to LOCAL date
  if(/^\d{4}-\d{2}-\d{2}T/.test(s)||/Z$/.test(s)){
    var d=new Date(s);
    if(!isNaN(d)) return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate());
  }
  // YYYY-MM-DD date only → use as-is (no timezone shift)
  if(/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // DD/MM/YYYY (with optional time "18/05/2026 10:30") → YYYY-MM-DD
  if(/^\d{2}\/\d{2}\/\d{4}/.test(s)){
    var p=s.split('/'); return p[2].slice(0,4)+'-'+pad2(Number(p[1]))+'-'+pad2(Number(p[0]));
  }
  // Fallback: parse any other format to local date
  var d=new Date(s);
  if(!isNaN(d)) return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate());
  return '';
}
function filtered(){
  return _orders.filter(o=>{
    if(_filter==='pending'&&isPacked(o.id)) return false;
    if(_filter==='packed'&&!isPacked(o.id)) return false;
    if(_dateStart||_dateEnd){
      const d=toYMD(o.date);
      if(!d) return false;
      if(_dateStart && d<_dateStart) return false;
      if(_dateEnd   && d>_dateEnd)   return false;
    }
    return true;
  });
}

/* ── Image HTML ── */
function imgHtml(product, size){
  size=size||80;
  var src=getProductImg(product);
  if(src){
    return `<img class="pkg-prod-img" style="width:${size}px;height:${size}px"
      src="${src}"
      onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
      alt="">
    <div class="pkg-prod-img-ph" style="width:${size}px;height:${size}px;display:none">📦</div>`;
  }
  return `<div class="pkg-prod-img-ph" style="width:${size}px;height:${size}px">📦</div>`;
}

/* ── Render list ── */
function render(){
  updateStats();
  const el=document.getElementById('pkgList'); if(!el) return;
  const list=filtered();
  if(!list.length){
    el.innerHTML='<div class="pkg-empty">📦 គ្មានការបញ្ជា</div>'; return;
  }

  el.innerHTML=list.map(o=>{
    const packed=isPacked(o.id);
    const pending=_pendingStatus[o.id]!==undefined; // has unsaved change
    const prods=o.products||[];
    const sel=_selected.has(o.id);
    const firstProd = prods[0] || {};
    const dp=(o.date||'').slice(0,10).split('-');
    const dateFull=dp.length===3?dp[2]+'/'+dp[1]+'/'+dp[0]:'';
    const total=orderTotal(o);
    const clr=packed?'#10b981':'#ef4444';
    const bg=packed?'rgba(16,185,129,.12)':'rgba(239,68,68,.12)';
    const lbl=packed?'✓ វេចហើយ':'○ មិនទាន់';
    const chips=prods.map(p=>{
      const qty=Number(p.qty)||1;
      return `<span class="pk3-chip">${qty>1?`<b class="pk3-chip-qty">×${qty}</b> `:''}${esc(p.name||'')}</span>`;
    }).join('');
    return `<div class="pk3${packed?' pk3-packed':''}" data-id="${o.id}">
      <div class="pk3-bar" style="background:${clr}"></div>
      <input type="checkbox" class="pkg-cb pk3-cb" data-id="${o.id}"${sel?' checked':''} onclick="event.stopPropagation()">
      <div class="pk3-img">${imgHtml(firstProd,54)}</div>
      <div class="pk3-body">
        <span class="pk3-name">${esc(o.customer||'—')}</span>
        <div class="pk3-sub">
          <a class="pk3-ph" href="tel:${esc(o.phone||'')}" onclick="event.stopPropagation()">${esc(o.phone||'')}</a>
          <span class="pk3-dt">${dateFull}</span>
        </div>
        <div class="pk3-chips">${chips}</div>
        ${o.note?`<span class="pk3-note">📝 ${esc(o.note)}</span>`:''}
      </div>
      <div class="pk3-side">
        <span class="pk3-amt">$${total.toFixed(2).replace(/\.00$/,'')}</span>
        <button class="pk3-tog" data-id="${o.id}" onclick="event.stopPropagation()"
          style="background:${bg};border:1.5px solid ${clr};color:${clr}">${lbl}</button>
      </div>
    </div>`;
  }).join('');

  /* Bind: checkbox */
  el.querySelectorAll('.pkg-cb').forEach(cb=>{
    cb.addEventListener('change',e=>{
      e.stopPropagation();
      if(cb.checked)_selected.add(cb.dataset.id);
      else _selected.delete(cb.dataset.id);
      updateSelCount();
    });
  });

  /* Bind: status toggle (mark pending, NOT saved yet) */
  el.querySelectorAll('.pk3-tog').forEach(btn=>{
    btn.addEventListener('click',e=>{
      e.stopPropagation();
      const id=btn.dataset.id;
      const saved=savedPkg()[id]||'pending';
      const current=getStatus(id);
      const next=current==='packed'?'pending':'packed';
      // If reverting to saved state, remove from pending
      if(next===saved) delete _pendingStatus[id];
      else _pendingStatus[id]=next;
      render();
    });
  });

  /* Bind: click card → open detail */
  el.querySelectorAll('.pk3').forEach(card=>{
    card.addEventListener('click',e=>{
      // Don't open if clicking checkbox, toggle button, or phone link
      if(e.target.closest('.pk3-cb,.pk3-tog,.pk3-ph')) return;
      openDetail(card.dataset.id);
    });
    card.addEventListener('keydown',e=>{
      if(e.key==='Enter'||e.key===' ') openDetail(card.dataset.id);
    });
  });
}

function updateSelCount(){
  qs('pkgSelCount').textContent=_selected.size;
  const all=document.getElementById('pkgSelectAll');
  if(all) all.checked=_selected.size>0&&_selected.size===filtered().length;
}

/* ── SAVE pending changes ── */
function saveChanges(){
  if(!hasPendingChanges()) return;
  const map=savedPkg();
  Object.assign(map,_pendingStatus);
  savePkg(map);
  _pendingStatus={};
  render();
  toast('✅ បានរក្សាទុករួចរាល់!');
}

/* ── Detail panel ── */
function openDetail(id){
  const o=_orders.find(x=>String(x.id)===String(id)); if(!o) return;
  const prods=o.products||[];
  const total=orderTotal(o);

  document.getElementById('pkgDetailTitle').textContent=o.customer||'Order Detail';
  document.getElementById('pkgDetailTotal').textContent='$'+total.toFixed(2);

  const packed=isPacked(o.id);
  const stColor=packed?'#10b981':'#ef4444';
  const stLabel=packed?'✓ វេចខ្ចប់ហើយ':'○ មិនទាន់វេច';

  document.getElementById('pkgDetailBody').innerHTML=
    // Customer info block
    `<div class="pkg-dinfo" style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;padding:12px 14px;border-radius:10px;background:rgba(148,163,184,.06)">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:15px;font-weight:700;color:var(--text,#f1f5f9)">${esc(o.customer||'—')}</span>
        <span style="font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;background:${packed?'rgba(16,185,129,.15)':'rgba(239,68,68,.15)'};color:${stColor}">${stLabel}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px;color:var(--muted,#94a3b8)">
        <span>📞 <a href="tel:${esc(o.phone||'')}" style="color:#60a5fa">${esc(o.phone||'—')}</a></span>
        <span>📅 ${esc(o.date||'—')}</span>
        <span>📍 ${esc(o.addressDetail||o.province||'—')}</span>
        ${o.deliveryName?`<span>🚚 ${esc(o.deliveryName)}</span>`:'<span></span>'}
        ${o.note?`<span style="grid-column:1/-1;color:#fbbf24">📝 ${esc(o.note)}</span>`:''}
      </div>
    </div>`+
    // Product rows
    prods.map(p=>{
      const sub=Number(p.qty||0)*Number(p.price||0)-Number(p.discount||0);
      return `<div class="pkg-drow">
        <div class="pkg-drow-img">${imgHtml(p,60)}</div>
        <div class="pkg-drow-info">
          <div class="pkg-drow-name">${esc(p.name||'')}</div>
          <div class="pkg-drow-meta">
            <span>${p.qty||1} ឈុត</span>
            <span class="pkg-drow-price">$${Number(p.price||0).toFixed(2)}</span>
            ${Number(p.discount||0)>0?`<span style="color:#f59e0b;font-size:11px">-$${Number(p.discount).toFixed(2)}</span>`:'<span></span>'}
            <span class="pkg-drow-sub">$${sub.toFixed(2)}</span>
          </div>
          ${p.note?`<div class="pkg-drow-note">📝 ${esc(p.note)}</div>`:''}
        </div>
      </div>`;
    }).join('')+
    // Status toggle inside detail
    `<div style="margin-top:16px;padding-top:14px;border-top:1px solid rgba(148,163,184,.1);display:flex;justify-content:flex-end">
      <button onclick="toggleFromDetail('${esc(String(o.id))}')"
        style="padding:8px 20px;border-radius:10px;border:1.5px solid ${stColor};
               background:${packed?'rgba(16,185,129,.12)':'rgba(239,68,68,.12)'};
               color:${stColor};font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
        ${packed?'↩ ត្រឡប់ទៅ មិនទាន់':'✓ សម្គាល់ វេចហើយ'}
      </button>
    </div>`;

  document.getElementById('pkgDetailPanel').hidden=false;
  document.getElementById('pkgDetailOverlay').hidden=false;
}
function closeDetail(){
  document.getElementById('pkgDetailPanel').hidden=true;
  document.getElementById('pkgDetailOverlay').hidden=true;
}
function toggleFromDetail(id){
  // Toggle status and re-render detail
  const current=getStatus(id);
  _pendingStatus[id]=current==='packed'?'pending':'packed';
  render();
  openDetail(id); // refresh detail panel
}

/* ── Helpers ── */
function qs(id){return document.getElementById(id);}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function toast(msg, type){
  if(window.macUI){ macUI.toast(msg, type||'success'); return; }
  const t=document.createElement('div');
  t.className='pkg-toast'; t.textContent=msg;
  document.body.appendChild(t);
  setTimeout(()=>t.classList.add('show'),10);
  setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),300);},2500);
}

/* ══════════ ACTION FUNCTIONS ══════════ */

function escHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function getSrc(){
  var base = _selected.size>0
    ? _orders.filter(function(o){return _selected.has(o.id);})
    : filtered();
  // Apply receipt range (Start/End)
  var start = (typeof window.pkgGetReceiptStart==='function') ? window.pkgGetReceiptStart() : 1;
  var end   = (typeof window.pkgGetReceiptEnd  ==='function') ? window.pkgGetReceiptEnd()   : 99999;
  if(start>1 || end<99999){
    return base.slice(start-1, end);
  }
  return base;
}

function exportCSV(){
  var src=getSrc();
  var rows=[['Customer','Phone','Province','Products','Total','Status','Date','Delivery']];
  src.forEach(function(o){
    rows.push([o.customer||'',o.phone||'',o.province||'',
      (o.products||[]).map(function(p){return p.name+'×'+(p.qty||1);}).join(' | '),
      orderTotal(o).toFixed(2), isPacked(o.id)?'Packed':'Pending', o.date||'', o.deliveryName||'']);
  });
  var csv=rows.map(function(r){return r.map(function(v){return '"'+(v||'')+'"';}).join(',');}).join('\n');
  var a=document.createElement('a');
  a.href='data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(csv);
  a.download='packaging_'+new Date().toISOString().slice(0,10)+'.csv'; a.click();
  toast('📤 Export CSV done!');
}

function printSelected(){
  var src=getSrc();
  if(!src.length){toast('⚠️ មិនមានការបញ្ជា');return;}
  if(typeof ReceiptPrinter==='undefined'){toast('❌ ReceiptPrinter not loaded');return;}

  var manualNo  = (qs('pkgReceiptStart')?.value||'').trim();
  var qrEnabled = typeof window.pkgQrEnabled==='function' ? window.pkgQrEnabled() : true;

  function printNext(index){
    if(index>=src.length) return;
    var o=src[index];
    var prods=o.products||[];
    var subtotal=prods.reduce(function(s,p){
      return s+Number(p.qty||0)*Number(p.price||0)-Number(p.discount||0);
    },0);
    var deliveryFee=Number(o.deliveryFee||0);
    var grandTotal=subtotal+deliveryFee;
    var pay=(o.payment||'').toUpperCase();
    var qrPath='';
    if(qrEnabled){
      if(pay.includes('ABA'))     qrPath='../images/qr/ABA.png';
      else if(pay.includes('AC')) qrPath='../images/qr/AC.png';
    }
    var data={
      title:'វិក្កយបត្រ', paperWidth:'80mm',
      customer:o.customer||'', phone:o.phone||'',
      address:(o.addressDetail?o.addressDetail+' ៖ ':'')+( o.province||''),
      date:formatDate(o.date)||'', deliveryName:o.deliveryName||'',
      note:o.note||'-', page:o.page||o.pages||'',
      closeBy:o.closeBy||o.closeby||'', payment:o.payment||'',
      servicePhone:o.servicePhone||'015 58 68 78 / 089 58 68 78',
      qrImage:qrPath,
      qrLabel:pay.includes('ABA')?'ABA':pay.includes('AC')?'AC':(o.payment||''),
      accountName:'CHEA CHANROTHA',
      receiptNo: manualNo,
      items:prods.map(function(p){
        return {product:p.name||'',qty:Number(p.qty||1),price:Number(p.price||0),
          discount:Number(p.discount||0),
          subtotal:Number(p.qty||0)*Number(p.price||0)-Number(p.discount||0)};
      }),
      subtotal:subtotal, deliveryFee:deliveryFee, grandTotal:grandTotal,
      grandRiel:Math.round(grandTotal*4100)
    };
    if(src.length===1){ ReceiptPrinter.print(data); }
    else { setTimeout(function(){ ReceiptPrinter.print(data); printNext(index+1); }, index*700); }
  }
  printNext(0);
  toast('🖨️ Printing '+src.length+' receipt(s)...');
}

function printTable(){
  var src=filtered();
  if(!src.length){toast('⚠️ គ្មានទិន្នន័យ');return;}
  var html='<html><head><meta charset="UTF-8"><style>'
    +'body{font-family:Arial,sans-serif;font-size:11px;margin:0;padding:12px}'
    +'h2{margin:0 0 10px} table{width:100%;border-collapse:collapse}'
    +'th{background:#2c3e50;color:white;padding:6px 8px;text-align:left}'
    +'td{padding:5px 8px;border-bottom:1px solid #ddd;vertical-align:top}'
    +'tr:nth-child(even){background:#f9f9f9}'
    +'.pk{color:green;font-weight:bold} .pe{color:#c0392b;font-weight:bold}'
    +'.gt{background:#ecf0f1;font-weight:bold}'
    +'@media print{body{padding:0}}</style></head><body>'
    +'<h2>📦 CAMBO MINI — Packaging List</h2>'
    +'<table><thead><tr><th>#</th><th>ឈ្មោះ</th><th>ទូរស័ព្ទ</th><th>ខេត្ត</th><th>ផលិតផល</th><th>Items</th><th>សរុប</th><th>ស្ថានភាព</th><th>ថ្ងៃ</th></tr></thead><tbody>';
  var grand=0;
  src.forEach(function(o,i){
    var t=orderTotal(o); grand+=t;
    var pk=isPacked(o.id);
    html+='<tr><td>'+(i+1)+'</td><td><strong>'+escHtml(o.customer||'—')+'</strong></td><td>'+escHtml(o.phone||'')+'</td><td>'+escHtml(o.province||'')+'</td>'
      +'<td>'+(o.products||[]).map(function(p){return '• '+escHtml(p.name||'')+' ×'+(p.qty||1);}).join('<br>')+'</td>'
      +'<td style="text-align:center">'+((o.products||[]).length)+'</td><td>$'+t.toFixed(2)+'</td>'
      +'<td class="'+(pk?'pk':'pe')+'">'+(pk?'✅ Packed':'🔴 Pending')+'</td><td>'+escHtml(o.date||'')+'</td></tr>';
  });
  html+='<tr class="gt"><td colspan="6" style="text-align:right">Grand Total:</td><td>$'+grand.toFixed(2)+'</td><td colspan="2"></td></tr>'
    +'</tbody></table></body></html>';
  var w=window.open('','_blank','width=1000,height=700');
  w.document.write(html); w.document.close(); w.focus();
  setTimeout(function(){w.print();},400);
  toast('🖨️ Table print ready!');
}

function formatDate(raw){
  if(!raw) return '';
  // Already DD/MM/YYYY
  if(/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw;
  // YYYY-MM-DD
  if(/^\d{4}-\d{2}-\d{2}/.test(raw)){
    var p=raw.slice(0,10).split('-');
    return p[2]+'/'+p[1]+'/'+p[0];
  }
  // Try parse any date string
  try{
    var d=new Date(raw);
    if(!isNaN(d)){
      var dd=String(d.getDate()).padStart(2,'0');
      var mm=String(d.getMonth()+1).padStart(2,'0');
      var yy=d.getFullYear();
      return dd+'/'+mm+'/'+yy;
    }
  }catch(e){}
  return raw;
}

function shareImg(){
  var src = getSrc();
  if(!src.length){ toast('⚠️ មិនមានការបញ្ជា'); return; }

  if(typeof ShareReceipt === 'undefined'){
    toast('❌ ShareReceipt not loaded'); return;
  }

  // Get manual receipt number from input (empty = no receipt number)
  var manualReceiptNo = (qs('pkgReceiptStart')?.value || '').trim();
  var qrEnabled = (typeof window.pkgQrEnabled==='function') ? window.pkgQrEnabled() : true;
  var rielRate = 4100;

  function buildOrderData(o, idx){
    var prods = o.products || [];
    var subtotal = prods.reduce(function(s,p){
      return s + Number(p.qty||0)*Number(p.price||0) - Number(p.discount||0);
    }, 0);
    var deliveryFee = Number(o.deliveryFee || 0);
    var grandTotal  = subtotal + deliveryFee;
    var payMethod = (o.payment||'').toUpperCase();
    var qrPath = '';
    if(qrEnabled){
      if(payMethod.includes('ABA'))     qrPath = '../images/qr/ABA.png';
      else if(payMethod.includes('AC')) qrPath = '../images/qr/AC.png';
      else if(o.qrImage)                qrPath = o.qrImage;
    }
    // Receipt number: manual input only (no auto)
    var receiptNo = manualReceiptNo || '';
    return {
      title:        'វិក្កយបត្រ',
      date:         formatDate(o.date) || '',
      customer:     o.customer     || '',
      phone:        o.phone        || '',
      address:      (o.addressDetail ? o.addressDetail + ' ៖ ' : '') + (o.province || ''),
      deliveryName: o.deliveryName || '',
      note:         o.note         || '-',
      page:         o.page         || o.pages   || '',
      closeBy:      o.closeBy      || o.closeby || '',
      payment:      o.payment      || '',
      servicePhone: o.servicePhone || '015 58 68 78 / 089 58 68 78',
      qrImage:      qrPath,
      qrLabel:      payMethod.includes('ABA') ? 'ABA' : payMethod.includes('AC') ? 'AC' : (o.payment||''),
      accountName:  'CHEA CHANROTHA',
      receiptNo:    receiptNo,
      items: prods.map(function(p){
        return {
          product:  p.name    || '',
          qty:      Number(p.qty || 1),
          price:    Number(p.price    || 0),
          discount: Number(p.discount || 0),
          subtotal: Number(p.qty||0)*Number(p.price||0) - Number(p.discount||0)
        };
      }),
      subtotal:    subtotal,
      deliveryFee: deliveryFee,
      grandTotal:  grandTotal,
      grandRiel:   Math.round(grandTotal * rielRate)
    };
  }

  // Share first selected order (ShareReceipt shares one at a time)
  var o = src[0];
  var data = buildOrderData(o, 0);

  toast('⏳ កំពុងបង្កើតរូប...');

  ShareReceipt.share(data, {
    target:   document.getElementById('printArea'),
    fileName: 'receipt-' + (o.customer||'order').replace(/\s+/g,'_') + '-' + Date.now() + '.png',
    title:    'វិក្កយបត្រ — ' + (o.customer||''),
    text:     'Order receipt from CAMBO MINI'
  }).then(function(result){
    if(result.mode === 'share'){
      toast('✅ Shared!');
    } else {
      toast('✅ រូបបានDownload!');
    }
  }).catch(function(err){
    console.error('ShareReceipt error:', err);
    toast('❌ ' + (err.message || 'Share failed'));
  });
}

/* ── Init ── */
async function init(){
  const el=document.getElementById('pkgList');
  if(el) el.innerHTML='<div class="pkg-empty">⏳ Loading...</div>';
  _orders=await loadOrders();
  // Default: All Time + Pending (show all pending orders regardless of date)
  _dateStart = ''; _dateEnd = '';
  _filter = 'pending';
  // Update button label
  var lbl = document.getElementById('pkgDateLabel');
  if(lbl) lbl.textContent = 'All Time';
  // No preset button active by default
  document.querySelectorAll('.ol-date-preset').forEach(function(b){
    b.classList.toggle('active', b.dataset.p==='all');
  });
  render();

  /* Filter pills */
  document.querySelectorAll('.pkg-pill').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.pkg-pill').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      _filter=btn.dataset.f; render();
    });
  });

  /* ── Date Popover ── */
  function pad2(n){ return String(n).padStart(2,'0'); }
  function pkgPreset(p){
    var t=todayYMD(), now=new Date(t+'T00:00:00');
    if(p==='today')     return {s:t, e:t, label:'Today'};
    if(p==='yesterday') { var y=new Date(now); y.setDate(y.getDate()-1); var ys=y.getFullYear()+'-'+pad2(y.getMonth()+1)+'-'+pad2(y.getDate()); return {s:ys,e:ys,label:'Yesterday'}; }
    if(p==='last7')     { var s7=new Date(now); s7.setDate(s7.getDate()-6); return {s:s7.getFullYear()+'-'+pad2(s7.getMonth()+1)+'-'+pad2(s7.getDate()),e:t,label:'Last 7 Days'}; }
    if(p==='thisMonth') { var ms=new Date(now.getFullYear(),now.getMonth(),1),me=new Date(now.getFullYear(),now.getMonth()+1,0); return {s:ms.getFullYear()+'-'+pad2(ms.getMonth()+1)+'-01',e:me.getFullYear()+'-'+pad2(me.getMonth()+1)+'-'+pad2(me.getDate()),label:'This Month'}; }
    if(p==='lastMonth') { var lm=new Date(now.getFullYear(),now.getMonth()-1,1),lme=new Date(now.getFullYear(),now.getMonth(),0); return {s:lm.getFullYear()+'-'+pad2(lm.getMonth()+1)+'-01',e:lme.getFullYear()+'-'+pad2(lme.getMonth()+1)+'-'+pad2(lme.getDate()),label:'Last Month'}; }
    return {s:'',e:'',label:'All Time'};
  }
  function applyPkgDate(s,e,label){
    _dateStart=s; _dateEnd=e;
    var lbl=document.getElementById('pkgDateLabel');
    if(lbl) lbl.textContent=label;
    document.querySelectorAll('.ol-date-preset').forEach(b=>b.classList.remove('active'));
    document.getElementById('pkgDatePop').hidden=true;
    render();
  }
  // Preset buttons
  document.querySelectorAll('.ol-date-preset').forEach(btn=>{
    btn.addEventListener('click',function(){
      var p=this.dataset.p;
      document.querySelectorAll('.ol-date-preset').forEach(b=>b.classList.remove('active'));
      this.classList.add('active');
      var r=pkgPreset(p); applyPkgDate(r.s,r.e,r.label);
    });
  });
  // Custom OK
  document.getElementById('pkgCustomOK')?.addEventListener('click',function(){
    var s=document.getElementById('pkgCustomStart').value;
    var e=document.getElementById('pkgCustomEnd').value;
    if(!s&&!e) return;
    document.querySelectorAll('.ol-date-preset').forEach(b=>b.classList.remove('active'));
    var fmt=function(d){ var p=d.split('-'); return p[2]+'/'+p[1]+'/'+p[0]; };
    applyPkgDate(s||e, e||s, (s?fmt(s):'')+' → '+(e?fmt(e):''));
  });
  // Toggle popover
  document.getElementById('pkgDateBtn')?.addEventListener('click',function(e){
    e.stopPropagation();
    var pop=document.getElementById('pkgDatePop');
    pop.hidden=!pop.hidden;
  });
  document.addEventListener('click',function(){
    var pop=document.getElementById('pkgDatePop');
    if(pop) pop.hidden=true;
  });
  document.getElementById('pkgDatePop')?.addEventListener('click',function(e){e.stopPropagation();});

  /* Select all */
  qs('pkgSelectAll')?.addEventListener('change',e=>{
    if(e.target.checked) filtered().forEach(o=>_selected.add(o.id));
    else _selected.clear();
    render();
  });

  /* Save button */
  qs('pkgSaveBtn')?.addEventListener('click',saveChanges);

  /* Export panel toggle */
  var _expOpen = false;
  function openExp(){ if(qs('pkgExportPopover')) { qs('pkgExportPopover').hidden=false; _expOpen=true; } }
  function closeExp(){ if(qs('pkgExportPopover')) { qs('pkgExportPopover').hidden=true; _expOpen=false; } }

  qs('pkgExportToggle')?.addEventListener('click',function(e){
    e.stopPropagation(); _expOpen ? closeExp() : openExp();
  });
  document.addEventListener('click',function(e){
    if(_expOpen && !e.target.closest('#pkgExportWrap')) closeExp();
  });

  /* QR toggle */
  var _qrOn = true;
  qs('pkgQrToggle')?.addEventListener('click',function(){
    _qrOn = !_qrOn;
    qs('pkgQrToggle').textContent = _qrOn ? 'QR: ON' : 'QR: OFF';
    qs('pkgQrToggle').classList.toggle('qr-off', !_qrOn);
  });

  /* Export popover action buttons */
  qs('pkgExportPopover')?.addEventListener('click',function(e){
    var btn=e.target.closest('[data-act]'); if(!btn) return;
    var act=btn.dataset.act;
    if(act==='share')      { shareImg(); closeExp(); }
    if(act==='printsel')   { printSelected(); closeExp(); }
    if(act==='printtable') { printTable(); closeExp(); }
    if(act==='export')     { exportCSV(); closeExp(); }
  });

  /* Expose receipt range + QR flag to print functions */
  window.pkgGetReceiptStart = function(){ return parseInt(qs('pkgReceiptStart')?.value||'1')||1; };
  window.pkgGetReceiptEnd   = function(){
    var v=parseInt(qs('pkgReceiptEnd')?.value||'0');
    return v>0 ? v : 99999;
  };
  window.pkgQrEnabled = function(){ return _qrOn; };

  /* Detail panel close */
  qs('pkgDetailClose')?.addEventListener('click',closeDetail);
  qs('pkgBackBtn')?.addEventListener('click',closeDetail);
  qs('pkgDetailOverlay')?.addEventListener('click',closeDetail);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDetail();});
}

document.addEventListener('DOMContentLoaded',init);
})();

