@echo off
setlocal EnableExtensions
chcp 65001 >nul

rem R220 is retained as a compatibility name only. All ownership, enrollment,
rem heartbeat, local authority and development dispatch now enter through the
rem stable sovereign gateway so this historical file cannot create a parallel
rem runtime or sovereign agent.
set "OMEGA_ROOT_OVERRIDE=%~dp0.."
call "%~dp0START_OMEGA_SOVEREIGN.cmd" %*
exit /b %ERRORLEVEL%
