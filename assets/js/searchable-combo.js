(function(){
'use strict';

var PROVINCES = [
  'រាជធានីភ្នំពេញ','ខេត្តបន្ទាយមានជ័យ','ខេត្តបាត់ដំបង',
  'ខេត្តកំពង់ចាម','ខេត្តកំពង់ឆ្នាំង','ខេត្តកំពង់ស្ពឺ',
  'ខេត្តកំពង់ធំ','ខេត្តកំពត','ខេត្តកណ្តាល','ខេត្តកែប',
  'ខេត្តកោះកុង','ខេត្តក្រចេះ','ខេត្តមណ្ឌលគិរី',
  'ខេត្តឧត្ដរមានជ័យ','ខេត្តប៉ៃលិន','ខេត្តព្រះវិហារ',
  'ខេត្តព្រៃវែង','ខេត្តពោធិ៍សាត់','ខេត្តព្រះសីហនុ',
  'ខេត្តរតនគិរី','ខេត្តសៀមរាប','ខេត្តស្ទឹងត្រែង',
  'ខេត្តស្វាយរៀង','ខេត្តតាកែវ','ខេត្តត្បូងឃ្មុំ'
];

var PAGES = [
  'Helen CCR','ហេឡេន CCR','Brand1 CCR','ចង់ទិញ CCR','ស្រីម៉ៅ JELY','CCR Supplier','ហេឡេន CCR II','សប្បាយទិញ CCR','ហេឡេន CCR III','JELY CCR BRAND','ចែម៉ៅ CCR BRAND','ចែម៉ៅ ចែលី BRAND','ចង់ស្អាត By HELEN','ស្រីម៉ៅ JELY BRAND','JELY BRAND BY HELEN'
];

var CLOSEBY = [
  'Jonh Helen','Srey LeanG','Srey Pichh','Srey Phear','Bong Phear','Admin'
];

var DELIVERY = [
  'ភ្នំពេញ តាធំ','ភ្នំពេញ តាតូច','វីរៈ ប៊ុនថាំ',
  'J&T','DRSB','Kerry Express','Ninja Van',
  'ដឹកខ្លួនឯង','Other'
];

/* ══════════════════════════════════════════
   MOBILE BOTTOM SHEET (smartphones ≤ 680px)
   ══════════════════════════════════════════ */
var _sheet = null, _overlay = null, _curInp = null, _curHid = null, _curList = null;

function isMobile() { return window.innerWidth <= 680; }

function ensureSheet() {
  if (_sheet) return;

  /* Inject styles */
  var style = document.createElement('style');
  style.textContent = [
    '.sc-bs-overlay{position:fixed;inset:0;background:rgba(0,0,0,.52);z-index:199990;opacity:0;transition:opacity .26s ease;pointer-events:none;}',
    '.sc-bs-overlay.sc-bs-on{opacity:1;pointer-events:all;}',
    '.sc-bs{position:fixed;bottom:0;left:0;right:0;max-height:78vh;background:#fff;border-radius:22px 22px 0 0;z-index:199995;transform:translateY(100%);transition:transform .32s cubic-bezier(.32,.72,0,1);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 -8px 40px rgba(0,0,0,.18);}',
    '[data-theme="dark"] .sc-bs{background:#15112b;}',
    '.sc-bs.sc-bs-on{transform:translateY(0);}',
    '.sc-bs-handle{width:40px;height:4px;border-radius:2px;background:rgba(0,0,0,.13);margin:10px auto 2px;flex-shrink:0;}',
    '[data-theme="dark"] .sc-bs-handle{background:rgba(255,255,255,.16);}',
    '.sc-bs-head{display:flex;align-items:center;justify-content:space-between;padding:4px 16px 8px;flex-shrink:0;}',
    '.sc-bs-title{font-size:15px;font-weight:800;color:#18213a;font-family:inherit;}',
    '[data-theme="dark"] .sc-bs-title{color:#e8e0ff;}',
    '.sc-bs-x{width:34px;height:34px;border:none;background:rgba(0,0,0,.07);border-radius:50%;font-size:15px;cursor:pointer;color:#6b7898;display:flex;align-items:center;justify-content:center;font-family:inherit;flex-shrink:0;}',
    '[data-theme="dark"] .sc-bs-x{background:rgba(255,255,255,.1);color:#a0aabf;}',
    '.sc-bs-sw{padding:0 12px 10px;flex-shrink:0;position:relative;}',
    '.sc-bs-si{width:100%;height:46px;border:1.5px solid rgba(0,0,0,.12);border-radius:14px;padding:0 14px 0 42px;font-size:16px;font-family:inherit;background:rgba(0,0,0,.04);color:#18213a;outline:none;box-sizing:border-box;}',
    '[data-theme="dark"] .sc-bs-si{border-color:rgba(255,255,255,.13);background:rgba(255,255,255,.07);color:#e8e0ff;}',
    '.sc-bs-si:focus{border-color:#7c5cff;}',
    '.sc-bs-sico{position:absolute;left:24px;top:50%;transform:translateY(-50%);color:#9aa3bf;pointer-events:none;font-size:16px;}',
    '.sc-bs-list{overflow-y:auto;flex:1;padding:4px 8px 16px;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;}',
    '.sc-bs-item{padding:14px 14px;font-size:15px;font-weight:500;color:#18213a;border-radius:14px;cursor:pointer;transition:background .12s;display:flex;align-items:center;border-bottom:1px solid rgba(0,0,0,.05);}',
    '[data-theme="dark"] .sc-bs-item{color:#e2d9ff;border-bottom-color:rgba(255,255,255,.06);}',
    '.sc-bs-item:last-child{border-bottom:none;}',
    '.sc-bs-item:active{background:rgba(124,92,255,.13);color:#7c5cff;}',
    '.sc-bs-item.sc-bs-sel{font-weight:800;color:#7c5cff;background:rgba(124,92,255,.09);}',
    '.sc-bs-empty{text-align:center;padding:24px 16px;font-size:13px;color:#9aa3bf;}',
  ].join('');
  document.head.appendChild(style);

  _overlay = document.createElement('div');
  _overlay.className = 'sc-bs-overlay';
  document.body.appendChild(_overlay);

  _sheet = document.createElement('div');
  _sheet.className = 'sc-bs';
  _sheet.innerHTML =
    '<div class="sc-bs-handle"></div>' +
    '<div class="sc-bs-head">' +
      '<span class="sc-bs-title" id="scBsTitle"></span>' +
      '<button class="sc-bs-x" id="scBsClose" type="button">✕</button>' +
    '</div>' +
    '<div class="sc-bs-sw">' +
      '<span class="sc-bs-sico">🔍</span>' +
      '<input class="sc-bs-si" id="scBsSearch" type="text" placeholder="ស្វែងរក..." autocomplete="off" />' +
    '</div>' +
    '<div class="sc-bs-list" id="scBsList"></div>';
  document.body.appendChild(_sheet);

  document.getElementById('scBsClose').addEventListener('click', closeSheet);
  _overlay.addEventListener('click', closeSheet);

  document.getElementById('scBsSearch').addEventListener('input', function() {
    renderSheet(_curList, this.value, _curHid ? _curHid.value : '');
  });
}

function renderSheet(list, q, selVal) {
  var listEl = document.getElementById('scBsList');
  if (!listEl) return;
  var term = (q || '').trim().toLowerCase();
  var filtered = term ? list.filter(function(v){ return v.toLowerCase().indexOf(term) >= 0; }) : list;
  if (!filtered.length) {
    listEl.innerHTML = '<div class="sc-bs-empty">រកមិនឃើញ "' + (q||'') + '"</div>';
    return;
  }
  listEl.innerHTML = filtered.map(function(v){
    var sel = v === selVal ? ' sc-bs-sel' : '';
    return '<div class="sc-bs-item' + sel + '" data-val="' + v.replace(/"/g,'&quot;') + '">' + v + '</div>';
  }).join('');
  listEl.querySelectorAll('.sc-bs-item').forEach(function(el){
    el.addEventListener('click', function(){
      var val = this.getAttribute('data-val');
      if (_curInp) _curInp.value = val;
      if (_curHid) { _curHid.value = val; _curHid.dispatchEvent(new Event('change',{bubbles:true})); }
      if (_curInp) _curInp.dispatchEvent(new Event('change',{bubbles:true}));
      closeSheet();
    });
  });
  /* Scroll selected into view */
  var sel = listEl.querySelector('.sc-bs-sel');
  if (sel) setTimeout(function(){ sel.scrollIntoView({block:'center'}); }, 50);
}

function openSheet(inp, hid, list, title) {
  ensureSheet();
  _curInp  = inp;
  _curHid  = hid;
  _curList = list;
  document.getElementById('scBsTitle').textContent = title || '';
  var search = document.getElementById('scBsSearch');
  search.value = '';
  renderSheet(list, '', hid ? hid.value : '');
  _overlay.classList.add('sc-bs-on');
  _sheet.classList.add('sc-bs-on');
  setTimeout(function(){ search.focus(); }, 340);
}

function closeSheet() {
  if (!_sheet) return;
  _sheet.classList.remove('sc-bs-on');
  _overlay.classList.remove('sc-bs-on');
  _curInp = _curHid = _curList = null;
}

/* ── Create one combo instance ── */
function makeCombo(wrap, dataList, title) {
  var inp = wrap.querySelector('.combo-input');
  var hid = wrap.querySelector('input[type=hidden]');
  if (!inp) return;

  /* Desktop inline dropdown */
  var box = document.createElement('div');
  box.className = 'sc-box';
  box.style.cssText = 'display:none;position:fixed;z-index:99999;background:var(--sc-bg,#1a2035);border:1px solid rgba(148,163,200,.2);border-radius:12px;box-shadow:0 12px 36px rgba(0,0,0,.45);overflow-y:auto;max-height:220px;padding:4px;';
  document.body.appendChild(box);

  var currentList = dataList.slice();
  var shown = false;
  var hlIdx = -1;

  function render(q) {
    var term = (q||'').trim().toLowerCase();
    box.innerHTML = '';
    var filtered = term ? currentList.filter(function(v){ return v.toLowerCase().indexOf(term) >= 0; }) : currentList;
    if (filtered.length === 0) {
      var nm = document.createElement('div');
      nm.style.cssText = 'padding:10px 12px;font-size:12px;color:var(--muted,#8fb6d9);text-align:center;';
      nm.textContent = '"'+(q||'')+'" — មិនមានក្នុងបញ្ជី';
      box.appendChild(nm);
      return;
    }
    filtered.forEach(function(v, i) {
      var d = document.createElement('div');
      d.className = 'sc-opt';
      d.textContent = v;
      d.style.cssText = 'padding:8px 12px;font-size:13px;color:var(--text,#e2e8f0);cursor:pointer;border-radius:8px;transition:background .1s;';
      if (v === (hid ? hid.value : '')) d.style.fontWeight = '700';
      d.addEventListener('mousedown', function(e){
        e.preventDefault();
        select(v);
      });
      d.addEventListener('mouseenter', function(){ hlIdx = i; highlight(); });
      box.appendChild(d);
    });
    hlIdx = -1;
  }

  function highlight() {
    var opts = box.querySelectorAll('.sc-opt');
    opts.forEach(function(o,i){
      o.style.background = i === hlIdx ? 'rgba(124,92,255,.18)' : '';
      o.style.color = i === hlIdx ? '#a78bfa' : 'var(--text,#e2e8f0)';
    });
  }

  function rePos() {
    var r = inp.getBoundingClientRect();
    var spaceDown = window.innerHeight - r.bottom - 6;
    var spaceUp   = r.top - 6;
    box.style.width = r.width + 'px';
    box.style.left  = r.left  + 'px';
    if (spaceDown >= 120 || spaceDown >= spaceUp) {
      box.style.top    = (r.bottom + 4) + 'px';
      box.style.bottom = 'auto';
      box.style.maxHeight = Math.min(220, spaceDown) + 'px';
    } else {
      box.style.bottom = (window.innerHeight - r.top + 4) + 'px';
      box.style.top    = 'auto';
      box.style.maxHeight = Math.min(220, spaceUp) + 'px';
    }
  }

  function open() {
    /* Mobile → bottom sheet */
    if (isMobile()) {
      inp.blur();
      openSheet(inp, hid, currentList, title);
      return;
    }
    document.querySelectorAll('.sc-box').forEach(function(b){
      if (b !== box) b.style.display = 'none';
    });
    render(inp.value);
    box.style.display = 'block';
    rePos();
    shown = true;
  }

  function close() {
    box.style.display = 'none';
    shown = false;
  }

  function select(val) {
    inp.value = val;
    if (hid) { hid.value = val; hid.dispatchEvent(new Event('change',{bubbles:true})); }
    close();
  }

  inp.addEventListener('focus', open);
  inp.addEventListener('click', function(e){ e.stopPropagation(); open(); });
  inp.addEventListener('input', function(){ if(!shown) open(); else render(inp.value); });

  inp.addEventListener('keydown', function(e) {
    if (isMobile()) return;
    var opts = box.querySelectorAll('.sc-opt');
    if (e.key === 'ArrowDown') { e.preventDefault(); hlIdx = Math.min(hlIdx+1, opts.length-1); highlight(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); hlIdx = Math.max(hlIdx-1, 0); highlight(); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (hlIdx >= 0 && opts[hlIdx]) select(opts[hlIdx].textContent);
      else if (inp.value.trim()) select(inp.value.trim());
    }
    else if (e.key === 'Escape' || e.key === 'Tab') close();
  });

  document.addEventListener('click', function(e){
    if (shown && !wrap.contains(e.target) && !box.contains(e.target)) close();
  });

  window.addEventListener('scroll', function(){ if(shown) rePos(); }, {passive:true, capture:true});
  window.addEventListener('resize', function(){ if(shown) rePos(); }, {passive:true});
}

/* ── Expose API for external use (e.g. Order List drawer) ── */
window.SearchableCombo = {
  makeCombo : makeCombo,
  PROVINCES : PROVINCES,
  PAGES     : PAGES,
  CLOSEBY   : CLOSEBY,
  DELIVERY  : DELIVERY
};

/* ── Init on DOM ready ── */
document.addEventListener('DOMContentLoaded', function(){
  var pagesWrap = document.getElementById('pagesCombo');
  if (pagesWrap) makeCombo(pagesWrap, PAGES, 'Pages');

  var closeByWrap = document.getElementById('closeByCombo');
  if (closeByWrap) makeCombo(closeByWrap, CLOSEBY, 'CloseBy');

  var provWrap = document.getElementById('provinceCombo');
  if (provWrap) makeCombo(provWrap, PROVINCES, 'ខេត្ត / ក្រុង');

  var delivWrap = document.getElementById('deliveryCombo');
  if (delivWrap) makeCombo(delivWrap, DELIVERY, 'ដឹកជញ្ជូន');
});

})();
