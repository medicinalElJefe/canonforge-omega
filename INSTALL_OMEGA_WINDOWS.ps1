param(
  [string]$InstallRoot = $env:OMEGA_INSTALL_ROOT,
  [switch]$NoLaunch
)

$ErrorActionPreference = "Stop"
$SourceRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
if ([string]::IsNullOrWhiteSpace($InstallRoot)) {
  $InstallRoot = "C:\OMEGA_INSTALL\OMEGA_ONE_SYSTEM"
}
$InstallRoot = [System.IO.Path]::GetFullPath($InstallRoot)

Write-Host "OMEGA Genesis 1.1 - sovereign Windows host setup"
Write-Host "Source: $SourceRoot"
Write-Host "Install root: $InstallRoot"

if ($SourceRoot -ne $InstallRoot) {
  New-Item -ItemType Directory -Force -Path $InstallRoot | Out-Null
  $ExcludeDirs = @(".git", ".pytest_cache", "__pycache__", "node_modules", "runtime-data", "release", ".venv", ".omega-venv")
  $Args = @($SourceRoot, $InstallRoot, "/E", "/COPY:DAT", "/DCOPY:DAT", "/R:2", "/W:1", "/NFL", "/NDL", "/NJH", "/NJS", "/NP", "/XD") + $ExcludeDirs
  & robocopy @Args | Out-Null
  if ($LASTEXITCODE -ge 8) { throw "robocopy failed with exit code $LASTEXITCODE" }
}

Set-Location $InstallRoot
$Py = Get-Command py -ErrorAction SilentlyContinue
if ($Py) { $Python = "py"; $PyArgs = @("-3") } else { $Python = "python"; $PyArgs = @() }
& $Python @PyArgs -c "import sys; assert sys.version_info >= (3,11), 'Python 3.11+ required'"

if (!(Test-Path ".omega-venv")) { & $Python @PyArgs -m venv .omega-venv }
$Vpy = Join-Path $InstallRoot ".omega-venv\Scripts\python.exe"
& $Vpy -m pip install --upgrade pip
& $Vpy -m pip install -e .
& $Vpy scripts\verify_release.py

$env:OMEGA_DATA = if ($env:OMEGA_DATA) { $env:OMEGA_DATA } else { Join-Path $InstallRoot "runtime-data" }
$env:OMEGA_HYBRID_ROOTS = if ($env:OMEGA_HYBRID_ROOTS) { $env:OMEGA_HYBRID_ROOTS } else { $InstallRoot }

Write-Host "OMEGA Genesis source and checksum gates passed."
Write-Host "Use -InstallRoot to override C:\OMEGA_INSTALL\OMEGA_ONE_SYSTEM."
if (!$NoLaunch) {
  Write-Host "Launching sovereign runtime..."
  & $Vpy START_OMEGA.py
}
