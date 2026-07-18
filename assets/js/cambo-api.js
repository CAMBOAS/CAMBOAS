/**
 * CAMBO MINI — Central API helper
 * GET  → direct to Apps Script (no CORS issue for GET)
 * POST → /api/proxy (avoids CORS block from Apps Script redirect on POST)
 */

(function () {
  'use strict';

  const APPS_SCRIPT_URL =
    'https://script.google.com/macros/s/AKfycbxREsMpQNqHHzwN2K0R4cVrXWzeDrvBUpFSPcV1IMLklB5suDlsK3TlGOA0MaFcVXNA8Q/exec';

  // getBase kept for backward-compat (order-list.js calls it at init time)
  function getBase() { return APPS_SCRIPT_URL; }

  async function get(params) {
    const qs = new URLSearchParams(Object.assign({ _: Date.now() }, params)).toString();
    const res = await fetch(APPS_SCRIPT_URL + '?' + qs, { redirect: 'follow' });
    return res.json();
  }

  async function post(body) {
    // On file:// there is no /api/proxy — post directly to Apps Script
    const url = location.protocol === 'file:' ? APPS_SCRIPT_URL : '/api/proxy';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      redirect: 'follow',
    });
    return res.json();
  }

  window.CamboAPI = { get, post, getBase, APPS_SCRIPT_URL };
})();

