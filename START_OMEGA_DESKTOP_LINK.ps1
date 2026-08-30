param(
  [string]$Root = (Get-Location).Path,
  [string]$Cloud = "",
  [string]$PairCode = "",
  [switch]$Once
)
$ErrorActionPreference = "Stop"
$Repo = Split-Path -Parent $MyInvocation.MyCommand.Path
$Vpy = Join-Path $Repo ".omega-venv\Scripts\python.exe"
if (!(Test-Path $Vpy)) {
  $cmd = Get-Command python -ErrorAction SilentlyContinue
  if (!$cmd) { throw "Python 3.11+ or INSTALL_OMEGA_WINDOWS.bat is required." }
  $Vpy = $cmd.Source
}
$argsList = @("-m","omega_genesis.desktop_link","--root",$Root)
if ($Cloud) { $argsList += @("--cloud",$Cloud) }
if ($PairCode) { $argsList += @("--pair-code",$PairCode) }
if ($Once) { $argsList += "--once" }
Write-Host "OMEGA Genesis Desktop Link"
Write-Host "Approved root: $Root"
& $Vpy @argsList
