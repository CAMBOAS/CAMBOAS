/**
 * Product Manager v5 — CAMBO MINI Smart Orderer
 * Clean rewrite: IndexedDB storage, fullscreen modal, proper grid refresh
 */
(function(){
'use strict';

/* ══════════════ STORAGE (IndexedDB) ══════════════ */
var _db = null;
var DB_NAME = 'cambo_pm_db', DB_VER = 1, STORE = 'products';

function getDB(cb){
  if(_db){ cb(_db); return; }
  var r = indexedDB.open(DB_NAME, DB_VER);
  r.onupgradeneeded = function(e){
    e.target.result.createObjectStore(STORE, {keyPath:'id'});
  };
  r.onsuccess = function(e){ _db = e.target.result; cb(_db); };
  r.onerror   = function(){ _db = null; cb(null); };
}

function dbGetAll(cb){
  getDB(function(d){
    if(!d){ cb([]); return; }
    var r = d.transaction(STORE,'readonly').objectStore(STORE).getAll();
    r.onsuccess = function(){ cb(r.result||[]); };
    r.onerror   = function(){ cb([]); };
  });
}

function dbPut(item, cb){
  getDB(function(d){
    if(!d){ if(cb)cb(); return; }
    var r = d.transaction(STORE,'readwrite').objectStore(STORE).put(item);
    r.onsuccess = function(){ if(cb)cb(); };
    r.onerror   = function(){ if(cb)cb(); };
  });
}

function dbDelete(id, cb){
  getDB(function(d){
    if(!d){ if(cb)cb(); return; }
    var r = d.transaction(STORE,'readwrite').objectStore(STORE).delete(id);
    r.onsuccess = function(){ if(cb)cb(); };
    r.onerror   = function(){ if(cb)cb(); };
  });
}

/* ══════════════ INIT FROM DEFAULTS ══════════════ */
// Queue defaults if called before DB ready
var _pendingDefaults = null;

window.pmInitProducts = function(defaults){
  _pendingDefaults = defaults;
  // Will be processed in DOMContentLoaded after DB opens
  _doInit(defaults);
};

// Manual migration trigger - call window.pmForceMigrate() in console
window.pmForceMigrate = function(){
  if(_pendingDefaults){
    console.log('[PM] Force migrating...');
    _doInit(_pendingDefaults);
  } else {
    console.log('[PM] No pending defaults yet, please reload page');
  }
};

function _doInit(defaults){
  dbGetAll(function(saved){
    var savedIds = (saved||[]).map(function(p){ return String(p.id); });
    var defaultIds = (defaults||[]).map(function(d){ return String(d.id); });
    console.log('[PM] DB has', savedIds.length, 'products. Defaults:', defaultIds.length);
    // Find new defaults that aren't in DB yet (migration)
    var missing = (defaults||[]).filter(function(d){ return savedIds.indexOf(String(d.id)) === -1; });
    if(missing.length > 0){
      console.log('[PM] Migrating', missing.length, 'new products:', missing.map(function(m){return m.name;}));
    }

    if(saved && saved.length > 0 && missing.length === 0){
      // Already initialized — but sync img/price from defaults in case they changed
      var defaultMap = {};
      (defaults||[]).forEach(function(d){ defaultMap[String(d.id)] = d; });
      var syncDone = 0, syncNeeded = 0;
      saved.forEach(function(p){
        var def = defaultMap[String(p.id)];
        var newImg   = def ? (def.image || def.img || '') : p.img;
        var newPrice = def ? def.price : p.price;
        var imgChanged   = def && newImg && newImg !== p.img;
        var priceChanged = def && newPrice !== undefined && newPrice !== p.price;
        if(imgChanged || priceChanged){
          syncNeeded++;
          var updated = Object.assign({}, p);
          if(imgChanged)   updated.img   = newImg;
          if(priceChanged) updated.price = newPrice;
          dbPut(updated, function(){
            if(++syncDone === syncNeeded){
              dbGetAll(function(list){ window.__camboProducts = list; doRenderGrid(); });
            }
          });
        }
      });
      if(syncNeeded === 0){
        window.__camboProducts = saved;
        doRenderGrid();
      }
      return;
    }

    // Choose what to insert: missing (existing DB) OR all defaults (empty DB)
    var toInsert = (saved && saved.length > 0) ? missing : (defaults||[]);
    if(toInsert.length === 0){
      window.__camboProducts = saved || [];
      doRenderGrid();
      return;
    }
    var total = toInsert.length, done = 0;
    toInsert.forEach(function(d){
      dbPut({
        id:       String(d.id),
        name:     d.name,
        subName:  d.detail || d.subName || '',
        category: d.category,
        price:    d.price,
        img:      d.image || d.img || '',
        enabled:  true
      }, function(){
        if(++done === total){
          dbGetAll(function(list){
            window.__camboProducts = list;
            doRenderGrid();
          });
        }
      });
    });
  });
}

/* ══════════════ REFRESH GRID ══════════════ */
function doRenderGrid(){
  if(typeof window.renderProductGrid === 'function'){
    window.renderProductGrid();
  } else {
    // renderProductGrid not ready yet — retry after short delay
    setTimeout(function(){
      if(typeof window.renderProductGrid === 'function') window.renderProductGrid();
    }, 100);
  }
}

function reloadAndRefresh(afterCb){
  dbGetAll(function(list){
    window.__camboProducts = list;
    doRenderGrid();
    if(afterCb) afterCb(list);
  });
}

/* ══════════════ MODAL ══════════════ */
var _editItem = null; // null = add mode, object = edit mode
var _imgB64   = null;

function openModal(){
  document.getElementById('pmModal').hidden = false;
  document.body.style.overflow = 'hidden';
  showTab('list');
}

function closeModal(){
  document.getElementById('pmModal').hidden = true;
  document.body.style.overflow = '';
  _editItem = null;
  _imgB64   = null;
}

/* ══════════════ TABS ══════════════ */
function showTab(tab){
  document.querySelectorAll('.pmT').forEach(function(b){
    b.classList.toggle('pmT-on', b.dataset.tab === tab);
  });
  document.getElementById('pmTabList').hidden = (tab !== 'list');
  document.getElementById('pmTabForm').hidden = (tab !== 'form');
  if(tab === 'list') loadList('');
  if(tab === 'form') renderForm();
}

/* ══════════════ LIST ══════════════ */
function loadList(q){
  var el = document.getElementById('pmItems');
  if(!el) return;
  dbGetAll(function(list){
    window.__camboProducts = list;
    var term = (q||'').trim().toLowerCase();
    var fl   = term ? list.filter(function(p){ return p.name.toLowerCase().includes(term); }) : list;
    if(!fl.length){
      el.innerHTML = '<p class="pm-empty">'+(term ? 'រកមិនឃើញ' : 'គ្មានផលិតផល')+'</p>';
      return;
    }
    el.innerHTML = fl.map(function(p){
      var on = p.enabled !== false;
      return '<div class="pmi" data-id="'+esc(p.id)+'">' +
        (p.img
          ? '<img class="pmi-img" src="'+p.img+'" onerror="this.outerHTML=\'<div class=pmi-noimg>📦</div>\'">'
          : '<div class="pmi-noimg">📦</div>') +
        '<div class="pmi-info">' +
          '<span class="pmi-name">'+esc(p.name)+'</span>' +
          '<span class="pmi-meta">'+esc(p.category)+' · $'+parseFloat(p.price||0).toFixed(2)+'</span>' +
        '</div>' +
        '<div class="pmi-acts">' +
          '<button class="pmi-btn pmi-edit" data-id="'+esc(p.id)+'" title="កែ">✏️</button>' +
          '<button class="pmi-btn '+(on?'pmi-eye':'pmi-eye pmi-eye-off')+'" data-id="'+esc(p.id)+'" title="'+(on?'បិទ':'បើក')+'">'+(on?'👁':'🚫')+'</button>' +
          '<button class="pmi-btn pmi-del" data-id="'+esc(p.id)+'" title="លុប">🗑️</button>' +
        '</div>' +
      '</div>';
    }).join('');

    // Bind buttons
    el.querySelectorAll('.pmi-edit').forEach(function(b){
      b.addEventListener('click', function(){
        var id = b.dataset.id;
        var p  = list.find(function(x){ return String(x.id)===String(id); });
        if(!p) return;
        _editItem = p;
        _imgB64   = p.img || null;
        showTab('form');
      });
    });
    el.querySelectorAll('.pmi-eye').forEach(function(b){
      b.addEventListener('click', function(){
        var id = b.dataset.id;
        var p  = list.find(function(x){ return String(x.id)===String(id); });
        if(!p) return;
        p.enabled = !(p.enabled !== false);
        dbPut(p, function(){ reloadAndRefresh(function(){ loadList(document.getElementById('pmSearch').value); }); });
      });
    });
    el.querySelectorAll('.pmi-del').forEach(function(b){
      b.addEventListener('click', async function(){
        var id = b.dataset.id;
        var p  = list.find(function(x){ return String(x.id)===String(id); });
        if(!p) return;
        var ok = await macUI.confirm('លុប "'+p.name+'" ? មិនអាចត្រឡប់ក្រោយ!', 'លុបផលិតផល', true);
        if(!ok) return;
        dbDelete(String(id), function(){ reloadAndRefresh(function(){ loadList(document.getElementById('pmSearch').value); }); });
      });
    });
  });
}

/* ══════════════ FORM (Add / Edit) ══════════════ */
function renderForm(){
  var p = _editItem;
  document.getElementById('pmFormTitle').textContent = p ? '✏️ កែប្រែផលិតផល' : '➕ បន្ថែមផលិតផលថ្មី';
  document.getElementById('pmFName').value   = p ? p.name     : '';
  document.getElementById('pmFSub').value    = p ? (p.subName||'') : '';
  document.getElementById('pmFCat').value    = p ? p.category : 'Hair';
  document.getElementById('pmFPrice').value  = p ? p.price    : '';
  var pv = document.getElementById('pmImgPrev');
  if(p && p.img){
    pv.innerHTML = '<img src="'+p.img+'" style="width:100%;height:100%;object-fit:cover;border-radius:10px">';
    _imgB64 = p.img;
  } else {
    resetImgPrev();
  }
}

function resetImgPrev(){
  _imgB64 = null;
  var pv = document.getElementById('pmImgPrev');
  if(pv) pv.innerHTML =
    '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">'+
    '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/>'+
    '<polyline points="21 15 16 10 5 21"/></svg>'+
    '<span>ចុច ឬ Drag រូបភាព</span>';
}

/* ══════════════ IMAGE ══════════════ */
function bindUpload(){
  var zone = document.getElementById('pmImgZone');
  var fi   = document.getElementById('pmImgFile');
  if(!zone || !fi) return;

  function handleFile(f){
    if(!f || !f.type.startsWith('image/')){ alert('Image files only!'); return; }
    var rd = new FileReader();
    rd.onload = function(e){
      var img = new Image();
      img.onload = function(){
        var c = document.createElement('canvas');
        var m = 500, r = Math.min(m/img.width, m/img.height, 1);
        c.width = Math.round(img.width*r); c.height = Math.round(img.height*r);
        c.getContext('2d').drawImage(img,0,0,c.width,c.height);
        _imgB64 = c.toDataURL('image/jpeg',0.80);
        document.getElementById('pmImgPrev').innerHTML =
          '<img src="'+_imgB64+'" style="width:100%;height:100%;object-fit:cover;border-radius:10px">';
      };
      img.src = e.target.result;
    };
    rd.readAsDataURL(f);
  }

  zone.addEventListener('click', function(){ fi.click(); });
  fi.addEventListener('change', function(){ if(fi.files[0]) handleFile(fi.files[0]); fi.value=''; });
  zone.addEventListener('dragover',  function(e){ e.preventDefault(); zone.classList.add('pm-drag'); });
  zone.addEventListener('dragleave', function(){ zone.classList.remove('pm-drag'); });
  zone.addEventListener('drop', function(e){
    e.preventDefault(); zone.classList.remove('pm-drag');
    if(e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });
}

/* ══════════════ SAVE ══════════════ */
function bindSave(){
  var btn = document.getElementById('pmSaveBtn');
  if(!btn) return;
  btn.addEventListener('click', function(){
    var name  = (document.getElementById('pmFName') .value||'').trim();
    var sub   = (document.getElementById('pmFSub')  .value||'').trim();
    var cat   =  document.getElementById('pmFCat')  .value || 'Hair';
    var price = parseFloat(document.getElementById('pmFPrice').value)||0;

    if(!name){ alert('⚠️ សូមបញ្ចូលឈ្មោះ!'); return; }

    var item = _editItem
      ? Object.assign({}, _editItem, { name:name, subName:sub, category:cat, price:price, img:_imgB64||_editItem.img })
      : { id:'cp_'+Date.now(), name:name, subName:sub, category:cat, price:price, img:_imgB64||'', enabled:true };

    var isNew  = !_editItem;
    var origId = _editItem ? String(_editItem.id) : '';

    dbPut(item, function(){
      dbGetAll(function(list){
        window.__camboProducts = list;
        doRenderGrid();
        setTimeout(function(){
          var tabBtn = document.querySelector('.tab-btn[data-category="'+cat+'"]');
          if(tabBtn) tabBtn.click();
        }, 50);

        var base = (window.CamboAPI && window.CamboAPI.getBase) ? window.CamboAPI.getBase() : (window.APPS_SCRIPT_URL || '');
        if (base) {
          var catTypeMap = { Hair:'Hair Care', Body:'Body Care', Face:'Face Care', Drink:'Drinks' };
          if (isNew) {
            /* Add new product row to Google Sheets */
            fetch(base, {
              method:  'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body:    JSON.stringify({ action:'addProduct', data:{ name:name, type:catTypeMap[cat]||cat, price:price, sale:1, box:1 } }),
              redirect:'follow'
            }).then(function(r){ return r.json(); }).then(function(d){
              /* Update the local item id with the Sheets-assigned CAMBO-xxx id */
              if(d && d.ok && d.id) {
                item.id = d.id;
                dbPut(item, function(){ dbGetAll(function(l){ window.__camboProducts = l; doRenderGrid(); }); });
              }
            }).catch(function(){});
          } else if (origId && /^CAMBO-/i.test(origId)) {
            /* Update existing Sheets product */
            fetch(base, {
              method:  'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body:    JSON.stringify({ action:'updateProduct', id:origId, data:{ name:name, price:price } }),
              redirect:'follow'
            }).catch(function(){});
          }
        }

        _editItem = null;
        _imgB64   = null;
        showTab('list');
      });
    });
  });
}

/* ══════════════ HELPERS ══════════════ */
function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* ══════════════ DOM READY ══════════════ */
document.addEventListener('DOMContentLoaded', function(){
  var openBtn  = document.getElementById('pmOpenBtn');
  var closeBtn = document.getElementById('pmCloseBtn');
  var modal    = document.getElementById('pmModal');
  var search   = document.getElementById('pmSearch');
  var addBtn   = document.getElementById('pmAddBtn');

  if(openBtn)  openBtn.addEventListener('click', function(e){ e.stopPropagation(); openModal(); });
  if(closeBtn) closeBtn.addEventListener('click', closeModal);
  if(modal)    modal.addEventListener('click', function(e){ if(e.target===modal) closeModal(); });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeModal(); });

  if(search) search.addEventListener('input', function(){ loadList(search.value); });
  if(addBtn) addBtn.addEventListener('click', function(){ _editItem=null; _imgB64=null; showTab('form'); });

  document.querySelectorAll('.pmT').forEach(function(b){
    b.addEventListener('click', function(){ showTab(b.dataset.tab); });
  });

  bindUpload();
  bindSave();
});

})();
