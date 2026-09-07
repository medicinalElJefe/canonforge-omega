@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\RECOVER_OMEGA_V6_WINDOWS.ps1"
if errorlevel 1 (
  echo.
  echo OMEGA V6 recovery stopped safely. No reset, rebase, force, or automatic stash was performed.
  echo Review %%LOCALAPPDATA%%\OMEGA\receipts\r209_host_recovery_latest.json
  pause
  exit /b 1
)
echo.
echo OMEGA V6 recovery reached exact canonical and handed off to verified install/launch.
pause
