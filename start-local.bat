@echo off
chcp 65001 >nul
title CAMBO Local Dev Server

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║        CAMBO MINI — Local Server         ║
echo  ║   http://localhost:3001                  ║
echo  ╚══════════════════════════════════════════╝
echo.
echo  Starting server...

:: Kill any existing process on port 3001
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001" ^| find "LISTENING"') do (
  taskkill /F /PID %%a >nul 2>&1
)

:: Start dev server in background
start /b node "%~dp0.claude\dev-server.js"

:: Wait 1 second for server to boot
timeout /t 1 /nobreak >nul

echo  Server started! Opening browser...
echo.
echo  Pages:
echo    Loans  : http://localhost:3001/pages/helen-loan.html
echo    Orders : http://localhost:3001/pages/order-list.html
echo.
echo  Press Ctrl+C or close this window to stop the server.
echo.

:: Open Loans page in default browser
start "" "http://localhost:3001/pages/helen-loan.html"

:: Keep window open (keeps server alive)
:loop
timeout /t 60 /nobreak >nul
goto loop
