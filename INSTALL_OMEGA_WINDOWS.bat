@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0INSTALL_OMEGA_WINDOWS.ps1"
if errorlevel 1 (
  echo.
  echo OMEGA Genesis setup failed. Review the error above.
  pause
)
endlocal
