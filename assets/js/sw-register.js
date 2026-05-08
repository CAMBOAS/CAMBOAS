/* ═══════════════════════════════════════════
   CAMBO MINI — Service Worker Registration
   Include this in every HTML page
   ═══════════════════════════════════════════ */
(function () {
  if (!('serviceWorker' in navigator)) return;

  // Detect root path (index.html vs pages/*.html)
  var isSubPage = window.location.pathname.includes('/pages/');
  var swPath    = isSubPage ? '../service-worker.js' : './service-worker.js';
  var swScope   = isSubPage ? '../' : './';

  navigator.serviceWorker.register(swPath, { scope: swScope })
    .then(function (reg) {
      // Check for updates every 30 minutes
      setInterval(function () { reg.update(); }, 30 * 60 * 1000);

      reg.addEventListener('updatefound', function () {
        var newWorker = reg.installing;
        newWorker.addEventListener('statechange', function () {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateBanner();
          }
        });
      });
    })
    .catch(function (err) {
      console.warn('SW registration failed:', err);
    });

  /* ── Update banner ── */
  function showUpdateBanner() {
    var b = document.createElement('div');
    b.id  = 'sw-update-banner';
    b.style.cssText = [
      'position:fixed;bottom:20px;left:50%;transform:translateX(-50%)',
      'background:#1e293b;color:#f1f5f9;padding:12px 20px;border-radius:12px',
      'font-size:13px;font-family:inherit;z-index:9999',
      'display:flex;align-items:center;gap:12px',
      'border:1px solid rgba(139,92,246,.4);box-shadow:0 8px 32px rgba(0,0,0,.4)'
    ].join(';');
    b.innerHTML =
      '<span>🔄 មានការ Update ថ្មី!</span>' +
      '<button onclick="location.reload()" style="' +
        'background:linear-gradient(135deg,#8b5cf6,#06b6d4);color:#fff;' +
        'border:none;padding:6px 14px;border-radius:8px;cursor:pointer;' +
        'font-weight:700;font-size:12px;font-family:inherit' +
      '">Reload</button>' +
      '<button onclick="this.parentNode.remove()" style="' +
        'background:transparent;color:#94a3b8;border:none;cursor:pointer;font-size:16px' +
      '">✕</button>';
    document.body.appendChild(b);
  }
})();
