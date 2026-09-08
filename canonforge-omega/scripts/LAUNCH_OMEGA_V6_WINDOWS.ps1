param(
  [switch]$NoBrowser,
  [switch]$SkipAcceptanceProof
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# Compatibility entrypoint only. Runtime/agent ownership lives behind the stable
# START_OMEGA_SOVEREIGN gateway so historical shortcuts cannot create a second OMEGA.
$Gateway = Join-Path $PSScriptRoot 'START_OMEGA_SOVEREIGN.ps1'
if (-not (Test-Path $Gateway)) {
  throw "Canonical OMEGA sovereign gateway missing: $Gateway"
}

$args = @('-NoProfile','-ExecutionPolicy','Bypass','-File',"`"$Gateway`"")
if ($NoBrowser) { $args += '-NoBrowser' }
if ($SkipAcceptanceProof) { $args += '-SkipAcceptanceProof' }

& powershell.exe @args
exit $LASTEXITCODE
