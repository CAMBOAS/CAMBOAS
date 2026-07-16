/**
 * CAMBO MINI — Central API helper
 * - On Vercel (https): routes through /api/proxy to avoid CORS
 * - On Local (file:// or localhost): calls Apps Script directly
 */

(function () {
  'use strict';

  const APPS_SCRIPT_URL =
    'https://script.google.com/macros/s/AKfycby-ntQjUR10XTeCjLUqif-DEHHHbbg6WJvnUp0nZczL2TXN9e5ad3e2WKysIrdIx3DE/exec';

  // Use Vercel proxy for all production hosts (not localhost / LAN)
  function isVercel() {
    if (typeof location === 'undefined') return false;
    const h = location.hostname;
    if (!h || h === 'localhost' || h === '127.0.0.1') return false;
    if (/^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[01])\./.test(h)) return false;
    return true; // any other hostname → use /api/proxy to avoid CORS
  }

  function getBase() {
    return isVercel() ? '/api/proxy' : APPS_SCRIPT_URL;
  }

  /**
   * GET request — fetch orders / stock etc.
   * Usage: CamboAPI.get({ action: 'list', limit: 1000 })
   */
  async function get(params) {
    const base = getBase();
    const qs = new URLSearchParams(Object.assign({ _: Date.now() }, params)).toString();
    const url = base + (base.includes('?') ? '&' : '?') + qs;
    const res = await fetch(url, { redirect: 'follow' });
    return res.json();
  }

  /**
   * POST request — add / update / delete
   * Usage: CamboAPI.post({ action: 'add', order: {...} })
   */
  async function post(body) {
    const base = getBase();
    const res = await fetch(base, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      redirect: 'follow',
    });
    return res.json();
  }

  window.CamboAPI = { get, post, getBase, APPS_SCRIPT_URL };
})();

