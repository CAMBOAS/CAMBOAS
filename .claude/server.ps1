# CAMBO MINI — Static file server (PowerShell + .NET HttpListener)
# Usage: powershell -ExecutionPolicy Bypass -File .claude/server.ps1

param([int]$Port = 3000)

# Project root = parent of this script's folder (.claude/)
$scriptDir = if ($MyInvocation.MyCommand.Path) {
  Split-Path $MyInvocation.MyCommand.Path -Parent
} else {
  "D:\07 Code\01 Project CAMBO\CAMBO\.claude"
}
$root = Split-Path $scriptDir -Parent

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.gif'  = 'image/gif'
  '.svg'  = 'image/svg+xml'
  '.ico'  = 'image/x-icon'
  '.webp' = 'image/webp'
  '.woff' = 'font/woff'
  '.woff2'= 'font/woff2'
  '.ttf'  = 'font/ttf'
  '.mp4'  = 'video/mp4'
  '.webm' = 'video/webm'
  '.txt'  = 'text/plain'
  '.pdf'  = 'application/pdf'
}

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()

Write-Host "CAMBO MINI dev server running at http://localhost:$Port"
Write-Host "Serving: $root"
Write-Host "Press Ctrl+C to stop.`n"

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response

    $urlPath = $req.Url.LocalPath.TrimStart('/')
    if ($urlPath -eq '') { $urlPath = 'index.html' }

    $filePath = Join-Path $root ($urlPath -replace '/', '\')

    # Directory → try index.html inside it
    if (Test-Path $filePath -PathType Container) {
      $filePath = Join-Path $filePath 'index.html'
    }

    $res.SendChunked = $false
    if (Test-Path $filePath -PathType Leaf) {
      $ext  = [System.IO.Path]::GetExtension($filePath).ToLower()
      $type = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
      $bytes = [System.IO.File]::ReadAllBytes($filePath)

      $res.StatusCode      = 200
      $res.ContentType     = $type
      $res.ContentLength64 = $bytes.LongLength
      try { $res.OutputStream.Write($bytes, 0, $bytes.Length) } catch {}
      Write-Host "  200  $($req.Url.PathAndQuery)"
    } else {
      $body  = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $urlPath")
      $res.StatusCode      = 404
      $res.ContentType     = 'text/plain'
      $res.ContentLength64 = $body.LongLength
      try { $res.OutputStream.Write($body, 0, $body.Length) } catch {}
      Write-Host "  404  $($req.Url.PathAndQuery)"
    }

    try { $res.OutputStream.Flush() } catch {}
    try { $res.Close() } catch {}
  }
} finally {
  $listener.Stop()
}
