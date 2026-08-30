@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\INSTALL_OMEGA_V6_WINDOWS.ps1"
if errorlevel 1 (
  echo.
  echo OMEGA V6 installation failed. Review logs\install_omega_v6.log
  pause
  exit /b 1
)
echo OMEGA V6 installation complete.
pause
