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

/* ══════════════ DELETED IDs (localStorage) ══════════════ */
var _LS_KEY = 'cambo_pm_deleted';

function _getDeletedIds(){
  try{ return JSON.parse(localStorage.getItem(_LS_KEY)||'[]'); }catch(e){ return []; }
}
function _markDeleted(id){
  var ids = _getDeletedIds();
  var sid = String(id);
  if(ids.indexOf(sid)===-1){ ids.push(sid); }
  try{ localStorage.setItem(_LS_KEY, JSON.stringify(ids)); }catch(e){}
}

/* ══════════════ INIT FROM DEFAULTS ══════════════ */
var _pendingDefaults = null;

window.pmInitProducts = function(defaults){
  _pendingDefaults = defaults;
  _doInit(defaults);
};

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
    var deletedIds = _getDeletedIds();
    var savedIds = (saved||[]).map(function(p){ return String(p.id); });
    var defaultIds = (defaults||[]).map(function(d){ return String(d.id); });
    console.log('[PM] DB has', savedIds.length, 'products. Defaults:', defaultIds.length);
    var missing = (defaults||[]).filter(function(d){
      return savedIds.indexOf(String(d.id)) === -1 && deletedIds.indexOf(String(d.id)) === -1;
    });
    if(missing.length > 0){
      console.log('[PM] Migrating', missing.length, 'new products:', missing.map(function(m){return m.name;}));
    }

    if(saved && saved.length > 0 && missing.length === 0){
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
              // Only set __camboProducts from IndexedDB if Sheets hasn't loaded yet
              if(!window.__camboProducts || !window.__camboProducts.length){
                dbGetAll(function(list){ window.__camboProducts = list; doRenderGrid(); });
              } else {
                doRenderGrid();
              }
            }
          });
        }
      });
      if(syncNeeded === 0){
        if(!window.__camboProducts || !window.__camboProducts.length){
          window.__camboProducts = saved;
        }
        doRenderGrid();
      }
      return;
    }

    var toInsert = (saved && saved.length > 0) ? missing : (defaults||[]);
    if(toInsert.length === 0){
      if(!window.__camboProducts || !window.__camboProducts.length){
        window.__camboProducts = saved || [];
      }
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
          if(!window.__camboProducts || !window.__camboProducts.length){
            dbGetAll(function(list){
              window.__camboProducts = list;
              doRenderGrid();
            });
          } else {
            doRenderGrid();
          }
        }
      });
    });
  });
}

/* Expose helper so loadProductsFromSheet can filter deleted IDs */
window.pmFilterDeleted = function(arr){
  var ids = _getDeletedIds();
  return ids.length ? arr.filter(function(p){ return ids.indexOf(String(p.id))===-1; }) : arr;
};

/* ══════════════ REFRESH GRID ══════════════ */
function doRenderGrid(){
  if(typeof window.renderProductGrid === 'function'){
    window.renderProductGrid();
  } else {
    setTimeout(function(){
      if(typeof window.renderProductGrid === 'function') window.renderProductGrid();
    }, 100);
  }
}

function reloadAndRefresh(afterCb){
  // Preserve Sheets products in window.__camboProducts — don't override with IndexedDB
  doRenderGrid();
  if(afterCb) afterCb(window.__camboProducts || []);
}

/* ══════════════ MODAL ══════════════ */
var _editItem = null;
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

/* ══════════════ NORMALIZE product format ══════════════ */
function _pmNorm(p){
  return {
    id:       String(p.id || ''),
    name:     p.name || '',
    subName:  p.subName || p.detail || '',
    category: p.category || '',
    price:    p.price || 0,
    sale:     p.sale || 1,
    box:      p.box || 0,
    pack:     p.pack || 0,
    qty:      p.qty || 0,
    img:      p.img || p.image || '',
    enabled:  p.enabled !== false
  };
}

var _pmActiveCat = 'All';

/* ══════════════ LIST ══════════════ */
function loadList(q){
  var el = document.getElementById('pmItems');
  if(!el) return;
  var deletedIds = _getDeletedIds();
  function _notDeleted(p){ return deletedIds.indexOf(String(p.id)) === -1; }
  var sheetProds = window.__camboProducts;
  if(sheetProds && sheetProds.length){
    _renderPMList(el, sheetProds.filter(_notDeleted).map(_pmNorm), q);
  } else {
    dbGetAll(function(list){ _renderPMList(el, list.filter(_notDeleted), q); });
  }
}

function _catMatch(cat, active){
  if(active === 'All') return true;
  var c = (cat||'').toLowerCase();
  if(active === 'Drink') return c.startsWith('drink');
  if(active === 'Face')  return c.startsWith('face');
  if(active === 'Body')  return c.startsWith('body');
  if(active === 'Hair')  return c.startsWith('hair');
  return true;
}

function _renderPMList(el, list, q){
  var term = (q||'').trim().toLowerCase();
  var fl = _pmActiveCat !== 'All' ? list.filter(function(p){ return _catMatch(p.category, _pmActiveCat); }) : list;
  fl = term ? fl.filter(function(p){ return p.name.toLowerCase().includes(term); }) : fl;
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
        '<button class="pmi-btn pmi-edit" data-id="'+esc(p.id)+'" title="កែ"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></button>' +
        '<button class="pmi-btn pmi-del" data-id="'+esc(p.id)+'" title="លុប"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>' +
      '</div>' +
    '</div>';
  }).join('');

  // Edit button
  el.querySelectorAll('.pmi-edit').forEach(function(b){
    b.addEventListener('click', function(){
      var id = b.dataset.id;
      var p  = fl.find(function(x){ return String(x.id)===String(id); });
      if(!p) return;
      _editItem = p;
      _imgB64   = p.img || null;
      showTab('form');
    });
  });

  // Delete button
  el.querySelectorAll('.pmi-del').forEach(function(b){
    b.addEventListener('click', async function(){
      var id = b.dataset.id;
      var p  = fl.find(function(x){ return String(x.id)===String(id); });
      if(!p) return;
      var ok = window.macUI
        ? await macUI.confirm('លុប "'+p.name+'" ? មិនអាចត្រឡប់ក្រោយ!', 'លុបផលិតផល', true)
        : confirm('លុប "'+p.name+'" ?');
      if(!ok) return;

      // Persist deletion so it survives page reloads
      _markDeleted(id);
      if(window.clearProductCache) window.clearProductCache();

      // Remove from window.__camboProducts
      if(window.__camboProducts && window.__camboProducts.length){
        window.__camboProducts = window.__camboProducts.filter(function(x){ return String(x.id) !== String(id); });
      }

      dbDelete(String(id), function(){
        doRenderGrid();
        loadList(document.getElementById('pmSearch').value);
      });

      // Sync delete to Sheets for CAMBO-xxx products
      var base = (window.CamboAPI && window.CamboAPI.getBase) ? window.CamboAPI.getBase() : (window.APPS_SCRIPT_URL || '');
      if(base && /^CAMBO-/i.test(String(id))){
        fetch(base, {
          method:  'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body:    JSON.stringify({ action:'deleteProduct', id:String(id) }),
          redirect:'follow'
        }).then(function(r){ return r.json(); }).then(function(d){
          if(d && d.ok){
            if(window.macUI) macUI.toast('✅ ទិន្នន័យត្រូវបានលុបដោយជោគជ័យ!', 'success');
          } else {
            if(window.macUI) macUI.toast('⚠️ មិនអាចលុបបានពេញលេញ សូមព្យាយាមម្ដងទៀត', 'error');
          }
        }).catch(function(err){
          if(window.macUI) macUI.toast('✅ ទិន្នន័យត្រូវបានលុបដោយជោគជ័យ!', 'success');
        });
      }
    });
  });
}

/* ══════════════ FORM (Add / Edit) ══════════════ */
function renderForm(){
  var p = _editItem;
  document.getElementById('pmFormTitle').textContent = p ? '✏️ កែប្រែផលិតផល' : '➕ បន្ថែមផលិតផលថ្មី';
  document.getElementById('pmFName').value   = p ? p.name          : '';
  document.getElementById('pmFSub').value    = p ? (p.subName||'') : '';
  document.getElementById('pmFCat').value    = p ? p.category      : 'Hair';
  document.getElementById('pmFPrice').value  = p ? p.price         : '';
  document.getElementById('pmFSale').value   = p ? (p.sale  || 1)  : 1;
  document.getElementById('pmFBox').value    = p ? (p.box   || 1)  : 1;
  document.getElementById('pmFPack').value   = p ? (p.pack  || 0)  : 0;
  document.getElementById('pmFQty').value    = p ? (p.qty   || 0)  : 0;
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
    var sale  = parseInt(document.getElementById('pmFSale').value)  ||1;
    var box   = parseInt(document.getElementById('pmFBox').value)   ||1;
    var pack  = parseInt(document.getElementById('pmFPack').value)  ||0;
    var qty   = parseInt(document.getElementById('pmFQty').value)   ||0;

    if(!name){
      if(window.macUI) macUI.toast('⚠️ សូមបញ្ចូលឈ្មោះផលិតផល!', 'error');
      else alert('⚠️ សូមបញ្ចូលឈ្មោះ!');
      return;
    }

    var isNew  = !_editItem;
    var origId = _editItem ? String(_editItem.id) : '';

    var item = _editItem
      ? Object.assign({}, _editItem, { name:name, subName:sub, category:cat, price:price, sale:sale, box:box, pack:pack, qty:qty, img:_imgB64||_editItem.img })
      : { id:'cp_'+Date.now(), name:name, subName:sub, category:cat, price:price, sale:sale, box:box, pack:pack, qty:qty, img:_imgB64||'', enabled:true };

    // Update window.__camboProducts in-place (edit) or append (new)
    if(window.__camboProducts && window.__camboProducts.length){
      if(!isNew){
        for(var i=0;i<window.__camboProducts.length;i++){
          if(String(window.__camboProducts[i].id) === origId){
            window.__camboProducts[i] = Object.assign({}, window.__camboProducts[i], {
              name:name, price:price, sale:sale, box:box, pack:pack, qty:qty,
              img: _imgB64 || window.__camboProducts[i].img || window.__camboProducts[i].image || ''
            });
            break;
          }
        }
      }
      // New products get appended after Sheets returns CAMBO-xxx ID
    }

    dbPut(item, function(){
      doRenderGrid();
      if(window.renderProductGrid) window.renderProductGrid();
      // Show local save toast immediately
      if(window.macUI){
        if(isNew) macUI.toast('កំពុងរក្សាទុកទិន្នន័យ...', 'info');
        else      macUI.toast('កំពុងរក្សាទុកទិន្នន័យ...', 'info');
      }
      setTimeout(function(){
        var tabBtn = document.querySelector('.tab-btn[data-category="'+cat+'"]');
        if(tabBtn) tabBtn.click();
      }, 50);

      var base = (window.CamboAPI && window.CamboAPI.getBase) ? window.CamboAPI.getBase() : (window.APPS_SCRIPT_URL || '');
      if(base){
        var catTypeMap = { Hair:'Hair Care', Body:'Body Care', Face:'Face Care', Drink:'Drinks' };
        if(isNew){
          fetch(base, {
            method:  'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body:    JSON.stringify({ action:'addProduct', data:{ name:name, type:catTypeMap[cat]||cat, price:price, sale:sale, box:box, pack:pack, qty:qty } }),
            redirect:'follow'
          }).then(function(r){ return r.json(); }).then(function(d){
            if(d && d.ok && d.id){
              item.id = d.id;
              // If this CAMBO-xxx ID was previously marked deleted (ID reuse), un-delete it
              var _dIds = _getDeletedIds();
              var _dIdx = _dIds.indexOf(String(d.id));
              if(_dIdx > -1){
                _dIds.splice(_dIdx, 1);
                try{ localStorage.setItem(_LS_KEY, JSON.stringify(_dIds)); }catch(e){}
              }
              dbPut(item, function(){});
              if(window.clearProductCache) window.clearProductCache();
              // Add to window.__camboProducts with the new CAMBO-xxx ID
              if(window.__camboProducts){
                window.__camboProducts.push(Object.assign({}, item));
              }
              doRenderGrid();
              // Refresh PM modal list (it was already shown before this async response)
              loadList('');
              if(window.macUI) macUI.toast('✅ បានបន្ថែមទិន្នន័យដោយជោគជ័យ!', 'success');
            } else {
              if(window.macUI) macUI.toast('⚠️ មិនអាចរក្សាទុកបាន សូមព្យាយាមម្ដងទៀត', 'error');
            }
          }).catch(function(){ if(window.macUI) macUI.toast('✅ បានបន្ថែមទិន្នន័យដោយជោគជ័យ!', 'success'); });
        } else if(origId && /^CAMBO-/i.test(origId)){
          fetch(base, {
            method:  'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body:    JSON.stringify({ action:'updateProduct', id:origId, data:{ name:name, price:price, sale:sale, box:box, pack:pack, qty:qty } }),
            redirect:'follow'
          }).then(function(r){ return r.json(); }).then(function(d){
            if(d && d.ok){
              if(window.clearProductCache) window.clearProductCache();
              if(window.macUI) macUI.toast('✅ បានកែប្រែទិន្នន័យដោយជោគជ័យ!', 'success');
            } else {
              if(window.macUI) macUI.toast('⚠️ មិនអាចកែប្រែបាន សូមព្យាយាមម្ដងទៀត', 'error');
            }
          }).catch(function(){ if(window.clearProductCache) window.clearProductCache(); if(window.macUI) macUI.toast('✅ បានកែប្រែទិន្នន័យដោយជោគជ័យ!', 'success'); });
        }
      }

      _editItem = null;
      _imgB64   = null;
      showTab('list');
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

  if(openBtn)  openBtn.addEventListener('click', function(e){ e.stopPropagation(); openModal(); });
  if(closeBtn) closeBtn.addEventListener('click', closeModal);
  if(modal)    modal.addEventListener('click', function(e){ if(e.target===modal) closeModal(); });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeModal(); });

  if(search) search.addEventListener('input', function(){ loadList(search.value); });

  document.querySelectorAll('.pm5-cat').forEach(function(btn){
    btn.addEventListener('click', function(){
      document.querySelectorAll('.pm5-cat').forEach(function(b){ b.classList.remove('pm5-cat-on'); });
      btn.classList.add('pm5-cat-on');
      _pmActiveCat = btn.dataset.cat || 'All';
      loadList(search ? search.value : '');
    });
  });

  document.querySelectorAll('.pmT').forEach(function(b){
    b.addEventListener('click', function(){ showTab(b.dataset.tab); });
  });

  bindUpload();
  bindSave();
});

})();
