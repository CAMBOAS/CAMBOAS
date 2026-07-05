/**
 * CAMBO MINI — Auth Guard
 * Session key: cambo_session
 * Login required flag: cambo_login_required
 * Credentials: cambo_admin_account / cambo_admin_password
 */
(function () {
  var SESSION_KEY  = 'cambo_session';
  var REQ_KEY      = 'cambo_login_required';
  var ACC_KEY      = 'cambo_admin_account';
  var PASS_KEY     = 'cambo_admin_password';

  function isLoginRequired() {
    return localStorage.getItem(REQ_KEY) === 'true';
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

  function verify(account, password) {
    var creds = getCredentials();
    if (!creds.account && !creds.password) {
      // No credentials saved yet — try Apps Script verify_login
      return window.CamboAPI
        ? window.CamboAPI.get({ action: 'verify_login', account: account, password: password })
            .then(function (r) { return !!(r && r.success); })
            .catch(function () { return false; })
        : Promise.resolve(false);
    }
    var ok = creds.account === account && creds.password === password;
    return Promise.resolve(ok);
  }

  function authGuard() {
    if (!isLoginRequired()) return;
    if (isLoggedIn()) return;
    var inPages = location.pathname.indexOf('/pages/') !== -1;
    location.replace(inPages ? '../login.html' : 'login.html');
  }

  window.CamboAuth = {
    isLoginRequired: isLoginRequired,
    isLoggedIn: isLoggedIn,
    setLoggedIn: setLoggedIn,
    logout: logout,
    verify: verify,
    getCredentials: getCredentials,
    saveCredentials: saveCredentials,
    setLoginRequired: setLoginRequired,
    SESSION_KEY: SESSION_KEY,
    REQ_KEY: REQ_KEY
  };
})();
