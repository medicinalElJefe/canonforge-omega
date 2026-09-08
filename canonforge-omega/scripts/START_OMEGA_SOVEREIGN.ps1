param(
  [string]$ProductionBase = '',
  [switch]$Headless,
  [switch]$NoBrowser,
  [switch]$SkipDevelopment,
  [switch]$SkipAcceptanceProof
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# Resolve one endpoint identity for the full launcher -> implementation -> proof chain.
# Normal operator launches default to canonical production. Local/CI repair proofs may
# explicitly override that identity without accidentally crossing back into production.
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

# Stable system entrypoint. Release-specific launchers are implementations behind this
# gateway; users, installers, shortcuts, proof tools and public bootstrap artifacts must
# enter here so a repair is inherited by every caller rather than copied into parallel
# launch paths. Truth/proof stages are also wired here so ownership repair cannot erase
# R208/R209 acceptance diagnostics while deduplicating runtime ownership.
$Root = Split-Path -Parent $PSScriptRoot
$Implementation = Join-Path $PSScriptRoot 'START_OMEGA_R222_FULL_HYBRID.ps1'
$AcceptanceProver = Join-Path $PSScriptRoot 'PROVE_OMEGA_V6_R209_WINDOWS.ps1'
$LogDir = Join-Path $Root 'logs'
$Log = Join-Path $LogDir 'sovereign_gateway.log'
$AcceptanceReceipt = Join-Path $LogDir 'r209_sovereign_convergence_latest.json'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Write-GatewayLog([string]$Text) {
  "$(Get-Date -Format o) $Text" | Out-File $Log -Append -Encoding utf8
}

if (-not (Test-Path $Implementation)) {
  throw "Canonical sovereign implementation missing: $Implementation"
}
if (-not $SkipAcceptanceProof -and -not (Test-Path $AcceptanceProver)) {
  throw "R209 sovereign convergence prover missing: $AcceptanceProver"
}

# Call-operator array splatting preserves spaces without embedding quote characters.
# Literal quotes inside -File/-ProductionBase become part of the value under Windows
# PowerShell and can turn a valid path into an illegal path.
$invoke = @('-NoProfile','-ExecutionPolicy','Bypass','-File',$Implementation,'-ProductionBase',$ProductionBase)
if ($Headless) { $invoke += '-Headless' }
if ($NoBrowser) { $invoke += '-NoBrowser' }
if ($SkipDevelopment) { $invoke += '-SkipDevelopment' }

Write-GatewayLog "stable sovereign launch begin implementation=$Implementation endpoint=$ProductionBase headless=$Headless skipDevelopment=$SkipDevelopment skipAcceptance=$SkipAcceptanceProof"
& powershell.exe @invoke
$launchExit = $LASTEXITCODE
if ($launchExit -ne 0) {
  Write-GatewayLog "release implementation failed exit=$launchExit; R208/R209 proof not promoted"
  exit $launchExit
}

if ($SkipAcceptanceProof) {
  Write-GatewayLog 'R208/R209 acceptance diagnostics explicitly skipped; runtime/link truth remains whatever the implementation actually proved.'
  exit 0
}

# R209 is additive to R208 and consumes the already-running canonical runtime/agent.
# It must never create another OMEGA owner. Its retries are diagnostics only: only the
# underlying R208/R181 receipts determine full acceptance.
Write-GatewayLog 'running R209 bounded sovereign convergence diagnostics on the existing single-owner runtime'
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $AcceptanceProver -ProductionBase $ProductionBase -MaxAttempts 12 -DelaySeconds 5
$proofExit = $LASTEXITCODE

if (Test-Path $AcceptanceReceipt) {
  try {
    $receipt = Get-Content -Raw -Path $AcceptanceReceipt | ConvertFrom-Json
    $lastSha = ''
    if ($receipt.attempts -and $receipt.attempts.Count -gt 0) {
      $lastSha = [string]$receipt.attempts[$receipt.attempts.Count - 1].canonicalGitSha
    }
    Write-GatewayLog "R209 full=$($receipt.fullAcceptance) attempts=$($receipt.attemptsCompleted) action=$($receipt.recoveryAction) sha=$lastSha blockers=$($receipt.blockers -join ',')"
  } catch {
    Write-GatewayLog "R209 receipt parse failed: $($_.Exception.Message)"
  }
} else {
  Write-GatewayLog 'R209 convergence receipt missing; no acceptance claim promoted.'
}

if ($proofExit -ne 0) {
  Write-GatewayLog "R209 diagnostics returned exit=$proofExit; no success claim promoted and canonical runtime remains single-owned."
}

# Startup/runtime availability and acceptance truth are separate states. The gateway
# returns the implementation result while the proof ledger carries acceptance=false when
# R208/R209 have not converged. Release admission remains controlled elsewhere.
exit 0
