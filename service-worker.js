/* ═══════════════════════════════════════════════
   CAMBO MINI — Service Worker v1.0
   Cache-first strategy for assets
   Network-first strategy for data (localStorage)
   ═══════════════════════════════════════════════ */

const CACHE_NAME = 'cambo-mini-v26';

const STATIC_ASSETS = [
  /* Pages */
  '/',
  '/index.html',
  '/login.html',
  '/pages/order-list.html',
  '/pages/stock.html',
  '/pages/delivery.html',
  '/pages/customers.html',
  '/pages/analytics.html',
  '/pages/products.html',
  '/pages/packaging.html',
  '/pages/commission.html',
  '/pages/settings.html',
  '/pages/new-order.html',
  '/pages/smart-mobile.html',
  '/pages/orders-details.html',
  '/pages/users.html',
  /* CSS */
  '/assets/css/main.css',
  '/assets/css/templatemo-glass-admin-style.css',
  '/assets/css/order-list.css',
  '/assets/css/orders-details.css',
  '/assets/css/packaging.css',
  /* JS */
  '/assets/js/layout.js',
  '/assets/js/dashboard-layout.js',
  '/assets/js/dashboard-live.js',
  '/assets/js/order-list.js',
  '/assets/js/orders-details.js',
  '/assets/js/orders-data.js',
  '/assets/js/top-customers.js',
  '/assets/js/analytics-live.js',
  '/assets/js/customers-live.js',
  '/assets/js/packaging.js',
  '/assets/js/settings-live.js',
  '/assets/js/share-receipt.js',
  '/assets/js/printer-receipt.js',
  '/assets/js/copy-receipt.js',
  '/assets/js/export-template.js',
  '/assets/js/export-delivery-report.js',
  '/assets/js/export-daily-clearance-template.js',
  '/assets/js/product-manager.js',
  '/assets/js/order-plust.js',
  '/assets/js/province-sales.js',
  '/assets/js/phone-carrier.js',
  '/assets/js/searchable-combo.js',
  '/assets/js/pdf-export.js',
  '/assets/js/vendor/chart-lite.js',
  '/assets/js/vendor/html2canvas-lite.js',
];

/* ── Install: cache all static assets ── */
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

/* ── Activate: remove old caches ── */
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* ── Fetch: Cache-first for assets, network-first for navigation ── */
self.addEventListener('fetch', function(e) {
  var req = e.request;
  var url = new URL(req.url);

  // Skip non-GET & external requests
  if (req.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // HTML pages → Network first, fallback to cache (get latest, but still work offline)
  if (req.destination === 'document' || url.pathname.endsWith('.html') || url.pathname === '/') {
    e.respondWith(
      fetch(req).then(function(res) {
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(req, clone); });
        return res;
      }).catch(function() {
        return caches.match(req).then(function(cached) {
          return cached || caches.match('/index.html');
        });
      })
    );
    return;
  }

  // CSS/JS/Images → Cache first, network fallback (fast!)
  e.respondWith(
    caches.match(req).then(function(cached) {
      if (cached) return cached;
      return fetch(req).then(function(res) {
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(req, clone); });
        return res;
      });
    })
  );
});

/* ── Message: force cache refresh ── */
self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (e.data && e.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(function() {
      e.ports[0].postMessage({ done: true });
    });
  }
});
