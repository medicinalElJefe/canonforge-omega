@echo off
setlocal EnableExtensions
chcp 65001 >nul
set "OMEGA_ROOT_OVERRIDE=%~dp0.."
call "%~dp0START_OMEGA_SOVEREIGN.cmd" %*
exit /b %ERRORLEVEL%
