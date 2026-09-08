param(
  [string]$ProductionBase = 'https://omegav6.jeffdeweyeljefe.workers.dev',
  [switch]$Headless,
  [switch]$NoBrowser,
  [switch]$SkipDevelopment,
  [switch]$SkipAcceptanceProof
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# Stable system entrypoint. Release-specific launchers are implementations behind this
# gateway; users, installers, shortcuts, proof tools and public bootstrap artifacts must
# enter here so a repair is inherited by every caller rather than copied into parallel
# launch paths.
$Root = Split-Path -Parent $PSScriptRoot
$Implementation = Join-Path $PSScriptRoot 'START_OMEGA_R222_FULL_HYBRID.ps1'
if (-not (Test-Path $Implementation)) {
  throw "Canonical sovereign implementation missing: $Implementation"
}

$invoke = @('-NoProfile','-ExecutionPolicy','Bypass','-File',"`"$Implementation`"",'-ProductionBase',"`"$ProductionBase`"")
if ($Headless -or $SkipAcceptanceProof) { $invoke += '-Headless' }
if ($NoBrowser) { $invoke += '-NoBrowser' }
if ($SkipDevelopment -or $SkipAcceptanceProof) { $invoke += '-SkipDevelopment' }

& powershell.exe @invoke
exit $LASTEXITCODE
