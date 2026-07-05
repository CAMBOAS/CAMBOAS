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

    if (/iPhone/i.test(ua))       { brand = 'Apple';   model = 'iPhone'; }
    else if (/iPad/i.test(ua))    { brand = 'Apple';   model = 'iPad'; }
    else if (/iPod/i.test(ua))    { brand = 'Apple';   model = 'iPod'; }
    else if (/Macintosh|Mac OS X/i.test(ua) && !/Android/i.test(ua)) {
      brand = 'Apple'; model = 'Mac';
    }
    else if (/Samsung|SM-[A-Z0-9]+/i.test(ua)) {
      brand = 'Samsung';
      var sm = ua.match(/SM-([A-Z0-9]+)/i);
      model = sm ? 'SM-' + sm[1] : 'Galaxy';
    }
    else if (/Xiaomi|Redmi|POCO/i.test(ua)) {
      brand = 'Xiaomi';
      var xm = ua.match(/(Redmi\s[\w\s]+?Build|POCO\s[\w]+|Mi\s[\w]+)/i);
      model = xm ? xm[0].replace(/Build.*/i,'').trim() : 'Xiaomi';
    }
    else if (/OPPO|CPH\d+/i.test(ua)) {
      brand = 'OPPO';
      var op = ua.match(/CPH\d+/i);
      model = op ? op[0] : 'OPPO';
    }
    else if (/Realme|RMX\d+/i.test(ua)) {
      brand = 'Realme';
      var rm = ua.match(/RMX\d+/i);
      model = rm ? rm[0] : 'Realme';
    }
    else if (/vivo/i.test(ua)) {
      brand = 'Vivo';
      var vi = ua.match(/vivo\s*([\w]+)/i);
      model = vi ? 'Vivo ' + vi[1] : 'Vivo';
    }
    else if (/Huawei|HUAWEI/i.test(ua)) {
      brand = 'Huawei';
      var hw = ua.match(/(?:HMA|ELE|CLT|ANA|NOH|NEN|MED|JSN|COR|EBG|TAS|AGS|BAH|JDN)-[A-Z0-9]+/i);
      model = hw ? hw[0] : 'Huawei';
    }
    else if (/Android/i.test(ua)) {
      brand = 'Android';
      var am = ua.match(/;\s*([^;)]+?)\s*(?:Build|MIUI)/i);
      model = am ? am[1].trim() : 'Android';
    }
    else if (/Windows NT/i.test(ua)) {
      brand = 'Windows';
      var wv = ua.match(/Windows NT ([\d.]+)/);
      model = wv ? (parseFloat(wv[1]) >= 10 ? 'Windows 10/11' : 'Windows') : 'PC';
    }
    else if (/Linux/i.test(ua)) { brand = 'Linux'; model = 'Desktop'; }
    else if (/CrOS/i.test(ua))  { brand = 'ChromeOS'; model = 'Chromebook'; }

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

      // Get IP address from API with fallback
      function getIP() {
        return fetch('https://ipapi.co/json/')
          .then(function (r) { return r.json(); })
          .then(function (g) { var raw = g.ip || ''; return { ip: raw ? 'IPv4 (' + raw + ')' : '', city: g.city, region: g.region, country: g.country_name }; })
          .catch(function () {
            return fetch('https://ipwhois.app/json/')
              .then(function (r) { return r.json(); })
              .then(function (g) { var raw = g.ip || ''; return { ip: raw ? 'IPv4 (' + raw + ')' : '', city: g.city, region: g.region, country: g.country }; })
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
