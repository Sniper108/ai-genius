@echo off
setlocal
title NEXUS - Get Latest Updates
cd /d "%~dp0"

echo.
echo   ============================================================
echo      Pulling the latest NEXUS updates...
echo   ============================================================
echo.

git pull origin claude/ai-mission-control-dashboard-d5h9xf

echo.
if errorlevel 1 (
  echo   Something went wrong pulling updates. Scroll up to see why.
) else (
  echo   Up to date. You can close this window and launch NEXUS.
)
echo.
pause
endlocal
