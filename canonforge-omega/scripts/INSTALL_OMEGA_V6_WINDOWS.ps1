$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $PSScriptRoot
$Venv = Join-Path $Root '.venv'
$LogDir = Join-Path $Root 'logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$Log = Join-Path $LogDir 'install_omega_v6.log'

function Log($Text) {
  $line = "$(Get-Date -Format o) $Text"
  $line | Tee-Object -FilePath $Log -Append
}

Log "OMEGA V6 install root=$Root"
if (-not (Get-Command py -ErrorAction SilentlyContinue) -and -not (Get-Command python -ErrorAction SilentlyContinue)) {
  throw 'Python 3.10+ is required. Install Python and rerun this installer.'
}
$Python = if (Get-Command py -ErrorAction SilentlyContinue) { 'py' } else { 'python' }
if (-not (Test-Path $Venv)) {
  if ($Python -eq 'py') { & py -3 -m venv $Venv } else { & python -m venv $Venv }
}
$Vpy = Join-Path $Venv 'Scripts\python.exe'
& $Vpy -m pip install --upgrade pip | Tee-Object -FilePath $Log -Append
& $Vpy -m pip install -e "$Root[dev]" | Tee-Object -FilePath $Log -Append
& $Vpy -m pytest -q (Join-Path $Root 'tests\test_omega_runtime.py') | Tee-Object -FilePath $Log -Append
if ($LASTEXITCODE -ne 0) { throw 'OMEGA verification failed; installation not promoted.' }

$Launcher = Join-Path $Root 'scripts\LAUNCH_OMEGA_V6_WINDOWS.ps1'
$ShortcutPath = Join-Path ([Environment]::GetFolderPath('Desktop')) 'OMEGA V6.lnk'
$Shell = New-Object -ComObject WScript.Shell
$Shortcut = $Shell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = 'powershell.exe'
$Shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$Launcher`""
$Shortcut.WorkingDirectory = $Root
$Shortcut.Description = 'OMEGA V6 Sovereign Runtime'
$Shortcut.Save()
Log "PASS tests; desktop shortcut created: $ShortcutPath"
Write-Host 'OMEGA V6 installation verified. Use the OMEGA V6 desktop shortcut.'
