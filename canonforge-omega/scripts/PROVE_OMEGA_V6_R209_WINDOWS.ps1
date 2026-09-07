param(
  [string]$ProductionBase = 'https://omegav6.jeffdeweyeljefe.workers.dev',
  [int]$MaxAttempts = 12,
  [int]$DelaySeconds = 5,
  [switch]$RequireFullAcceptance,
  [string]$RootOverride = '',
  [string]$R208ProverOverride = '',
  [string]$R210ArchiverOverride = ''
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

if ($RootOverride) {
  $Root = (Resolve-Path $RootOverride).Path
} else {
  $Root = Split-Path -Parent $PSScriptRoot
}
$R208Prover = if ($R208ProverOverride) { (Resolve-Path $R208ProverOverride).Path } else { Join-Path $PSScriptRoot 'PROVE_OMEGA_V6_WINDOWS.ps1' }
$R210Archiver = if ($R210ArchiverOverride) { (Resolve-Path $R210ArchiverOverride).Path } else { Join-Path $PSScriptRoot 'ARCHIVE_OMEGA_SOVEREIGN_PROOF_R210.ps1' }
$LogDir = Join-Path $Root 'logs'
$ArchiveRoot = Join-Path $LogDir 'proof_archive'
$R208ReceiptPath = Join-Path $LogDir 'r208_physical_acceptance_latest.json'
$R209ReceiptPath = Join-Path $LogDir 'r209_sovereign_convergence_latest.json'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

if (-not (Test-Path $R208Prover)) { throw "R208 acceptance prover missing: $R208Prover" }
if (-not (Test-Path $R210Archiver)) { throw "R210 proof archiver missing: $R210Archiver" }
if ($MaxAttempts -lt 1 -or $MaxAttempts -gt 60) { throw 'MaxAttempts must be between 1 and 60.' }
if ($DelaySeconds -lt 0 -or $DelaySeconds -gt 60) { throw 'DelaySeconds must be between 0 and 60.' }

function Get-Blockers($Receipt) {
  $items = @()
  if (-not [bool]$Receipt.local.runtimeHealthy) { $items += 'LOCAL_RUNTIME_UNHEALTHY' }
  if (-not [bool]$Receipt.local.nativeRcwaAvailable) { $items += 'NATIVE_RCWA_UNAVAILABLE' }
  if (-not [bool]$Receipt.local.authenticated) { $items += 'LOCAL_HYBRID_UNAUTHENTICATED' }
  if (-not [bool]$Receipt.local.heartbeatCurrent) { $items += 'LOCAL_HEARTBEAT_NOT_CURRENT' }
  if (-not [bool]$Receipt.sovereign.authenticated) { $items += 'PRODUCTION_PC_UNAUTHENTICATED' }
  if (-not [bool]$Receipt.sovereign.heartbeatCurrent) { $items += 'PRODUCTION_HEARTBEAT_NOT_CURRENT' }
  if (-not [bool]$Receipt.sovereign.pcAccepted) { $items += 'PRODUCTION_PC_NOT_ACCEPTED' }
  if (-not [bool]$Receipt.b059.fullyTrainedWithinDeclaredScope) { $items += 'B059_DEEP_VERIFICATION_INCOMPLETE' }
  if (-not [bool]$Receipt.b059.groundedQuery) { $items += 'B059_GROUNDED_QUERY_INCOMPLETE' }
  return @($items)
}

function Get-RecoveryAction([string[]]$Blockers) {
  if ($Blockers.Count -eq 0) { return 'NONE_FULL_ACCEPTANCE_VERIFIED' }
  if ($Blockers -contains 'LOCAL_RUNTIME_UNHEALTHY') { return 'RESTART_CANONICAL_LOCAL_RUNTIME' }
  if ($Blockers -contains 'NATIVE_RCWA_UNAVAILABLE') { return 'REPAIR_VERIFIED_OMEGA_VENV_RCWA' }
  if ($Blockers -contains 'LOCAL_HYBRID_UNAUTHENTICATED') { return 'REPAIR_LOCAL_PAIRING_AND_AGENT_AUTH' }
  if ($Blockers -contains 'LOCAL_HEARTBEAT_NOT_CURRENT') { return 'WAIT_OR_RESTART_SOVEREIGN_AGENT' }
  if (($Blockers -contains 'PRODUCTION_HEARTBEAT_NOT_CURRENT') -or ($Blockers -contains 'PRODUCTION_PC_NOT_ACCEPTED')) { return 'WAIT_FOR_CLOUD_HEARTBEAT_CONVERGENCE' }
  if ($Blockers -contains 'B059_DEEP_VERIFICATION_INCOMPLETE') { return 'VERIFY_B059_DETERMINISTIC_CORPUS_ON_SOVEREIGN_HOST' }
  if ($Blockers -contains 'B059_GROUNDED_QUERY_INCOMPLETE') { return 'RUN_B059_GROUNDED_QUERY_AFTER_DEEP_VERIFICATION' }
  return 'INSPECT_R208_UPSTREAM_RECEIPT'
}

function Save-R210Archive([string]$Path, [string]$Kind, [int]$Attempt) {
  $archiveJson = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $R210Archiver -ReceiptPath $Path -Kind $Kind -Attempt $Attempt -ArchiveRoot $ArchiveRoot
  if ($LASTEXITCODE -ne 0) { throw "R210 archive command failed for $Kind attempt $Attempt" }
  $archive = ($archiveJson -join "`n") | ConvertFrom-Json
  if ([string]$archive.schema -ne 'OMEGA_SOVEREIGN_PROOF_ARCHIVE_RESULT_R210') { throw "Unexpected R210 archive result schema: $($archive.schema)" }
  return $archive
}

$attempts = @()
$latest = $null
$fullAcceptance = $false

Write-Host 'OMEGA V6 R209 sovereign convergence diagnostics + R210 proof retention'
Write-Host "Canonical root: $Root"
Write-Host "R208 truth prover: $R208Prover"
Write-Host "R210 archiver: $R210Archiver"
Write-Host "Archive root: $ArchiveRoot"
Write-Host "Attempts: $MaxAttempts  Delay: ${DelaySeconds}s"

for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
  $started = (Get-Date).ToUniversalTime().ToString('o')
  $exitCode = 0
  $errorText = $null
  Remove-Item $R208ReceiptPath -Force -ErrorAction SilentlyContinue
  $latest = $null

  try {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $R208Prover -ProductionBase $ProductionBase -RootOverride $Root
    $exitCode = $LASTEXITCODE
  } catch {
    $exitCode = 90
    $errorText = $_.Exception.Message
  }

  if (Test-Path $R208ReceiptPath) {
    try {
      $latest = Get-Content -Raw -Path $R208ReceiptPath | ConvertFrom-Json
      $receiptCaptured = [DateTimeOffset]::Parse([string]$latest.capturedAt)
      $attemptStarted = [DateTimeOffset]::Parse($started)
      if ($receiptCaptured -lt $attemptStarted.AddSeconds(-1)) { throw "R208 receipt predates current R209 attempt: $($latest.capturedAt) < $started" }
      $archive = Save-R210Archive -Path $R208ReceiptPath -Kind 'R208_ATTEMPT' -Attempt $attempt
      $blockers = @(Get-Blockers $latest)
      $fullAcceptance = [bool]$latest.fullAcceptance
      $attempts += [ordered]@{
        attempt = $attempt
        capturedAt = $started
        r208ReceiptCapturedAt = [string]$latest.capturedAt
        r208ExitCode = $exitCode
        fullAcceptance = $fullAcceptance
        acceptanceState = [string]$latest.acceptanceState
        canonicalGitSha = [string]$latest.production.canonicalGitSha
        upstreamReceiptSha256 = [string]$latest.upstreamReceiptSha256
        r210ArchiveSha256 = [string]$archive.sha256
        r210ArchivePath = [string]$archive.archivePath
        blockers = $blockers
        recoveryAction = Get-RecoveryAction $blockers
        error = $errorText
      }
      Write-Host "Attempt $attempt/$MaxAttempts full=$fullAcceptance archive=$($archive.sha256) blockers=$($blockers -join ',')"
      if ($fullAcceptance) { break }
    } catch {
      $latest = $null
      $fullAcceptance = $false
      $attempts += [ordered]@{ attempt=$attempt; capturedAt=$started; r208ExitCode=$exitCode; fullAcceptance=$false; acceptanceState='R208_RECEIPT_PARSE_FRESHNESS_OR_ARCHIVE_FAILED'; blockers=@('R208_RECEIPT_PARSE_FRESHNESS_OR_ARCHIVE_FAILED'); recoveryAction='INSPECT_R208_UPSTREAM_RECEIPT'; error=$_.Exception.Message }
    }
  } else {
    $latest = $null
    $fullAcceptance = $false
    $attempts += [ordered]@{ attempt=$attempt; capturedAt=$started; r208ExitCode=$exitCode; fullAcceptance=$false; acceptanceState='R208_RECEIPT_MISSING'; blockers=@('R208_RECEIPT_MISSING'); recoveryAction='INSPECT_R208_UPSTREAM_RECEIPT'; error=$errorText }
  }

  if (-not $fullAcceptance -and $attempt -lt $MaxAttempts -and $DelaySeconds -gt 0) { Start-Sleep -Seconds $DelaySeconds }
}

$finalBlockers = @('R208_RECEIPT_MISSING')
$finalAction = 'INSPECT_R208_UPSTREAM_RECEIPT'
if ($null -ne $latest) {
  $finalBlockers = @(Get-Blockers $latest)
  $finalAction = Get-RecoveryAction $finalBlockers
} elseif ($attempts.Count -gt 0) {
  $finalBlockers = @($attempts[$attempts.Count - 1].blockers)
  $finalAction = [string]$attempts[$attempts.Count - 1].recoveryAction
}

$receipt = [ordered]@{
  schema = 'OMEGA_SOVEREIGN_CONVERGENCE_R209'
  revision = 'R209'
  capturedAt = (Get-Date).ToUniversalTime().ToString('o')
  authority = 'LOCAL_OPERATOR_CONVERGENCE_OBSERVATION_NOT_CANON'
  canonicalMutation = $false
  promotionAuthorized = $false
  wraps = 'OMEGA_PHYSICAL_SOVEREIGN_ACCEPTANCE_R208'
  retentionRevision = 'R210'
  productionBase = $ProductionBase.TrimEnd('/')
  maxAttempts = $MaxAttempts
  attemptsCompleted = $attempts.Count
  fullAcceptance = $fullAcceptance
  blockers = $finalBlockers
  recoveryAction = $finalAction
  attempts = $attempts
  boundaries = [ordered]@{
    retriesDoNotCreateProof = $true
    onlyR208R181ReceiptsDetermineAcceptance = $true
    staleR208ReceiptsRejected = $true
    everyValidatedR208AttemptContentAddressedBeforeReplacement = $true
    windowsCiIsPhysicalPcProof = $false
    providerWeightsAreOmegaTrained = $false
    canonicalMutation = $false
    promotionAuthorized = $false
  }
}

$receipt | ConvertTo-Json -Depth 16 | Set-Content -Path $R209ReceiptPath -Encoding utf8
$r209Archive = Save-R210Archive -Path $R209ReceiptPath -Kind 'R209_CONVERGENCE' -Attempt 0
Write-Host "R209 receipt: $R209ReceiptPath"
Write-Host "R210 R209 archive: $($r209Archive.archivePath) sha256=$($r209Archive.sha256)"
Write-Host "Full acceptance: $fullAcceptance"
Write-Host "Recovery action: $finalAction"

if ($RequireFullAcceptance -and -not $fullAcceptance) {
  Write-Error "R209 convergence completed without full acceptance. Recovery action: $finalAction"
  exit 9
}

exit 0
