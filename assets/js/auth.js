/**
 * CAMBO MINI — Auth Guard
 * Session key: cambo_session
 * Login required flag: cambo_login_required
 * Credentials: cambo_admin_account / cambo_admin_password
 */
(function () {
  var SESSION_KEY = 'cambo_session';
  var REQ_KEY     = 'cambo_login_required';
  var ACC_KEY     = 'cambo_admin_account';
  var PASS_KEY    = 'cambo_admin_password';

  function isLoginRequired() {
    var val = localStorage.getItem(REQ_KEY);
    if (val === null) return true; // secure default: locked on new browser
    return val === 'true';
  }

  function isLoggedIn() {
    return sessionStorage.getItem(SESSION_KEY) === '1' ||
           localStorage.getItem(SESSION_KEY) === '1';
  }

  function setLoggedIn(remember) {
    if (remember) localStorage.setItem(SESSION_KEY, '1');
    else sessionStorage.setItem(SESSION_KEY, '1');
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  }

  function getCredentials() {
    return {
      account:  localStorage.getItem(ACC_KEY)  || '',
      password: localStorage.getItem(PASS_KEY) || ''
    };
  }

  function saveCredentials(account, password) {
    localStorage.setItem(ACC_KEY, account);
    localStorage.setItem(PASS_KEY, password);
  }

  function setLoginRequired(val) {
    localStorage.setItem(REQ_KEY, val ? 'true' : 'false');
  }

  // Detect device brand + model from userAgent
  function getDeviceInfo() {
    var ua = navigator.userAgent || '';
    var brand = 'Unknown', model = 'Unknown';

    // ── iPhone: screen size + iOS version → model name ──
    if (/iPhone/i.test(ua)) {
      brand = 'Apple';
      var iosM = ua.match(/iPhone OS (\d+)_/i);
      var ios  = iosM ? parseInt(iosM[1]) : 0;
      var W = screen.width, H = screen.height;
      var lg = Math.max(W,H), sm2 = Math.min(W,H);
      if      (lg===667  && sm2===375) model = ios>=13 ? 'iPhone SE (2020/2022)' : 'iPhone 6/7/8';
      else if (lg===736  && sm2===414) model = 'iPhone 6+/7+/8+';
      else if (lg===812  && sm2===375) model = ios>=15 ? 'iPhone 13 mini'       : ios>=14 ? 'iPhone 12 mini' : 'iPhone X/XS/11 Pro';
      else if (lg===896  && sm2===414) model = ios>=14 ? 'iPhone 11/XR'         : 'iPhone XS Max/11 Pro Max';
      else if (lg===844  && sm2===390) model = ios>=16 ? 'iPhone 14'            : 'iPhone 12/13';
      else if (lg===926  && sm2===428) model = ios>=16 ? 'iPhone 14 Plus'       : 'iPhone 12/13 Pro Max';
      else if (lg===852  && sm2===393) model = ios>=17 ? 'iPhone 15/15 Pro'     : 'iPhone 14 Pro';
      else if (lg===932  && sm2===430) model = ios>=17 ? 'iPhone 15 Plus/Pro Max' : 'iPhone 14 Pro Max';
      else model = 'iPhone (iOS ' + (ios||'?') + ')';
    }

    // ── iPad ──
    else if (/iPad/i.test(ua)) { brand = 'Apple'; model = 'iPad'; }
    else if (/iPod/i.test(ua)) { brand = 'Apple'; model = 'iPod touch'; }
    else if (/Macintosh|Mac OS X/i.test(ua) && !/Android/i.test(ua)) { brand = 'Apple'; model = 'Mac'; }

    // ── Samsung: SM-code lookup table ──
    else if (/Samsung|SM-[A-Z0-9]+/i.test(ua)) {
      brand = 'Samsung';
      var smM = ua.match(/SM-([A-Z0-9]+)/i);
      if (smM) {
        var code = smM[1].toUpperCase();
        var tbl = {
          // S24 series
          'S928':'Galaxy S24 Ultra','S926':'Galaxy S24+','S921':'Galaxy S24',
          // S23 series
          'S918':'Galaxy S23 Ultra','S916':'Galaxy S23+','S911':'Galaxy S23',
          // S22 series
          'S908':'Galaxy S22 Ultra','S906':'Galaxy S22+','S901':'Galaxy S22',
          // S21 series
          'G998':'Galaxy S21 Ultra','G996':'Galaxy S21+','G991':'Galaxy S21',
          // S20 series
          'G988':'Galaxy S20 Ultra','G986':'Galaxy S20+','G981':'Galaxy S20',
          // Z Fold
          'F946':'Galaxy Z Fold 5','F936':'Galaxy Z Fold 4','F926':'Galaxy Z Fold 3','F916':'Galaxy Z Fold 2',
          // Z Flip
          'F731':'Galaxy Z Flip 5','F721':'Galaxy Z Flip 4','F711':'Galaxy Z Flip 3','F707':'Galaxy Z Flip 2',
          // A5x
          'A546':'Galaxy A54','A536':'Galaxy A53','A525':'Galaxy A52','A526':'Galaxy A52 5G',
          // A3x
          'A346':'Galaxy A34','A336':'Galaxy A33','A325':'Galaxy A32',
          // A2x
          'A235':'Galaxy A23','A225':'Galaxy A22','A215':'Galaxy A21s',
          // A1x
          'A135':'Galaxy A13','A125':'Galaxy A12','A127':'Galaxy A12',
          // A0x
          'A042':'Galaxy A04','A032':'Galaxy A03','A022':'Galaxy A02',
          // Note
          'N986':'Galaxy Note 20 Ultra','N981':'Galaxy Note 20',
          'N976':'Galaxy Note 10+','N970':'Galaxy Note 10',
        };
        var found = '';
        for (var k in tbl) { if (code.indexOf(k)===0){ found=tbl[k]; break; } }
        model = found || 'Galaxy SM-' + code;
      } else { model = 'Samsung Galaxy'; }
    }

    // ── Xiaomi / Redmi / POCO ──
    else if (/Xiaomi|Redmi|POCO/i.test(ua)) {
      brand = 'Xiaomi';
      var xmM = ua.match(/;\s*((?:Redmi|POCO|Mi|Xiaomi)\s[^;)]+?)\s*(?:Build|MIUI|\))/i);
      model = xmM ? xmM[1].trim() : 'Xiaomi';
    }

    // ── OPPO ──
    else if (/OPPO|CPH\d+/i.test(ua)) {
      brand = 'OPPO';
      var opM = ua.match(/;\s*([^;)]*?(?:CPH\d+|OPPO\s[\w]+)[^;)]*?)\s*(?:Build|\))/i);
      model = opM ? opM[1].trim() : 'OPPO';
    }

    // ── Realme ──
    else if (/Realme|RMX\d+/i.test(ua)) {
      brand = 'Realme';
      var rmM = ua.match(/;\s*((?:Realme|RMX)[^;)]+?)\s*(?:Build|\))/i);
      model = rmM ? rmM[1].trim() : 'Realme';
    }

    // ── Vivo ──
    else if (/vivo/i.test(ua)) {
      brand = 'Vivo';
      var viM = ua.match(/;\s*(vivo\s[^;)]+?)\s*(?:Build|\))/i);
      model = viM ? viM[1].trim() : 'Vivo';
    }

    // ── Huawei ──
    else if (/Huawei|HUAWEI/i.test(ua)) {
      brand = 'Huawei';
      var hwM = ua.match(/;\s*([^;)]+?)\s*(?:Build|\))/i);
      model = hwM ? hwM[1].trim() : 'Huawei';
    }

    // ── Generic Android: parse model from UA ──
    else if (/Android/i.test(ua)) {
      brand = 'Android';
      var amM = ua.match(/;\s*([^;)]+?)\s*(?:Build|MIUI)\//i);
      model = amM ? amM[1].trim() : 'Android Device';
    }

    // ── Desktop ──
    else if (/Windows NT/i.test(ua)) {
      brand = 'Windows';
      var wvM = ua.match(/Windows NT ([\d.]+)/);
      model = wvM ? (parseFloat(wvM[1])>=10 ? 'Windows 10/11' : 'Windows') : 'PC';
    }
    else if (/CrOS/i.test(ua))  { brand = 'ChromeOS'; model = 'Chromebook'; }
    else if (/Linux/i.test(ua)) { brand = 'Linux';    model = 'Desktop'; }
    else if (/Mac/i.test(ua))   { brand = 'Apple';    model = 'Mac'; }

    return { brand: brand, model: model };
  }

  // After login success — log device + IP + precise location to Sheet, returns Promise
  function logDevice(account) {
    if (!window.CamboAPI) return Promise.resolve();
    try {
      var info = getDeviceInfo();

      function sendLog(ip, loc) {
        return window.CamboAPI.get({
          action: 'log_login', account: account,
          device: info.brand,  model:   info.model,
          ip: ip || '',        location: loc || ''
        }).catch(function () { return null; });
      }

      // Format IP with zero-padded octets: 192.168.1.5 → 192.168.001.005
      function fmtIP(raw) {
        if (!raw) return '';
        return raw.split('.').map(function(o){ return o.padStart(3,'0'); }).join('.');
      }

      // Get IP address from API with fallback
      function getIP() {
        return fetch('https://ipapi.co/json/')
          .then(function (r) { return r.json(); })
          .then(function (g) { return { ip: fmtIP(g.ip), city: g.city, region: g.region, country: g.country_name }; })
          .catch(function () {
            return fetch('https://ipwhois.app/json/')
              .then(function (r) { return r.json(); })
              .then(function (g) { return { ip: fmtIP(g.ip), city: g.city, region: g.region, country: g.country }; })
              .catch(function () { return { ip: '', city: '', region: '', country: '' }; });
          });
      }

      // Reverse geocode lat/lon → detailed address via Nominatim
      function reverseGeocode(lat, lon) {
        return fetch('https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lon + '&format=json&zoom=14&addressdetails=1')
          .then(function (r) { return r.json(); })
          .then(function (d) {
            var a = d.address || {};
            return [
              a.village || a.suburb || a.neighbourhood || a.quarter || a.hamlet,
              a.city_district || a.district,
              a.city || a.town || a.county || a.municipality,
              a.state || a.province,
              a.country
            ].filter(Boolean).join(', ');
          })
          .catch(function () { return ''; });
      }

      return new Promise(function (resolve) {
        // Try GPS first → precise location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            function (pos) {
              var lat = pos.coords.latitude;
              var lon = pos.coords.longitude;
              Promise.all([getIP(), reverseGeocode(lat, lon)])
                .then(function (res) {
                  var ipData = res[0];
                  var gpsLoc = res[1];
                  var loc = gpsLoc || [ipData.city, ipData.region, ipData.country].filter(Boolean).join(', ');
                  resolve(sendLog(ipData.ip, loc));
                });
            },
            function () {
              // GPS denied → fall back to IP-based location
              getIP().then(function (d) {
                var loc = [d.city, d.region, d.country].filter(Boolean).join(', ');
                resolve(sendLog(d.ip, loc));
              });
            },
            { timeout: 6000, maximumAge: 300000 }
          );
        } else {
          getIP().then(function (d) {
            var loc = [d.city, d.region, d.country].filter(Boolean).join(', ');
            resolve(sendLog(d.ip, loc));
          });
        }
      });
    } catch (e) { return Promise.resolve(); }
  }

  function verify(account, password) {
    // Always verify against Apps Script (Sheet is source of truth)
    // Fall back to localStorage only if network fails
    if (window.CamboAPI) {
      return window.CamboAPI.get({ action: 'verify_login', account: account, password: password })
        .then(function (r) { return !!(r && r.success); })
        .catch(function () {
          // Network failed — fall back to local credentials
          var creds = getCredentials();
          if (!creds.account && !creds.password) return false;
          return creds.account === account && creds.password === password;
        });
    }
    // No CamboAPI — local only
    var creds = getCredentials();
    if (!creds.account && !creds.password) return Promise.resolve(false);
    return Promise.resolve(creds.account === account && creds.password === password);
  }

  function authGuard() {
    if (!isLoginRequired()) return; // OFF = free access
    if (isLoggedIn()) return;
    var inPages = location.pathname.indexOf('/pages/') !== -1;
    location.replace(inPages ? '../login.html' : 'login.html');
  }

  // Cross-browser sync — fetch login_required from Sheet every 3 min
  window.addEventListener('load', function () {
    if (!window.CamboAPI) return;
    var SYNC_KEY = 'cambo_settings_sync';
    var TTL = 3 * 60 * 1000;
    var lastSync = parseInt(localStorage.getItem(SYNC_KEY) || '0');
    if (Date.now() - lastSync < TTL) return;
    localStorage.setItem(SYNC_KEY, String(Date.now()));
    window.CamboAPI.get({ action: 'get_settings' })
      .then(function (r) {
        if (r && r.success && r.data && r.data.login_required !== undefined) {
          var req = r.data.login_required === 'true';
          localStorage.setItem(REQ_KEY, req ? 'true' : 'false');
          if (req && !isLoggedIn()) {
            var inPages = location.pathname.indexOf('/pages/') !== -1;
            location.replace(inPages ? '../login.html' : 'login.html');
          }
        }
      }).catch(function () {});
  });

  window.CamboAuth = {
    isLoginRequired:  isLoginRequired,
    isLoggedIn:       isLoggedIn,
    setLoggedIn:      setLoggedIn,
    logout:           logout,
    verify:           verify,
    getCredentials:   getCredentials,
    saveCredentials:  saveCredentials,
    setLoginRequired: setLoginRequired,
    getDeviceInfo:    getDeviceInfo,
    logDevice:        logDevice,
    authGuard:        authGuard,
    SESSION_KEY:      SESSION_KEY,
    REQ_KEY:          REQ_KEY
  };
})();
