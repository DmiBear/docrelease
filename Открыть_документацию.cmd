@echo off
cd /d "%~dp0"
where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 22 or newer, then run this file again.
  pause
  exit /b 1
)
if not exist node_modules\vitepress\package.json (
  call npm.cmd ci --ignore-scripts
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
echo Open the local URL printed below. Press Ctrl+C to stop.
call npm.cmd run docs:dev
if errorlevel 1 pause
