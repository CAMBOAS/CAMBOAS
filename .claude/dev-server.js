/**
 * CAMBO MINI — Local Dev Server
 * Serves static files + proxies /api/proxy → Apps Script (handles CORS + redirect)
 * Usage: node .claude/dev-server.js
 */
const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const url   = require('url');

const PORT           = 3001;
const ROOT           = path.join(__dirname, '..');
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzHg9xhHS8Jl7N_AhhvJE6CeqcDBDfx034Egfqy0QaAp5VgDFpSybZYxZ5SZipUebCMVw/exec';

const MIME = {
  '.html':  'text/html; charset=utf-8',
  '.css':   'text/css',
  '.js':    'application/javascript',
  '.json':  'application/json',
  '.png':   'image/png',
  '.jpg':   'image/jpeg',
  '.jpeg':  'image/jpeg',
  '.gif':   'image/gif',
  '.svg':   'image/svg+xml',
  '.ico':   'image/x-icon',
  '.woff':  'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':   'font/ttf',
};

/* ── /api/proxy handler — uses built-in fetch() so redirect behaviour matches Vercel ── */
function apiProxy(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  const qs = url.parse(req.url).query;

  const doFetch = (body) => {
    const init = req.method === 'GET'
      ? { redirect: 'follow' }
      : { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body, redirect: 'follow' };
    const target = req.method === 'GET'
      ? APPS_SCRIPT_URL + (qs ? '?' + qs : '')
      : APPS_SCRIPT_URL;

    fetch(target, init)
      .then(r => r.text())
      .then(text => {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(text);
      })
      .catch(e => {
        res.writeHead(500);
        res.end(JSON.stringify({ ok: false, message: e.message }));
      });
  };

  if (req.method === 'GET') {
    doFetch(null);
  } else {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => doFetch(body));
  }
}

/* ── Static file server ── */
function serveFile(filePath, res) {
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404); res.end('Not Found'); return; }
    const ext  = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-cache, no-store' });
    fs.createReadStream(filePath).pipe(res);
  });
}

http.createServer((req, res) => {
  const pathname = url.parse(req.url).pathname;

  if (pathname === '/api/proxy') { apiProxy(req, res); return; }

  let fp = path.join(ROOT, pathname === '/' ? 'index.html' : pathname);
  if (!fp.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
  serveFile(fp, res);

}).listen(PORT, () => {
  console.log('\x1b[36m🚀 CAMBO DEV SERVER  http://localhost:' + PORT + '\x1b[0m');
  console.log('\x1b[33m📡 /api/proxy → Apps Script\x1b[0m');
});
