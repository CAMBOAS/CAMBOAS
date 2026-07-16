/**
 * CAMBO MINI — Central API helper
 * GET  → direct to Apps Script (no CORS issue for GET)
 * POST → /api/proxy (avoids CORS block from Apps Script redirect on POST)
 */

(function () {
  'use strict';

  const APPS_SCRIPT_URL =
    'https://script.google.com/macros/s/AKfycbzHg9xhHS8Jl7N_AhhvJE6CeqcDBDfx034Egfqy0QaAp5VgDFpSybZYxZ5SZipUebCMVw/exec';

  /**
   * GET request — fetch orders / stock etc.
   * Goes direct to Apps Script; GET responses include CORS headers so no proxy needed.
   */
  async function get(params) {
    const qs = new URLSearchParams(Object.assign({ _: Date.now() }, params)).toString();
    const res = await fetch(APPS_SCRIPT_URL + '?' + qs, { redirect: 'follow' });
    return res.json();
  }

  /**
   * POST request — add / update / delete
   * Must go through /api/proxy because Apps Script POST redirects are CORS-blocked.
   */
  async function post(body) {
    const res = await fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      redirect: 'follow',
    });
    return res.json();
  }

  window.CamboAPI = { get, post, APPS_SCRIPT_URL };
})();

