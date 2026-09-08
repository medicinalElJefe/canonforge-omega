@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul

if defined OMEGA_SERVER_OVERRIDE (
  set "OMEGA_SERVER=%OMEGA_SERVER_OVERRIDE%"
) else (
  set "OMEGA_SERVER=https://omegav6.jeffdeweyeljefe.workers.dev"
)
set "OMEGA_HOME=%LOCALAPPDATA%\OMEGA"
set "OMEGA_AGENT=%OMEGA_HOME%\omega_sovereign_agent.py"
set "OMEGA_PAIRING=%TEMP%\omega_r220_pairing_%RANDOM%.cmd"
if not exist "%OMEGA_HOME%" mkdir "%OMEGA_HOME%"

echo ============================================================
echo OMEGA R220 FULL HYBRID + SOVEREIGN DEVELOPMENT SETUP
echo ============================================================
echo Canonical: %OMEGA_SERVER%
echo.

echo [1/11] Resolving the canonical approved workspace...
set "OMEGA_ROOT="
if defined OMEGA_ROOT_OVERRIDE set "OMEGA_ROOT=%OMEGA_ROOT_OVERRIDE%"
if defined OMEGA_ROOT if not exist "%OMEGA_ROOT%\pyproject.toml" set "OMEGA_ROOT="

if not defined OMEGA_ROOT (
  for /f "usebackq delims=" %%R in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='SilentlyContinue'; try{$d=Invoke-RestMethod -Uri '%OMEGA_SERVER%/api/development/status' -TimeoutSec 12; if($d.approved_root){[Console]::Out.Write([string]$d.approved_root)}}catch{}"`) do set "OMEGA_SERVER_ROOT=%%R"
  if defined OMEGA_SERVER_ROOT if exist "!OMEGA_SERVER_ROOT!\pyproject.toml" set "OMEGA_ROOT=!OMEGA_SERVER_ROOT!"
)
if not defined OMEGA_ROOT if exist "%OMEGA_HOME%\canonical-root.txt" set /p OMEGA_ROOT=<"%OMEGA_HOME%\canonical-root.txt"
if defined OMEGA_ROOT if not exist "%OMEGA_ROOT%\pyproject.toml" set "OMEGA_ROOT="
if not defined OMEGA_ROOT (
  for %%R in ("%~dp0..") do if exist "%%~fR\pyproject.toml" set "OMEGA_ROOT=%%~fR"
)
if not defined OMEGA_ROOT goto :root_error
if not exist "%OMEGA_ROOT%\scripts\omega_sovereign_agent.py" goto :root_error
if not exist "%OMEGA_ROOT%\cloudflare\omega-v6-worker" goto :root_error
>"%OMEGA_HOME%\canonical-root.txt" echo %OMEGA_ROOT%
echo Approved root: %OMEGA_ROOT%

echo [2/11] Verifying required development toolchain...
where git >nul 2>nul || goto :git_error
where npm >nul 2>nul || goto :node_error
where npx >nul 2>nul || goto :node_error

echo [3/11] Selecting Python 3.10+...
set "PYBOOT="
py -3.12 -c "import sys; raise SystemExit(0 if sys.version_info >= (3,10) else 1)" >nul 2>nul && set "PYBOOT=py -3.12"
if not defined PYBOOT py -3.11 -c "import sys; raise SystemExit(0 if sys.version_info >= (3,10) else 1)" >nul 2>nul && set "PYBOOT=py -3.11"
if not defined PYBOOT py -3.10 -c "import sys; raise SystemExit(0 if sys.version_info >= (3,10) else 1)" >nul 2>nul && set "PYBOOT=py -3.10"
if not defined PYBOOT py -3 -c "import sys; raise SystemExit(0 if sys.version_info >= (3,10) else 1)" >nul 2>nul && set "PYBOOT=py -3"
if not defined PYBOOT python -c "import sys; raise SystemExit(0 if sys.version_info >= (3,10) else 1)" >nul 2>nul && set "PYBOOT=python"
if not defined PYBOOT goto :python_error

echo [4/11] Establishing the verified OMEGA virtual environment...
set "OMEGA_PY=%OMEGA_ROOT%\.venv\Scripts\python.exe"
if not exist "%OMEGA_PY%" (
  %PYBOOT% -m venv "%OMEGA_ROOT%\.venv" || goto :venv_error
)
"%OMEGA_PY%" -m pip install --upgrade pip || goto :dependency_error
"%OMEGA_PY%" -m pip install -e "%OMEGA_ROOT%[dev,rcwa]" || goto :dependency_error

echo [5/11] Proving native RCWA and sovereign runtime imports...
"%OMEGA_PY%" -c "import omega_runtime, grcwa; print('OMEGA_RUNTIME_AND_GRCWA_READY')" || goto :dependency_error
"%OMEGA_PY%" -m omega_runtime.rcwa_solver --probe > "%OMEGA_HOME%\r220_rcwa_probe.json" || goto :rcwa_error
findstr /R /C:"\"available\"[ ]*:[ ]*true" "%OMEGA_HOME%\r220_rcwa_probe.json" >nul || goto :rcwa_error

echo [6/11] Requesting a fresh one-time pairing credential...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; Invoke-WebRequest -UseBasicParsing -Uri '%OMEGA_SERVER%/api/hybrid/launcher' -OutFile '%OMEGA_PAIRING%' -TimeoutSec 30" || goto :pair_error
set "OMEGA_TOKEN="
for /f "usebackq delims=" %%T in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $t=Get-Content -Raw -LiteralPath '%OMEGA_PAIRING%'; $m=[regex]::Match($t,'OMEGA_TOKEN=([^\x22\r\n]+)'); if(-not $m.Success){throw 'pairing token missing'}; [Console]::Out.Write($m.Groups[1].Value)"`) do set "OMEGA_TOKEN=%%T"
del /q "%OMEGA_PAIRING%" >nul 2>nul
if not defined OMEGA_TOKEN goto :pair_error

echo [7/11] Downloading the exact canonical sovereign agent...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; Invoke-WebRequest -UseBasicParsing -Uri '%OMEGA_SERVER%/api/hybrid/agent' -OutFile '%OMEGA_AGENT%' -TimeoutSec 30" || goto :download_error
findstr /C:"bounded recursive development agent" "%OMEGA_AGENT%" >nul || goto :download_error

echo [8/11] Starting authenticated Hybrid heartbeat + governed executor...
start "OMEGA Sovereign Agent" /min "%OMEGA_PY%" "%OMEGA_AGENT%" --server "%OMEGA_SERVER%" --token "%OMEGA_TOKEN%" --root "%OMEGA_ROOT%" --interval 8
set "OMEGA_TOKEN="

echo [9/11] Waiting for current authenticated PC proof...
set "OMEGA_LINKED="
for /L %%I in (1,1,45) do (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='SilentlyContinue'; try{$d=Invoke-RestMethod -Uri '%OMEGA_SERVER%/api/system/r220/status' -TimeoutSec 8; if($d.linkProven -eq $true){exit 0}}catch{}; try{$h=Invoke-RestMethod -Uri '%OMEGA_SERVER%/api/hybrid/status' -TimeoutSec 8; if($h.heartbeatCurrent -and $h.authenticated -and $h.pcOnline){exit 0}}catch{}; exit 1" >nul 2>nul
  if not errorlevel 1 set "OMEGA_LINKED=1"
  if defined OMEGA_LINKED goto :linked
  timeout /t 2 /nobreak >nul
)
goto :link_error

:linked
echo Hybrid link authenticated and current.
echo [10/11] Resuming the bounded governed development loop...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; try{$b=@{confirmed=$true}|ConvertTo-Json -Compress; $d=Invoke-RestMethod -Method Post -Uri '%OMEGA_SERVER%/api/system/r220/resume' -ContentType 'application/json' -Body $b -TimeoutSec 15; if($d.resumed -eq $true){$d|ConvertTo-Json -Depth 30|Set-Content -Encoding utf8 '%OMEGA_HOME%\r220_resume.json'; exit 0}}catch{}; $b=@{mode='DEVELOPMENT_LOOP'}|ConvertTo-Json -Compress; $d=Invoke-RestMethod -Method Post -Uri '%OMEGA_SERVER%/api/development/mode' -ContentType 'application/json' -Body $b -TimeoutSec 15; $d|ConvertTo-Json -Depth 30|Set-Content -Encoding utf8 '%OMEGA_HOME%\r220_resume.json'; exit 0" || goto :resume_error

echo [11/11] Proving host return and continued development...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $passed=$false; $last=$null; for($i=0;$i -lt 90;$i++){ $d=Invoke-RestMethod -Uri '%OMEGA_SERVER%/api/development/status' -TimeoutSec 10; $last=$d; $recent=@($d.recent_jobs); $v=@($recent|Where-Object{$_.state -eq 'VERIFIED' -and $null -ne $_.evidence})|Select-Object -Last 1; $a=$d.active_job; if($v -and $a -and $a.id -ne $v.id){$passed=$true; break}; Start-Sleep -Seconds 2 }; [pscustomobject]@{schema='OMEGA_R220_PHYSICAL_POST_HYBRID_CONTINUITY_PROOF'; server='%OMEGA_SERVER%'; approvedRoot='%OMEGA_ROOT%'; linkProven=$true; verifiedHostJob=$v; nextActiveJob=$a; continuityProven=$passed; canonicalMutation=$false; githubMutation=$false; deploymentAuthorized=$false; promotionAuthorized=$false}|ConvertTo-Json -Depth 40|Set-Content -Encoding utf8 '%OMEGA_HOME%\r220_physical_continuity.json'; if(-not $passed){exit 3}" || goto :continuity_error

echo.
echo OMEGA R220 FULL HYBRID SETUP IS ACTIVE AND CONTINUING.
echo The authenticated agent remains running and leases only governed allow-listed jobs.
echo Native RCWA proof: %OMEGA_HOME%\r220_rcwa_probe.json
echo Resume proof:      %OMEGA_HOME%\r220_resume.json
echo Continuity proof:  %OMEGA_HOME%\r220_physical_continuity.json
echo.
if not defined OMEGA_NONINTERACTIVE pause
exit /b 0

:root_error
echo ROOT ERROR: OMEGA could not locate the canonical canonforge-omega workspace.
echo Keep this file inside the repository scripts folder, or run the canonical Windows installer once so %%LOCALAPPDATA%%\OMEGA\canonical-root.txt exists.
goto :fail
:git_error
echo TOOLCHAIN ERROR: Git is required for convergence and workspace lineage proof.
goto :fail
:node_error
echo TOOLCHAIN ERROR: Node.js npm/npx are required for TypeScript validation and Wrangler dry-run.
goto :fail
:python_error
echo TOOLCHAIN ERROR: Python 3.10+ was not found.
goto :fail
:venv_error
echo VENV ERROR: the verified OMEGA virtual environment could not be created.
goto :fail
:dependency_error
echo DEPENDENCY ERROR: OMEGA Python/dev/RCWA dependencies did not install or import correctly.
goto :fail
:rcwa_error
echo RCWA ERROR: native grcwa acceptance probe failed. No fallback is promoted as full-wave RCWA.
goto :fail
:pair_error
echo PAIRING ERROR: a fresh authenticated Hybrid credential could not be issued or parsed.
goto :fail
:download_error
echo AGENT ERROR: canonical sovereign agent download or contract validation failed.
goto :fail
:link_error
echo LINK ERROR: the agent started but current authenticated PC proof did not arrive within the bounded window.
goto :fail
:resume_error
echo DEVELOPMENT ERROR: Hybrid linked, but the governed development loop could not be resumed.
goto :fail
:continuity_error
echo CONTINUITY ERROR: Hybrid linked, but a verified host return followed by a different next development stage was not proven.
goto :fail
:fail
del /q "%OMEGA_PAIRING%" >nul 2>nul
if not defined OMEGA_NONINTERACTIVE pause
exit /b 1
