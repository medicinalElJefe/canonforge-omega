param(
  [string]$ProductionBase = '',
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

# Production defaults to the canonical Worker, while local/CI proofs can explicitly
# bind the entire compatibility chain to one localhost candidate. Prefer the explicit
# parameter, then the dedicated server override, then the established public-url
# override. This prevents a localhost proof from silently jumping to production.
if ([string]::IsNullOrWhiteSpace($ProductionBase)) {
  if ($env:OMEGA_SERVER_OVERRIDE) {
    $ProductionBase = [string]$env:OMEGA_SERVER_OVERRIDE
  } elseif ($env:OMEGA_PUBLIC_URL) {
    $ProductionBase = [string]$env:OMEGA_PUBLIC_URL
  } else {
    $ProductionBase = 'https://omegav6.jeffdeweyeljefe.workers.dev'
  }
}
$ProductionBase = $ProductionBase.TrimEnd('/')

# Array splatting already preserves each argument boundary. Do not embed quote
# characters in the -File value: Windows PowerShell then treats those quotes as literal
# path characters and rejects an otherwise valid gateway path.
$args = @('-NoProfile','-ExecutionPolicy','Bypass','-File',$Gateway,'-ProductionBase',$ProductionBase)
if ($NoBrowser) { $args += '-NoBrowser' }
if ($SkipAcceptanceProof) { $args += '-SkipAcceptanceProof' }

& powershell.exe @args
exit $LASTEXITCODE
