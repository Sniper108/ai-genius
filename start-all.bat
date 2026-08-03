@echo off
setlocal
title NEXUS — Launch Everything
cd /d "%~dp0"

REM --- Node check ---
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js is not installed. Get it from https://nodejs.org (LTS), then run this again.
  echo.
  pause
  exit /b 1
)

echo.
echo   ============================================================
echo      Launching your whole stack:
echo        - OmniRoute  (free model gateway)  -> localhost:20128
echo        - Paperclip  (AI company)          -> localhost:3100
echo        - NEXUS      (this dashboard)       -> localhost:3000
echo.
echo      Each opens in its own window. Keep them all open.
echo      Hermes and OpenClaw don't need a window - NEXUS runs
echo      them on demand.
echo   ============================================================
echo.

REM --- Start OmniRoute in its own window (skip if not installed) ---
where omniroute >nul 2>nul
if errorlevel 1 (
  echo   [skip] omniroute not installed - install with: npm install -g omniroute
) else (
  echo   [start] OmniRoute...
  start "OmniRoute" cmd /k omniroute
)

REM --- Start Paperclip in its own window ---
echo   [start] Paperclip...
start "Paperclip" cmd /k npx paperclipai onboard --yes

REM --- First run: install NEXUS deps ---
if not exist "node_modules" (
  echo   [setup] Installing NEXUS dependencies (first run only)...
  call npm install
)

REM --- Open the browser once NEXUS is ready ---
start "" powershell -NoProfile -WindowStyle Hidden -Command ^
  "for($i=0;$i -lt 90;$i++){ try { if((Invoke-WebRequest -UseBasicParsing 'http://localhost:3000' -TimeoutSec 2).StatusCode -eq 200){ Start-Process 'http://localhost:3000'; break } } catch {} ; Start-Sleep -Seconds 1 }"

echo.
echo   Starting NEXUS in this window. Keep it open. Ctrl+C to stop NEXUS.
echo.

REM --- NEXUS runs in THIS window ---
call npm run dev

endlocal
