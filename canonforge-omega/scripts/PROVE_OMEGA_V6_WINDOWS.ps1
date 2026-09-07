param(
  [string]$ProductionBase = 'https://omegav6.jeffdeweyeljefe.workers.dev',
  [switch]$RequireFullAcceptance
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $PSScriptRoot
$Vpy = Join-Path $Root '.venv\Scripts\python.exe'
$LogDir = Join-Path $Root 'logs'
$ReceiptPath = Join-Path $LogDir 'r208_physical_acceptance_latest.json'
$Port = 8127
$LocalBase = "http://127.0.0.1:$Port"
$ProductionBase = $ProductionBase.TrimEnd('/')
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Assert-True([bool]$Condition, [string]$Message) {
  if (-not $Condition) { throw $Message }
}

function Is-Sha256([string]$Value) {
  return [bool]($Value -match '^[a-f0-9]{64}$')
}

Write-Host 'OMEGA V6 R208 physical sovereign acceptance proof'
Write-Host "Root: $Root"
Write-Host "Production: $ProductionBase"

Assert-True (Test-Path $Vpy) "Verified OMEGA Python environment is missing: $Vpy"

$localHealth = Invoke-RestMethod -Uri "$LocalBase/api/health" -TimeoutSec 5
Assert-True ([bool]$localHealth.ok) 'Canonical localhost OMEGA runtime is not healthy.'

$localHybrid = Invoke-RestMethod -Uri "$LocalBase/api/hybrid/status" -TimeoutSec 5
$localHeartbeatCurrent = [bool]$localHybrid.heartbeatCurrent
$localAuthenticated = [bool]$localHybrid.authenticated

$rcwaRaw = & $Vpy -m omega_runtime.rcwa_solver --probe
Assert-True ($LASTEXITCODE -eq 0) 'Native RCWA dependency probe failed.'
$rcwa = ($rcwaRaw -join "`n") | ConvertFrom-Json
Assert-True ([bool]$rcwa.available) 'Native grcwa RCWA is unavailable; no fallback is accepted as RCWA.'

$manifest = Invoke-RestMethod -Uri "$ProductionBase/api/acceptance/r181/manifest" -TimeoutSec 20
Assert-True ([bool]$manifest.ok) 'Production R181 acceptance manifest is unavailable.'
Assert-True ($manifest.schema -eq 'OMEGA_LIVE_ACCEPTANCE_MANIFEST_R181') 'Unexpected production acceptance manifest schema.'
Assert-True ([bool]$manifest.deploymentIdentityBound) 'Production acceptance manifest is not deployment-identity bound.'
Assert-True (Is-Sha256 ([string]$manifest.canonicalGitSha)) 'Production manifest canonical Git SHA is invalid.'

$probeBody = [ordered]@{
  deep_b059 = $true
  query_b059 = $true
  prompt = 'Explain Woven Continuity, Mode 188, scar carry, and the 20,736-address system using only grounded B059 evidence.'
} | ConvertTo-Json -Compress

$acceptance = Invoke-RestMethod `
  -Method Post `
  -Uri "$ProductionBase/api/acceptance/r181/probe" `
  -ContentType 'application/json' `
  -Body $probeBody `
  -TimeoutSec 120

Assert-True ([bool]$acceptance.ok) 'Production R181 acceptance probe did not return ok=true.'
Assert-True ($acceptance.schema -eq 'OMEGA_LIVE_AI_SAI_SOVEREIGN_ACCEPTANCE_R181') 'Unexpected production R181 acceptance schema.'
Assert-True ($acceptance.authority -eq 'LIVE_ACCEPTANCE_RECEIPT_NOT_CANON') 'R181 acceptance authority boundary changed unexpectedly.'
Assert-True (-not [bool]$acceptance.canonicalMutation) 'Acceptance probing must never mutate Canon.'
Assert-True (-not [bool]$acceptance.promotionAuthorized) 'Acceptance probing must never authorize promotion.'
Assert-True ([bool]$acceptance.deploymentIdentityBound) 'R181 acceptance receipt is not deployment-identity bound.'
Assert-True ([string]$acceptance.canonicalGitSha -eq [string]$manifest.canonicalGitSha) 'R181 acceptance SHA does not match the production manifest SHA.'
Assert-True (Is-Sha256 ([string]$acceptance.receiptSha256)) 'R181 acceptance receipt SHA-256 is invalid.'

$pcAccepted = [bool]$acceptance.hybrid.accepted
$pcAuthenticated = [bool]$acceptance.hybrid.authenticated
$pcHeartbeatCurrent = [bool]$acceptance.hybrid.heartbeatCurrent
$b059Verified = [bool]$acceptance.b059Verification.fullyTrainedWithinDeclaredScope
$groundedQuery = [bool]$acceptance.b059GroundedQuery.grounded
$fullAcceptance = [bool]$acceptance.fullAcceptance

$expectedFull = $pcAccepted -and $pcAuthenticated -and $pcHeartbeatCurrent -and $b059Verified -and $groundedQuery
Assert-True ($fullAcceptance -eq $expectedFull) 'R181 fullAcceptance does not equal its required physical-PC + B059 proof conjunction.'

$receipt = [ordered]@{
  schema = 'OMEGA_PHYSICAL_SOVEREIGN_ACCEPTANCE_R208'
  revision = 'R208'
  capturedAt = (Get-Date).ToUniversalTime().ToString('o')
  authority = 'LOCAL_OPERATOR_ACCEPTANCE_OBSERVATION_NOT_CANON'
  canonicalMutation = $false
  promotionAuthorized = $false
  production = [ordered]@{
    base = $ProductionBase
    canonicalGitSha = [string]$manifest.canonicalGitSha
    deploymentIdentityBound = [bool]$manifest.deploymentIdentityBound
  }
  local = [ordered]@{
    root = $Root
    canonicalPort = $Port
    runtimeHealthy = [bool]$localHealth.ok
    heartbeatCurrent = $localHeartbeatCurrent
    authenticated = $localAuthenticated
    nativeRcwaAvailable = [bool]$rcwa.available
  }
  sovereign = [ordered]@{
    pcAccepted = $pcAccepted
    authenticated = $pcAuthenticated
    heartbeatCurrent = $pcHeartbeatCurrent
  }
  b059 = [ordered]@{
    state = [string]$acceptance.b059Quick.state
    fullyTrainedWithinDeclaredScope = $b059Verified
    groundedQuery = $groundedQuery
    foundationModelWeightsTrained = [bool]$acceptance.b059Verification.foundationModelWeightsTrained
  }
  acceptanceState = [string]$acceptance.acceptanceState
  fullAcceptance = $fullAcceptance
  upstreamReceiptSha256 = [string]$acceptance.receiptSha256
  boundaries = [ordered]@{
    windowsCiIsPhysicalPcProof = $false
    providerWeightsAreOmegaTrained = $false
    fullAcceptanceRequiresCurrentAuthenticatedPhysicalHeartbeat = $true
    fullAcceptanceRequiresDeepB059Verification = $true
    fullAcceptanceRequiresGroundedB059Query = $true
  }
}

$receipt | ConvertTo-Json -Depth 12 | Set-Content -Path $ReceiptPath -Encoding utf8

Write-Host "Canonical SHA: $($receipt.production.canonicalGitSha)"
Write-Host "Local heartbeat current/authenticated: $localHeartbeatCurrent / $localAuthenticated"
Write-Host "Production PC accepted/authenticated/current: $pcAccepted / $pcAuthenticated / $pcHeartbeatCurrent"
Write-Host "B059 verified within declared scope: $b059Verified"
Write-Host "Grounded B059 query: $groundedQuery"
Write-Host "Full acceptance: $fullAcceptance"
Write-Host "Receipt: $ReceiptPath"

if ($RequireFullAcceptance -and -not $fullAcceptance) {
  Write-Error 'R208 proof executed correctly, but full physical sovereign acceptance is still incomplete. The receipt records the exact false gate(s).'
  exit 8
}

exit 0
