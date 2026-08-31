param(
  [string]$Root = "",
  [string]$Cloud = "",
  [string]$PairCode = "",
  [switch]$Once
)
$ErrorActionPreference = "Stop"
$Repo = Split-Path -Parent $MyInvocation.MyCommand.Path

if (-not $Root) {
  $legacyConfig = Join-Path $env:LOCALAPPDATA "OMEGA\hybrid-link.json"
  if (Test-Path -LiteralPath $legacyConfig -PathType Leaf) {
    try {
      $legacy = Get-Content -LiteralPath $legacyConfig -Raw | ConvertFrom-Json
      if ($legacy.root -and (Test-Path -LiteralPath ([string]$legacy.root) -PathType Container)) {
        $Root = [string]$legacy.root
        Write-Host "Recovered existing OMEGA V90-R4 approved root: $Root"
      }
    } catch {
      Write-Warning "Existing V90-R4 configuration was found but its approved root could not be recovered."
    }
  }
}
if (-not $Root) { $Root = (Get-Location).Path }
$Root = (Resolve-Path -LiteralPath $Root).Path

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
Write-Host "OMEGA Genesis Desktop Link · Signed Envelope V1"
Write-Host "Approved root: $Root"
Write-Host "Existing V90-R4 workspace roots are reused automatically when available."
& $Vpy @argsList
