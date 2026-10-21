@echo off
set "DOCRELEASE_EXE=C:\Program Files (x86)\1cv8t\8.3.27.1508\bin\1cv8t.exe"
if not exist "%DOCRELEASE_EXE%" (
  echo Training platform 8.3.27.1508 was not found.
  pause
  exit /b 1
)
if not exist "%~dp0.local\infobase\1Cv8.1CD" (
  echo This copy has no database yet. See docs/deployment/install.md.
  pause
  exit /b 1
)
start "" "%DOCRELEASE_EXE%" ENTERPRISE /F "%~dp0.local\infobase"
