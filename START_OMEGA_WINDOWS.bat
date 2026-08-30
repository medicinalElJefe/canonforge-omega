@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if %ERRORLEVEL%==0 (
  py -3 START_OMEGA.py
) else (
  python START_OMEGA.py
)
endlocal
