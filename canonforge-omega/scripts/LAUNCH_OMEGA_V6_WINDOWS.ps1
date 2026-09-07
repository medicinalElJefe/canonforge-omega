param(
  [switch]$NoBrowser,
  [switch]$SkipAcceptanceProof,
  [string]$RootOverride = '',
  [string]$AgentScriptOverride = '',
  [string]$ConvergenceProverOverride = '',
  [string]$R208ProverOverride = '',
  [string]$R210ArchiverOverride = '',
  [string]$CloudBase = 'https://omegav6.jeffdeweyeljefe.workers.dev',
  [string]$PairingEnvelopePath = '/api/hybrid/pairing-envelope',
  [switch]$ForceRepair
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

if ($RootOverride) { $Root = (Resolve-Path $RootOverride).Path } else { $Root = Split-Path -Parent $PSScriptRoot }
$Vpy = Join-Path $Root '.venv\Scripts\python.exe'
$AgentScript = if ($AgentScriptOverride) { (Resolve-Path $AgentScriptOverride).Path } else { Join-Path $Root 'scripts\omega_sovereign_agent.py' }
$ConvergenceProver = if ($ConvergenceProverOverride) { (Resolve-Path $ConvergenceProverOverride).Path } else { Join-Path $Root 'scripts\PROVE_OMEGA_V6_R209_WINDOWS.ps1' }
$R208Prover = if ($R208ProverOverride) { (Resolve-Path $R208ProverOverride).Path } else { Join-Path $Root 'scripts\PROVE_OMEGA_V6_WINDOWS.ps1' }
$R210Archiver = if ($R210ArchiverOverride) { (Resolve-Path $R210ArchiverOverride).Path } else { Join-Path $Root 'scripts\ARCHIVE_OMEGA_SOVEREIGN_PROOF_R210.ps1' }
$LogDir = Join-Path $Root 'logs'
$RuntimeStdout = Join-Path $LogDir 'runtime_stdout.log'
$RuntimeStderr = Join-Path $LogDir 'runtime_stderr.log'
$AgentStdout = Join-Path $LogDir 'agent_stdout.log'
$AgentStderr = Join-Path $LogDir 'agent_stderr.log'
$Log = Join-Path $LogDir 'launcher.log'
$AcceptanceReceipt = Join-Path $LogDir 'r209_sovereign_convergence_latest.json'
$Port = 8127
$Base = "http://127.0.0.1:$Port"
$Health = "$Base/api/health"
$CloudBase = $CloudBase.TrimEnd('/')
if (-not $PairingEnvelopePath.StartsWith('/')) { throw 'PairingEnvelopePath must begin with /.' }
$HostedHybridStatus = "$CloudBase/api/hybrid/status"
$HostedPairingEnvelope = "$CloudBase$PairingEnvelopePath"
$OmegaLocal = Join-Path $env:LOCALAPPDATA 'OMEGA'
$PairingGenerationFile = Join-Path $OmegaLocal 'hosted-pairing-generation.txt'
$PairingEnvelope = Join-Path $OmegaLocal ("pairing-once-{0}.cmd" -f $PID)

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
New-Item -ItemType Directory -Force -Path $OmegaLocal | Out-Null

function Write-OmegaLog([string]$Text) { "$(Get-Date -Format o) $Text" | Out-File $Log -Append -Encoding utf8 }
function Get-HealthyOmegaRuntime {
  try { $r = Invoke-RestMethod -Uri $Health -TimeoutSec 2; return [bool]$r.ok } catch { return $false }
}
function Get-HostedHybridStatus {
  try { return Invoke-RestMethod -Uri $HostedHybridStatus -TimeoutSec 5 }
  catch { Write-OmegaLog "hosted hybrid status unavailable: $($_.Exception.Message)"; return $null }
}
function Get-StatusBool($Status, [string[]]$Names) {
  if ($null -eq $Status) { return $false }
  foreach ($name in $Names) {
    $property = $Status.PSObject.Properties[$name]
    if ($null -ne $property -and [bool]$property.Value) { return $true }
  }
  return $false
}
function Get-StatusPairingGeneration($Status) {
  if ($null -eq $Status) { return $null }
  $property = $Status.PSObject.Properties['pairingGeneration']
  if ($null -eq $property -or $null -eq $property.Value) { return $null }
  try { return [int64]$property.Value } catch { return $null }
}
function Get-StoredPairingGeneration {
  if (-not (Test-Path $PairingGenerationFile)) { return $null }
  try { $raw=(Get-Content -Raw $PairingGenerationFile).Trim(); if (-not $raw) { return $null }; return [int64]$raw }
  catch { Write-OmegaLog "hosted pairing-generation sidecar unreadable: $($_.Exception.Message)"; return $null }
}
function Get-OmegaAgentProcess {
  try {
    return Get-CimInstance Win32_Process -ErrorAction Stop |
      Where-Object { $_.CommandLine -and $_.CommandLine -match 'omega_sovereign_agent\.py' -and $_.CommandLine -like "*$Root*" } |
      Select-Object -First 1
  } catch { Write-OmegaLog "agent process inspection unavailable: $($_.Exception.Message)"; return $null }
}
function Stop-OmegaAgent($Process, [string]$Reason) {
  if ($null -eq $Process) { return }
  Write-OmegaLog "stopping sovereign agent pid=$($Process.ProcessId) reason=$Reason"
  Stop-Process -Id $Process.ProcessId -Force -ErrorAction SilentlyContinue
  for ($i=0; $i -lt 20; $i++) { if (-not (Get-Process -Id $Process.ProcessId -ErrorAction SilentlyContinue)) { return }; Start-Sleep -Milliseconds 150 }
  throw "OMEGA could not stop stale sovereign agent pid=$($Process.ProcessId)."
}

foreach ($required in @($Vpy,$AgentScript,$ConvergenceProver,$R208Prover,$R210Archiver)) {
  if (-not (Test-Path $required)) { throw "Required R211/R210/R209/R208 component missing: $required" }
}

Write-OmegaLog "R211 launch requested root=$Root canonical_port=$Port cloud=$CloudBase force_repair=$ForceRepair"

$runtimeProcess=$null
if (Get-HealthyOmegaRuntime) {
  Write-OmegaLog "reusing healthy canonical localhost runtime on $Base"
} else {
  $busy=Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  if ($busy) { throw "Port $Port is already occupied by a non-OMEGA service. OMEGA will not silently move the canonical Hybrid endpoint to another port. Stop the conflicting process and launch again." }
  Write-OmegaLog "starting canonical localhost runtime on $Base"
  $runtimeProcess=Start-Process -FilePath $Vpy -ArgumentList @('-m','omega_runtime.cli','--host','127.0.0.1','--port',"$Port") -WorkingDirectory $Root -RedirectStandardOutput $RuntimeStdout -RedirectStandardError $RuntimeStderr -PassThru
  $ready=$false
  for ($i=0; $i -lt 80; $i++) { if ($runtimeProcess.HasExited) { break }; if (Get-HealthyOmegaRuntime) { $ready=$true; break }; Start-Sleep -Milliseconds 250 }
  if (-not $ready) { Write-OmegaLog "runtime launch failed pid=$($runtimeProcess.Id)"; throw "OMEGA runtime did not become healthy on canonical port $Port. Review $RuntimeStderr" }
  Write-OmegaLog "runtime healthy pid=$($runtimeProcess.Id)"
}

$agentProcess=Get-OmegaAgentProcess
$hostedBefore=Get-HostedHybridStatus
$storedGeneration=Get-StoredPairingGeneration
$currentGeneration=Get-StatusPairingGeneration $hostedBefore
$authenticatedBefore=Get-StatusBool $hostedBefore @('authenticated','agentAuthenticated','authenticated_heartbeat')
$heartbeatBefore=Get-StatusBool $hostedBefore @('heartbeatCurrent','pcOnline','pc_online')
$generationBound=[bool]($null -ne $storedGeneration -and $null -ne $currentGeneration -and $storedGeneration -eq $currentGeneration)
$reuseAgent=[bool]($null -ne $agentProcess -and -not $ForceRepair -and $heartbeatBefore -and $authenticatedBefore -and $generationBound)

if ($null -ne $agentProcess -and -not $reuseAgent) {
  $reason = if ($ForceRepair) {'operator or exact-SHA recovery requested'} elseif (-not $heartbeatBefore) {'hosted heartbeat stale or absent'} elseif (-not $authenticatedBefore) {'hosted heartbeat authentication incomplete'} elseif (-not $generationBound) {'hosted pairing generation changed or is not bound to this agent launch'} else {'hosted device proof incomplete'}
  Stop-OmegaAgent $agentProcess $reason
  $agentProcess=$null
}

if ($reuseAgent) {
  Write-OmegaLog "reusing sovereign agent pid=$($agentProcess.ProcessId) hosted_pairing_generation=$storedGeneration with current authenticated hosted heartbeat"
} else {
  Write-OmegaLog "requesting fresh hosted one-time pairing envelope from $HostedPairingEnvelope"
  Invoke-WebRequest -UseBasicParsing -Uri $HostedPairingEnvelope -OutFile $PairingEnvelope -TimeoutSec 30
  try {
    $pairingText=Get-Content -Raw $PairingEnvelope
    if ($pairingText -notmatch 'OMEGA Sovereign PC Link' -or $pairingText -notmatch '/api/hybrid/agent' -or $pairingText -notmatch 'omega_sovereign_agent\.py') { throw 'Hosted canonical runtime returned an invalid Hybrid pairing contract.' }
    $tokenMatch=[regex]::Match($pairingText,'set "OMEGA_TOKEN=([^"\r\n]+)"')
    $serverMatch=[regex]::Match($pairingText,'set "OMEGA_SERVER=([^"\r\n]+)"')
    if (-not $tokenMatch.Success -or -not $serverMatch.Success) { throw 'Hosted canonical pairing envelope is missing server or credential fields.' }
    $pairingToken=$tokenMatch.Groups[1].Value
    $pairedServer=$serverMatch.Groups[1].Value.TrimEnd('/')
  } finally { Remove-Item $PairingEnvelope -Force -ErrorAction SilentlyContinue }
  if (-not $pairedServer.StartsWith('http://') -and -not $pairedServer.StartsWith('https://')) { throw 'Hosted pairing server is not an HTTP(S) origin.' }
  $pairedStatus=Get-HostedHybridStatus
  $pairedGeneration=Get-StatusPairingGeneration $pairedStatus
  if ($null -eq $pairedGeneration) { throw 'Hosted pairing rotated but canonical Hybrid status did not expose a pairing generation.' }
  Set-Content $PairingGenerationFile -Value $pairedGeneration -Encoding ascii
  Write-OmegaLog "starting canonical sovereign agent with verified venv against hosted authority $pairedServer pairing_generation=$pairedGeneration"
  $agentArgs=@("`"$AgentScript`"",'--server',"`"$pairedServer`"",'--token',"`"$pairingToken`"",'--root',"`"$Root`"",'--interval','8')
  $agentProcess=Start-Process -FilePath $Vpy -ArgumentList $agentArgs -WorkingDirectory $Root -RedirectStandardOutput $AgentStdout -RedirectStandardError $AgentStderr -WindowStyle Hidden -PassThru
  Write-OmegaLog "sovereign agent process started pid=$($agentProcess.Id); PC ONLINE is still proof-gated"
}

$heartbeatCurrent=$false
for ($i=0; $i -lt 60; $i++) {
  $hosted=Get-HostedHybridStatus
  if ($null -ne $hosted) {
    $generation=Get-StatusPairingGeneration $hosted
    $expectedGeneration=Get-StoredPairingGeneration
    $generationCurrent=[bool]($null -ne $generation -and $null -ne $expectedGeneration -and $generation -eq $expectedGeneration)
    $authenticated=Get-StatusBool $hosted @('authenticated','agentAuthenticated','authenticated_heartbeat')
    $heartbeatSeen=Get-StatusBool $hosted @('heartbeatCurrent','pcOnline','pc_online')
    if ($heartbeatSeen -and $authenticated -and $generationCurrent) {
      $heartbeatCurrent=$true
      $ageProperty=$hosted.PSObject.Properties['heartbeatAgeSeconds']; if ($null -eq $ageProperty) { $ageProperty=$hosted.PSObject.Properties['heartbeat_age_seconds'] }
      $age=if ($null -ne $ageProperty) {$ageProperty.Value} else {'unknown'}
      Write-OmegaLog "authenticated hosted heartbeat current age=${age}s pairing_generation=$generation"
      break
    }
  }
  Start-Sleep -Milliseconds 500
}

if (-not $heartbeatCurrent) {
  $failedAgent=Get-OmegaAgentProcess
  if ($null -ne $failedAgent) { Stop-OmegaAgent $failedAgent 'current authenticated hosted generation-bound heartbeat did not arrive' }
  Remove-Item $PairingGenerationFile -Force -ErrorAction SilentlyContinue
  Write-OmegaLog 'localhost runtime is healthy but R211 hosted heartbeat recovery failed; PC ONLINE is not claimed and R209/R208 acceptance diagnostics are withheld'
  throw "OMEGA localhost runtime is healthy, but an authenticated hosted generation-bound heartbeat did not become current. Review $AgentStderr and $Log."
}

if (-not $SkipAcceptanceProof) {
  Write-OmegaLog 'running preserved R209 bounded convergence + R208/R181 truth + R210 archive after R211 hosted heartbeat recovery'
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $ConvergenceProver -ProductionBase $CloudBase -MaxAttempts 12 -DelaySeconds 5 -RootOverride $Root -R208ProverOverride $R208Prover -R210ArchiverOverride $R210Archiver
  $proofExit=$LASTEXITCODE
  if (Test-Path $AcceptanceReceipt) {
    try {
      $receipt=Get-Content -Raw $AcceptanceReceipt | ConvertFrom-Json
      $lastSha=''; if ($receipt.attempts.Count -gt 0) { $lastSha=[string]$receipt.attempts[$receipt.attempts.Count-1].canonicalGitSha }
      Write-OmegaLog "R209 convergence full=$($receipt.fullAcceptance) attempts=$($receipt.attemptsCompleted) action=$($receipt.recoveryAction) sha=$lastSha blockers=$($receipt.blockers -join ',')"
    } catch { Write-OmegaLog "R209 receipt parse failed: $($_.Exception.Message)" }
  }
  if ($proofExit -ne 0) { Write-OmegaLog "R209 convergence prover returned exit=$proofExit; hosted heartbeat remains proven but no acceptance success claim is promoted" }
} else {
  Write-OmegaLog 'R209/R208 deep acceptance diagnostics skipped for headless continuity launch; R211 current authenticated hosted heartbeat remains the PC ONLINE gate'
}

if (-not $NoBrowser) { Start-Process "$Base/" }
