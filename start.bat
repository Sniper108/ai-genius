@echo off
setlocal
title Agent OS Mission Control

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

REM --- Start OmniRoute (free model gateway) in its own window ---
REM Skips gracefully if it isn't installed. Your saved provider/API key is
REM reused, so once it's up the OmniRoute agent works without extra steps.
where omniroute >nul 2>nul
if errorlevel 1 (
  echo   [skip] OmniRoute not installed - install once with: npm install -g omniroute
) else (
  echo   [start] OmniRoute -^> http://localhost:20128 ^(keep its window open^)
  start "OmniRoute" cmd /k omniroute
)

REM --- Start Paperclip (AI company) in its own window ---
REM Runs via npx, so no global install needed. `run` just starts the server
REM (setup/onboarding is already done), so there's no migration y/N prompt to
REM block it. PORT=3100 keeps Paperclip off 3000 (Agent OS's port) so they don't
REM collide, and matches where the Agent OS Paperclip tab looks for it.
echo   [start] Paperclip -^> http://localhost:3100 ^(keep its window open^)
start "Paperclip" cmd /k "set PORT=3100&& npx paperclipai run"

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
echo      Agent OS Mission Control is starting up...
echo.
echo      Your browser will open automatically in a few seconds.
echo      Keep THIS window open while you use the dashboard.
echo      Press Ctrl+C (twice) here to stop the server.
echo   ============================================================
echo.

REM --- Start the dev server (keeps running in this window) ---
call npm run dev

endlocal
