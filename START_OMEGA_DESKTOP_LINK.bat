@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0START_OMEGA_DESKTOP_LINK.ps1" %*
if errorlevel 1 (
  echo.
  echo OMEGA Desktop Link stopped with an error.
  pause
)
endlocal
