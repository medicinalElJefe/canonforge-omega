@echo off
setlocal EnableExtensions
chcp 65001 >nul
set "OMEGA_ROOT_OVERRIDE=%~dp0.."
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0START_OMEGA_R222_FULL_HYBRID.ps1"
exit /b %ERRORLEVEL%
