@echo off
setlocal
title NEXUS Mission Control

REM Always run from the folder this script lives in, no matter where it's launched from.
cd /d "%~dp0"

REM --- Make sure Node.js is available ---
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js is not installed.
  echo   Download it from https://nodejs.org  ^(click the "LTS" button^),
  echo   run the installer, then double-click this file again.
  echo.
  pause
  exit /b 1
)

REM --- First run: install dependencies if they're missing ---
if not exist "node_modules" (
  echo.
  echo   First launch: installing dependencies. This can take a minute...
  echo.
  call npm install
)

REM --- Open the browser automatically once the server is actually ready ---
REM A hidden helper polls http://localhost:3000 and opens the default browser
REM the moment it responds, so you never land on a "connection refused" page.
start "" powershell -NoProfile -WindowStyle Hidden -Command ^
  "for($i=0;$i -lt 90;$i++){ try { if((Invoke-WebRequest -UseBasicParsing 'http://localhost:3000' -TimeoutSec 2).StatusCode -eq 200){ Start-Process 'http://localhost:3000'; break } } catch {} ; Start-Sleep -Seconds 1 }"

echo.
echo   ============================================================
echo      NEXUS Mission Control is starting up...
echo.
echo      Your browser will open automatically in a few seconds.
echo      Keep THIS window open while you use the dashboard.
echo      Press Ctrl+C (twice) here to stop the server.
echo   ============================================================
echo.

REM --- Start the dev server (keeps running in this window) ---
call npm run dev

endlocal
