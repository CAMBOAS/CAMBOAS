/**
 * Vercel Serverless Proxy — CAMBO MINI
 * Forwards requests to Google Apps Script to bypass browser CORS restrictions.
 * Browser → Vercel /api/proxy → Apps Script (server-to-server, no CORS issue)
 */

const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxX72HbRHi82ZLTeo_gTfGx-XuzehnGAShk9YUhiWg8hiWSlTDX7NKJOf95swi_nYHn1g/exec';

export default async function handler(req, res) {
  // Allow all origins (CORS headers for browser)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let response;

    if (req.method === 'POST') {
      // Forward POST body to Apps Script
      const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body,
        redirect: 'follow',
      });
    } else {
      // Forward GET query params to Apps Script
      const params = new URLSearchParams(req.query).toString();
      const url = params ? `${APPS_SCRIPT_URL}?${params}` : APPS_SCRIPT_URL;
      response = await fetch(url, { redirect: 'follow' });
    }

    const text = await response.text();

    // Try to parse as JSON, return as-is if not
    try {
      const json = JSON.parse(text);
      return res.status(200).json(json);
    } catch {
      return res.status(200).send(text);
    }
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ ok: false, message: err.message || 'Proxy error' });
  }
}
