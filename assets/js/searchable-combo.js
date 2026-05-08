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
  'Helen CCR','ហេឡេន CCR','Brand1 CCR','ចង់ទិញ CCR','ស្រីម៉ៅ JELY','សប្បាយទិញ CCR','JELY CCR BRAND','ចែម៉ៅ CCR BRAND','ចែម៉ៅ ចែលី BRAND','ចង់ស្អាត By HELEN','ស្រីម៉ៅ JELY BRAND','JELY BRAND BY HELEN'
];

var CLOSEBY = [
  'Jonh Helen','Srey LeanG','Srey Pichh','Srey Phear','Bong Phear','Admin'
];

var DELIVERY = [
  'ភ្នំពេញ តាធំ','ភ្នំពេញ តាតូច','វីរៈ ប៊ុនថាំ',
  'J&T','DRSB','Kerry Express','Ninja Van',
  'ដឹកខ្លួនឯង','Other'
];

/* ── Create one combo instance ── */
function makeCombo(wrap, dataList) {
  var inp = wrap.querySelector('.combo-input');
  var hid = wrap.querySelector('input[type=hidden]');
  if (!inp) return;

  /* Build inline dropdown div — append to BODY so no clip */
  var box = document.createElement('div');
  box.className = 'sc-box';
  box.style.cssText = 'display:none;position:fixed;z-index:99999;background:var(--sc-bg,#1a2035);border:1px solid rgba(148,163,200,.2);border-radius:12px;box-shadow:0 12px 36px rgba(0,0,0,.45);overflow-y:auto;max-height:220px;padding:4px;';
  document.body.appendChild(box);

  var currentList = dataList.slice();
  var shown = false;
  var hlIdx = -1;

  /* Render options */
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

  /* Position box near input */
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
    /* Close all other boxes first */
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

  /* Events */
  inp.addEventListener('focus', open);
  inp.addEventListener('click', function(e){ e.stopPropagation(); open(); });
  inp.addEventListener('input', function(){ if(!shown) open(); else render(inp.value); });

  inp.addEventListener('keydown', function(e) {
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

/* ── Init on DOM ready ── */
document.addEventListener('DOMContentLoaded', function(){
  var pagesWrap = document.getElementById('pagesCombo');
  if (pagesWrap) makeCombo(pagesWrap, PAGES);

  var closeByWrap = document.getElementById('closeByCombo');
  if (closeByWrap) makeCombo(closeByWrap, CLOSEBY);

  var provWrap = document.getElementById('provinceCombo');
  if (provWrap) makeCombo(provWrap, PROVINCES);

  var delivWrap = document.getElementById('deliveryCombo');
  if (delivWrap) makeCombo(delivWrap, DELIVERY);
});

})();
