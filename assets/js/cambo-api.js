/**
 * CAMBO MINI — Central API helper
 * - On Vercel (https): routes through /api/proxy to avoid CORS
 * - On Local (file:// or localhost): calls Apps Script directly
 */

(function () {
  'use strict';

  const APPS_SCRIPT_URL =
    'https://script.google.com/macros/s/AKfycbzefJjsVDLZ7YwtzHxIilWyQ8-j6-7sCieD8CmPqvlKVbazr6Jhi7Zj9sjG-MLaHMkQIA/exec';

  // Use Vercel proxy only when running on vercel.app domain
  function isVercel() {
    return typeof location !== 'undefined' &&
      (location.hostname.endsWith('.vercel.app') ||
       location.hostname === 'vercel.app');
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
