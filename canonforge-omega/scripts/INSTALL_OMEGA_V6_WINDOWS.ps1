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

Log "OMEGA V6 R210 install root=$Root"

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

# Installation is the governed dependency-establishment phase; execution paths remain no-install.
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

Log 'running sovereign runtime, pairing, independent-solver, R207 launch, R208 acceptance, R209 convergence, and R210 archive verification'
& $Vpy -m pytest -q `
  (Join-Path $Root 'tests\test_omega_runtime.py') `
  (Join-Path $Root 'tests\test_pairing_and_agent.py') `
  (Join-Path $Root 'tests\test_r175_independent_solver_validation.py') `
  (Join-Path $Root 'tests\test_r206_sovereign_windows_boot_continuity.py') `
  (Join-Path $Root 'tests\test_r207_windows_verified_venv_launch.py') `
  (Join-Path $Root 'tests\test_r208_physical_sovereign_acceptance.py') `
  (Join-Path $Root 'tests\test_r209_sovereign_convergence_diagnostics.py') `
  (Join-Path $Root 'tests\test_r210_sovereign_proof_archive.py') |
  Tee-Object -FilePath $Log -Append
if ($LASTEXITCODE -ne 0) { throw 'OMEGA verification failed; installation not promoted.' }

$Launcher = Join-Path $Root 'scripts\LAUNCH_OMEGA_V6_WINDOWS.ps1'
$R208Prover = Join-Path $Root 'scripts\PROVE_OMEGA_V6_WINDOWS.ps1'
$R209Prover = Join-Path $Root 'scripts\PROVE_OMEGA_V6_R209_WINDOWS.ps1'
$R210Archiver = Join-Path $Root 'scripts\ARCHIVE_OMEGA_SOVEREIGN_PROOF_R210.ps1'
if (-not (Test-Path $Launcher)) { throw "Canonical launcher missing: $Launcher" }
if (-not (Test-Path $R208Prover)) { throw "R208 physical acceptance prover missing: $R208Prover" }
if (-not (Test-Path $R209Prover)) { throw "R209 sovereign convergence prover missing: $R209Prover" }
if (-not (Test-Path $R210Archiver)) { throw "R210 sovereign proof archiver missing: $R210Archiver" }

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
$Shortcut.Description = 'OMEGA V6 Sovereign Runtime + authenticated PC link + R209 convergence + R210 proof retention'
$Shortcut.Save()
Log "desktop shortcut created: $DesktopShortcut"

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

Log 'PASS dependencies, native RCWA, targeted tests, verified-venv launch, R208 truth acceptance, R209 bounded convergence, R210 content-addressed retention, and Windows continuity'
Write-Host 'OMEGA V6 installation verified. Starting canonical runtime, sovereign PC link, bounded convergence proof, and evidence retention now.'
Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',"`"$Launcher`"") -WorkingDirectory $Root
