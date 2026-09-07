$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $PSScriptRoot
$Venv = Join-Path $Root '.venv'
$LogDir = Join-Path $Root 'logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$Log = Join-Path $LogDir 'install_omega_v6.log'

function Log([string]$Text) {
  $line = "$(Get-Date -Format o) $Text"
  $line | Tee-Object -FilePath $Log -Append
}

Log "OMEGA V6 R208 install root=$Root"

if (-not (Get-Command py -ErrorAction SilentlyContinue) -and -not (Get-Command python -ErrorAction SilentlyContinue)) {
  throw 'Python 3.10+ is required. Install Python and rerun this installer.'
}

$PythonExe = $null
$PythonArgs = @()
if (Get-Command py -ErrorAction SilentlyContinue) {
  foreach ($Version in @('3.13','3.12','3.11','3.10')) {
    & py "-$Version" -c "import sys; raise SystemExit(0 if sys.version_info >= (3,10) else 1)" *> $null
    if ($LASTEXITCODE -eq 0) {
      $PythonExe = 'py'
      $PythonArgs = @("-$Version")
      Log "selected Python $Version from py launcher for RCWA compatibility"
      break
    }
  }
  if (-not $PythonExe) {
    & py -3 -c "import sys; raise SystemExit(0 if sys.version_info >= (3,10) else 1)" *> $null
    if ($LASTEXITCODE -eq 0) {
      $PythonExe = 'py'
      $PythonArgs = @('-3')
      Log 'selected default Python 3 from py launcher'
    }
  }
}
if (-not $PythonExe -and (Get-Command python -ErrorAction SilentlyContinue)) {
  & python -c "import sys; raise SystemExit(0 if sys.version_info >= (3,10) else 1)" *> $null
  if ($LASTEXITCODE -eq 0) {
    $PythonExe = 'python'
    $PythonArgs = @()
    Log 'selected python executable from PATH'
  }
}
if (-not $PythonExe) { throw 'No usable Python 3.10+ interpreter was found.' }

if (-not (Test-Path $Venv)) {
  Log "creating virtual environment $Venv"
  & $PythonExe @PythonArgs -m venv $Venv
  if ($LASTEXITCODE -ne 0) { throw 'OMEGA virtual environment creation failed.' }
}

$Vpy = Join-Path $Venv 'Scripts\python.exe'
if (-not (Test-Path $Vpy)) { throw "OMEGA virtual environment is incomplete: $Vpy not found." }

& $Vpy -m pip install --upgrade pip | Tee-Object -FilePath $Log -Append
if ($LASTEXITCODE -ne 0) { throw 'pip upgrade failed.' }

# Install the complete governed runtime plus tests and the independent Maxwell-RCWA solver.
& $Vpy -m pip install -e "$Root[dev,rcwa]" | Tee-Object -FilePath $Log -Append
if ($LASTEXITCODE -ne 0) {
  throw 'OMEGA dependencies failed to install. RCWA is mandatory for full sovereign independent-solver acceptance; no scalar fallback is promoted as RCWA.'
}

Log 'probing native RCWA dependency contract'
$RcwaProbe = & $Vpy -m omega_runtime.rcwa_solver --probe
$RcwaProbe | Tee-Object -FilePath $Log -Append
if ($LASTEXITCODE -ne 0 -or ($RcwaProbe -join "`n") -notmatch '"available"\s*:\s*true') {
  throw 'Native grcwa RCWA probe failed. Installation is not promoted.'
}

Log 'running sovereign runtime, pairing, independent-solver, R207 launch, and R208 acceptance-closure verification'
& $Vpy -m pytest -q `
  (Join-Path $Root 'tests\test_omega_runtime.py') `
  (Join-Path $Root 'tests\test_pairing_and_agent.py') `
  (Join-Path $Root 'tests\test_r175_independent_solver_validation.py') `
  (Join-Path $Root 'tests\test_r206_sovereign_windows_boot_continuity.py') `
  (Join-Path $Root 'tests\test_r207_windows_verified_venv_launch.py') `
  (Join-Path $Root 'tests\test_r208_physical_sovereign_acceptance.py') |
  Tee-Object -FilePath $Log -Append
if ($LASTEXITCODE -ne 0) { throw 'OMEGA verification failed; installation not promoted.' }

$Launcher = Join-Path $Root 'scripts\LAUNCH_OMEGA_V6_WINDOWS.ps1'
$AcceptanceProver = Join-Path $Root 'scripts\PROVE_OMEGA_V6_WINDOWS.ps1'
if (-not (Test-Path $Launcher)) { throw "Canonical launcher missing: $Launcher" }
if (-not (Test-Path $AcceptanceProver)) { throw "R208 physical acceptance prover missing: $AcceptanceProver" }

# Persist only the non-secret canonical root pointer. Pairing tokens remain ephemeral.
$OmegaLocal = Join-Path $env:LOCALAPPDATA 'OMEGA'
New-Item -ItemType Directory -Force -Path $OmegaLocal | Out-Null
$RootPointer = Join-Path $OmegaLocal 'canonical-root.txt'
Set-Content -Path $RootPointer -Value $Root -Encoding utf8
Log "canonical root pointer written: $RootPointer"

$Shell = New-Object -ComObject WScript.Shell
$DesktopShortcut = Join-Path ([Environment]::GetFolderPath('Desktop')) 'OMEGA V6.lnk'
$Shortcut = $Shell.CreateShortcut($DesktopShortcut)
$Shortcut.TargetPath = 'powershell.exe'
$Shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$Launcher`""
$Shortcut.WorkingDirectory = $Root
$Shortcut.Description = 'OMEGA V6 Sovereign Runtime + authenticated PC link + R208 acceptance proof'
$Shortcut.Save()
Log "desktop shortcut created: $DesktopShortcut"

# Continuity across Windows logins: use the exact same canonical entry point, but do not
# open a browser or run the expensive deep B059 acceptance query every time Windows starts.
$StartupDir = [Environment]::GetFolderPath('Startup')
if ($StartupDir) {
  $StartupShortcut = Join-Path $StartupDir 'OMEGA V6 Sovereign Continuity.lnk'
  $Auto = $Shell.CreateShortcut($StartupShortcut)
  $Auto.TargetPath = 'powershell.exe'
  $Auto.Arguments = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$Launcher`" -NoBrowser -SkipAcceptanceProof"
  $Auto.WorkingDirectory = $Root
  $Auto.Description = 'Start canonical OMEGA V6 runtime and authenticated sovereign heartbeat after Windows login'
  $Auto.Save()
  Log "startup continuity shortcut created: $StartupShortcut"
}

Log 'PASS dependencies, native RCWA, targeted tests, verified-venv launch, R208 acceptance closure, and bounded Windows continuity'
Write-Host 'OMEGA V6 installation verified. Starting the canonical runtime, sovereign PC link, and physical acceptance proof now.'
Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',"`"$Launcher`"") -WorkingDirectory $Root
