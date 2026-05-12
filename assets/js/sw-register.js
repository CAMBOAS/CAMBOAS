/* ═══════════════════════════════════════════
   CAMBO MINI — Service Worker Registration
   Include this in every HTML page
   ═══════════════════════════════════════════ */
(function () {
  if (!('serviceWorker' in navigator)) return;

  var isSubPage = window.location.pathname.includes('/pages/');
  var swPath    = isSubPage ? '../service-worker.js' : './service-worker.js';
  var swScope   = isSubPage ? '../' : './';

  navigator.serviceWorker.register(swPath, { scope: swScope })
    .then(function (reg) {
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

  /* ── Beautiful Update Toast ── */
  function showUpdateBanner() {
    if (document.getElementById('sw-update-banner')) return;

    /* Inject keyframes + styles once */
    if (!document.getElementById('sw-update-style')) {
      var s = document.createElement('style');
      s.id  = 'sw-update-style';
      s.textContent = [
        '@keyframes sw-up{from{transform:translateX(-50%) translateY(110%);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}',
        '@keyframes sw-shine{0%,100%{background-position:200% center}50%{background-position:0% center}}',
        '@keyframes sw-badge-pop{0%{transform:scale(0) rotate(-20deg)}60%{transform:scale(1.2) rotate(4deg)}100%{transform:scale(1) rotate(0deg)}}',

        '#sw-update-banner{',
          'position:fixed;bottom:24px;left:50%;',
          'transform:translateX(-50%);',
          'z-index:199999;',
          'width:calc(100vw - 32px);max-width:360px;',
          'animation:sw-up .46s cubic-bezier(.32,.72,0,1) both;',
          'font-family:inherit;',
        '}',

        '#sw-update-banner .sw-card{',
          'border-radius:22px;overflow:hidden;',
          'background:#15112b;',
          'border:1.5px solid rgba(139,92,246,.45);',
          'box-shadow:0 12px 48px rgba(0,0,0,.45), 0 0 0 0 rgba(139,92,246,.0);',
        '}',
        '[data-theme="light"] #sw-update-banner .sw-card{',
          'background:#fff;',
          'border-color:rgba(139,92,246,.3);',
          'box-shadow:0 12px 48px rgba(0,0,0,.14);',
        '}',

        /* Gradient top strip */
        '#sw-update-banner .sw-strip{',
          'height:3px;',
          'background:linear-gradient(90deg,#8b5cf6,#06b6d4,#8b5cf6);',
          'background-size:200% auto;',
          'animation:sw-shine 3s linear infinite;',
        '}',

        '#sw-update-banner .sw-body{',
          'padding:16px 18px 18px;',
          'display:flex;align-items:flex-start;gap:13px;',
        '}',

        /* Icon badge */
        '#sw-update-banner .sw-icon{',
          'width:44px;height:44px;border-radius:14px;flex-shrink:0;',
          'background:linear-gradient(135deg,#8b5cf6,#06b6d4);',
          'display:flex;align-items:center;justify-content:center;',
          'font-size:22px;line-height:1;',
          'animation:sw-badge-pop .55s cubic-bezier(.32,.72,0,1) .2s both;',
          'box-shadow:0 4px 16px rgba(139,92,246,.45);',
        '}',

        '#sw-update-banner .sw-text{flex:1;min-width:0}',
        '#sw-update-banner .sw-title{',
          'font-size:14px;font-weight:800;color:#e8e0ff;',
          'margin:0 0 3px;line-height:1.3;',
        '}',
        '[data-theme="light"] #sw-update-banner .sw-title{color:#18213a}',
        '#sw-update-banner .sw-sub{',
          'font-size:11.5px;color:rgba(160,140,220,.7);',
          'margin:0;line-height:1.4;',
        '}',
        '[data-theme="light"] #sw-update-banner .sw-sub{color:#6b7898}',

        /* Close button */
        '#sw-update-banner .sw-close{',
          'width:28px;height:28px;border-radius:50%;border:none;',
          'background:rgba(255,255,255,.07);color:rgba(160,140,220,.6);',
          'cursor:pointer;font-size:13px;flex-shrink:0;',
          'display:flex;align-items:center;justify-content:center;',
          'transition:background .15s;',
        '}',
        '#sw-update-banner .sw-close:hover{background:rgba(255,255,255,.14)}',
        '[data-theme="light"] #sw-update-banner .sw-close{background:rgba(0,0,0,.06);color:#9aa3bf}',

        /* Actions */
        '#sw-update-banner .sw-actions{',
          'padding:0 18px 16px;display:flex;gap:8px;',
        '}',
        '#sw-update-banner .sw-btn-reload{',
          'flex:1;height:40px;border:none;border-radius:12px;',
          'background:linear-gradient(135deg,#8b5cf6,#06b6d4);',
          'color:#fff;font-size:13px;font-weight:800;font-family:inherit;',
          'cursor:pointer;letter-spacing:.02em;',
          'transition:opacity .15s,transform .1s;',
          'display:flex;align-items:center;justify-content:center;gap:6px;',
        '}',
        '#sw-update-banner .sw-btn-reload:active{opacity:.82;transform:scale(.97)}',
        '#sw-update-banner .sw-btn-later{',
          'height:40px;padding:0 16px;border-radius:12px;',
          'border:1.5px solid rgba(139,92,246,.3);',
          'background:transparent;color:rgba(139,92,246,.8);',
          'font-size:12px;font-weight:700;font-family:inherit;cursor:pointer;',
          'transition:background .15s;white-space:nowrap;',
        '}',
        '#sw-update-banner .sw-btn-later:hover{background:rgba(139,92,246,.08)}',
        '[data-theme="light"] #sw-update-banner .sw-btn-later{color:#7c5cff;border-color:rgba(124,92,255,.3)}',
      ].join('');
      document.head.appendChild(s);
    }

    var b = document.createElement('div');
    b.id  = 'sw-update-banner';
    b.innerHTML =
      '<div class="sw-card">' +
        '<div class="sw-strip"></div>' +
        '<div class="sw-body">' +
          '<div class="sw-icon">🚀</div>' +
          '<div class="sw-text">' +
            '<p class="sw-title">មានការ Update ថ្មី!</p>' +
            '<p class="sw-sub">Version ថ្មីបានត្រៀមរួចរាល់ — Reload ដើម្បីប្រើ</p>' +
          '</div>' +
          '<button class="sw-close" id="swCloseBtnX" title="បិទ">✕</button>' +
        '</div>' +
        '<div class="sw-actions">' +
          '<button class="sw-btn-reload" id="swReloadBtn">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
              '<polyline points="23 4 23 10 17 10"/>' +
              '<path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>' +
            '</svg>' +
            'Reload ឥឡូវ' +
          '</button>' +
          '<button class="sw-btn-later" id="swLaterBtn">ពេលក្រោយ</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(b);

    document.getElementById('swReloadBtn').addEventListener('click', function () {
      location.reload();
    });
    document.getElementById('swLaterBtn').addEventListener('click', function () {
      b.style.transition = 'opacity .3s, transform .3s';
      b.style.opacity    = '0';
      b.style.transform  = 'translateX(-50%) translateY(20px)';
      setTimeout(function () { b.remove(); }, 320);
    });
    document.getElementById('swCloseBtnX').addEventListener('click', function () {
      b.style.transition = 'opacity .3s, transform .3s';
      b.style.opacity    = '0';
      b.style.transform  = 'translateX(-50%) translateY(20px)';
      setTimeout(function () { b.remove(); }, 320);
    });
  }
})();
