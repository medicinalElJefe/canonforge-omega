$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root
Write-Host "OMEGA Genesis 1.1 - Windows host setup"
$Py = Get-Command py -ErrorAction SilentlyContinue
if ($Py) { $Python = "py"; $PyArgs = @("-3") } else { $Python = "python"; $PyArgs = @() }
& $Python @PyArgs -c "import sys; assert sys.version_info >= (3,11), 'Python 3.11+ required'"
if (!(Test-Path ".omega-venv")) { & $Python @PyArgs -m venv .omega-venv }
$Vpy = Join-Path $Root ".omega-venv\Scripts\python.exe"
& $Vpy -m pip install --upgrade pip
& $Vpy -m pip install -e .
& $Vpy scripts\verify_release.py
Write-Host "OMEGA Genesis installed and verified. Launching..."
& $Vpy START_OMEGA.py
