/**
 * CAMBO MINI — Central API helper
 * GET  → direct to Apps Script (no CORS issue for GET)
 * POST → /api/proxy (avoids CORS block from Apps Script redirect on POST)
 */

(function () {
  'use strict';

  const APPS_SCRIPT_URL =
    'https://script.google.com/macros/s/AKfycbzHg9xhHS8Jl7N_AhhvJE6CeqcDBDfx034Egfqy0QaAp5VgDFpSybZYxZ5SZipUebCMVw/exec';

  // getBase kept for backward-compat (order-list.js calls it at init time)
  function getBase() { return APPS_SCRIPT_URL; }

  async function get(params) {
    const qs = new URLSearchParams(Object.assign({ _: Date.now() }, params)).toString();
    const res = await fetch(APPS_SCRIPT_URL + '?' + qs, { redirect: 'follow' });
    return res.json();
  }

  async function post(body) {
    if (location.protocol === 'file:') {
      return { ok: false, message: 'ត្រូវ start server មុន:\n① double-click  start-local.bat\n② ឬបើក http://localhost:3001/' };
    }
    const res = await fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      redirect: 'follow',
    });
    return res.json();
  }

  window.CamboAPI = { get, post, getBase, APPS_SCRIPT_URL };
})();

