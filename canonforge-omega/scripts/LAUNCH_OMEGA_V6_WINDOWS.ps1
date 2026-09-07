param(
  [switch]$NoBrowser,
  [switch]$SkipAcceptanceProof,
  [string]$RootOverride = '',
  [string]$AgentScriptOverride = '',
  [string]$AcceptanceProverOverride = '',
  [switch]$ForceRepair
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

if ($RootOverride) {
  $Root = (Resolve-Path $RootOverride).Path
} else {
  $Root = Split-Path -Parent $PSScriptRoot
}
$Vpy = Join-Path $Root '.venv\Scripts\python.exe'
$AgentScript = if ($AgentScriptOverride) { (Resolve-Path $AgentScriptOverride).Path } else { Join-Path $Root 'scripts\omega_sovereign_agent.py' }
$AcceptanceProver = if ($AcceptanceProverOverride) { (Resolve-Path $AcceptanceProverOverride).Path } else { Join-Path $Root 'scripts\PROVE_OMEGA_V6_WINDOWS.ps1' }
$LogDir = Join-Path $Root 'logs'
$RuntimeStdout = Join-Path $LogDir 'runtime_stdout.log'
$RuntimeStderr = Join-Path $LogDir 'runtime_stderr.log'
$AgentStdout = Join-Path $LogDir 'agent_stdout.log'
$AgentStderr = Join-Path $LogDir 'agent_stderr.log'
$Log = Join-Path $LogDir 'launcher.log'
$AcceptanceReceipt = Join-Path $LogDir 'r208_physical_acceptance_latest.json'
$Port = 8127
$Base = "http://127.0.0.1:$Port"
$Health = "$Base/api/health"
$HybridStatus = "$Base/api/hybrid/status"
$HybridLauncher = "$Base/api/hybrid/launcher"
$OmegaLocal = Join-Path $env:LOCALAPPDATA 'OMEGA'
$PairingGenerationFile = Join-Path $OmegaLocal 'agent-pairing-generation.txt'
$PairingEnvelope = Join-Path $OmegaLocal ("pairing-once-{0}.cmd" -f $PID)

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
New-Item -ItemType Directory -Force -Path $OmegaLocal | Out-Null

function Write-OmegaLog([string]$Text) {
  "$(Get-Date -Format o) $Text" | Out-File $Log -Append -Encoding utf8
}

function Get-HealthyOmegaRuntime {
  try {
    $r = Invoke-RestMethod -Uri $Health -TimeoutSec 2
    return [bool]$r.ok
  } catch {
    return $false
  }
}

function Get-HybridStatus {
  try {
    return Invoke-RestMethod -Uri $HybridStatus -TimeoutSec 2
  } catch {
    return $null
  }
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
  try {
    $raw = (Get-Content -Raw -Path $PairingGenerationFile).Trim()
    if (-not $raw) { return $null }
    return [int64]$raw
  } catch {
    Write-OmegaLog "pairing-generation sidecar unreadable: $($_.Exception.Message)"
    return $null
  }
}

function Get-OmegaAgentProcess {
  try {
    return Get-CimInstance Win32_Process -ErrorAction Stop |
      Where-Object {
        $_.CommandLine -and
        $_.CommandLine -match 'omega_sovereign_agent\.py' -and
        $_.CommandLine -like "*$Root*"
      } |
      Select-Object -First 1
  } catch {
    Write-OmegaLog "agent process inspection unavailable: $($_.Exception.Message)"
    return $null
  }
}

function Stop-OmegaAgent($Process, [string]$Reason) {
  if ($null -eq $Process) { return }
  Write-OmegaLog "stopping sovereign agent pid=$($Process.ProcessId) reason=$Reason"
  Stop-Process -Id $Process.ProcessId -Force -ErrorAction SilentlyContinue
  for ($i = 0; $i -lt 20; $i++) {
    if (-not (Get-Process -Id $Process.ProcessId -ErrorAction SilentlyContinue)) { return }
    Start-Sleep -Milliseconds 150
  }
  throw "OMEGA could not stop stale sovereign agent pid=$($Process.ProcessId)."
}

if (-not (Test-Path $Vpy)) {
  throw 'OMEGA .venv missing. Run INSTALL_OMEGA_V6_WINDOWS.ps1 first.'
}
if (-not (Test-Path $AgentScript)) {
  throw "Canonical sovereign agent missing: $AgentScript"
}
if (-not (Test-Path $AcceptanceProver)) {
  throw "R208 physical acceptance prover missing: $AcceptanceProver"
}

Write-OmegaLog "R209 launch requested root=$Root canonical_port=$Port force_repair=$ForceRepair"

$runtimeProcess = $null
if (Get-HealthyOmegaRuntime) {
  Write-OmegaLog "reusing healthy canonical localhost runtime on $Base"
} else {
  $busy = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  if ($busy) {
    throw "Port $Port is already occupied by a non-OMEGA service. OMEGA will not silently move the canonical Hybrid endpoint to another port. Stop the conflicting process and launch again."
  }

  Write-OmegaLog "starting canonical localhost runtime on $Base"
  $runtimeProcess = Start-Process -FilePath $Vpy `
    -ArgumentList @('-m','omega_runtime.cli','--host','127.0.0.1','--port',"$Port") `
    -WorkingDirectory $Root `
    -RedirectStandardOutput $RuntimeStdout `
    -RedirectStandardError $RuntimeStderr `
    -PassThru

  $ready = $false
  for ($i = 0; $i -lt 80; $i++) {
    if ($runtimeProcess.HasExited) { break }
    if (Get-HealthyOmegaRuntime) { $ready = $true; break }
    Start-Sleep -Milliseconds 250
  }
  if (-not $ready) {
    Write-OmegaLog "runtime launch failed pid=$($runtimeProcess.Id)"
    throw "OMEGA runtime did not become healthy on canonical port $Port. Review $RuntimeStderr"
  }
  Write-OmegaLog "runtime healthy pid=$($runtimeProcess.Id)"
}

$agentProcess = Get-OmegaAgentProcess
$hybridBefore = Get-HybridStatus
$storedGeneration = Get-StoredPairingGeneration
$currentGeneration = Get-StatusPairingGeneration $hybridBefore
$authenticatedBefore = Get-StatusBool $hybridBefore @('authenticated','agentAuthenticated','authenticated_heartbeat')
$heartbeatBefore = Get-StatusBool $hybridBefore @('heartbeatCurrent','pcOnline','pc_online')
$generationBound = [bool]($null -ne $storedGeneration -and $null -ne $currentGeneration -and $storedGeneration -eq $currentGeneration)
$reuseAgent = [bool]($null -ne $agentProcess -and -not $ForceRepair -and $heartbeatBefore -and $authenticatedBefore -and $generationBound)

if ($null -ne $agentProcess -and -not $reuseAgent) {
  $reason = if ($ForceRepair) {
    'operator or exact-SHA recovery requested'
  } elseif (-not $heartbeatBefore) {
    'heartbeat stale or absent'
  } elseif (-not $authenticatedBefore) {
    'heartbeat authentication incomplete'
  } elseif (-not $generationBound) {
    'pairing generation changed or is not bound to this agent launch'
  } else {
    'device proof incomplete'
  }
  Stop-OmegaAgent $agentProcess $reason
  $agentProcess = $null
}

if ($reuseAgent) {
  Write-OmegaLog "reusing sovereign agent pid=$($agentProcess.ProcessId) pairing_generation=$storedGeneration with current authenticated heartbeat"
} else {
  # Localhost remains the pairing authority. The generated batch is consumed only as a
  # one-time credential envelope, deleted immediately, and never executed. The agent is
  # always started by OMEGA's verified venv. R209 persists only non-secret generation data.
  Write-OmegaLog 'requesting fresh one-time pairing envelope from local sovereign runtime'
  Invoke-WebRequest -UseBasicParsing -Uri $HybridLauncher -OutFile $PairingEnvelope -TimeoutSec 15
  try {
    $pairingText = Get-Content -Raw -Path $PairingEnvelope
    if ($pairingText -notmatch 'OMEGA Sovereign PC Link' -or
        $pairingText -notmatch '/api/hybrid/agent' -or
        $pairingText -notmatch 'omega_sovereign_agent\.py') {
      throw 'Local sovereign runtime returned an invalid Hybrid pairing contract.'
    }

    $tokenMatch = [regex]::Match($pairingText, 'set "OMEGA_TOKEN=([^"\r\n]+)"')
    $serverMatch = [regex]::Match($pairingText, 'set "OMEGA_SERVER=([^"\r\n]+)"')
    if (-not $tokenMatch.Success -or -not $serverMatch.Success) {
      throw 'Local sovereign runtime pairing envelope is missing server or credential fields.'
    }
    $pairingToken = $tokenMatch.Groups[1].Value
    $pairedServer = $serverMatch.Groups[1].Value
  } finally {
    Remove-Item $PairingEnvelope -Force -ErrorAction SilentlyContinue
  }

  $pairedStatus = Get-HybridStatus
  $pairedGeneration = Get-StatusPairingGeneration $pairedStatus
  if ($null -eq $pairedGeneration) {
    throw 'OMEGA pairing rotated but the local runtime did not expose a pairing generation.'
  }
  Set-Content -Path $PairingGenerationFile -Value $pairedGeneration -Encoding ascii

  Write-OmegaLog "starting canonical sovereign agent with verified venv against $pairedServer pairing_generation=$pairedGeneration"
  $agentArgs = @(
    "`"$AgentScript`"",
    '--server', "`"$pairedServer`"",
    '--token', "`"$pairingToken`"",
    '--root', "`"$Root`"",
    '--interval', '8'
  )
  $agentProcess = Start-Process -FilePath $Vpy `
    -ArgumentList $agentArgs `
    -WorkingDirectory $Root `
    -RedirectStandardOutput $AgentStdout `
    -RedirectStandardError $AgentStderr `
    -WindowStyle Hidden `
    -PassThru
  Write-OmegaLog "sovereign agent process started pid=$($agentProcess.Id); PC ONLINE is still proof-gated"
}

$heartbeatCurrent = $false
for ($i = 0; $i -lt 50; $i++) {
  $hybrid = Get-HybridStatus
  if ($null -ne $hybrid) {
    $generation = Get-StatusPairingGeneration $hybrid
    $expectedGeneration = Get-StoredPairingGeneration
    $generationCurrent = [bool]($null -ne $generation -and $null -ne $expectedGeneration -and $generation -eq $expectedGeneration)
    $authenticated = Get-StatusBool $hybrid @('authenticated','agentAuthenticated','authenticated_heartbeat')
    $heartbeatSeen = Get-StatusBool $hybrid @('heartbeatCurrent','pcOnline','pc_online')
    if ($heartbeatSeen -and $authenticated -and $generationCurrent) {
      $heartbeatCurrent = $true
      $ageProperty = $hybrid.PSObject.Properties['heartbeatAgeSeconds']
      $age = if ($null -ne $ageProperty) { $ageProperty.Value } else { 'unknown' }
      Write-OmegaLog "authenticated heartbeat current age=${age}s pairing_generation=$generation"
      break
    }
  }
  Start-Sleep -Milliseconds 500
}

if (-not $heartbeatCurrent) {
  $failedAgent = Get-OmegaAgentProcess
  if ($null -ne $failedAgent) { Stop-OmegaAgent $failedAgent 'current authenticated generation-bound heartbeat did not arrive' }
  Remove-Item $PairingGenerationFile -Force -ErrorAction SilentlyContinue
  Write-OmegaLog 'runtime is healthy but R209 heartbeat recovery failed; PC ONLINE is not claimed and R208 deep acceptance is withheld'
  throw "OMEGA runtime is healthy, but an authenticated generation-bound heartbeat did not become current. Review $AgentStderr and $Log."
}

if (-not $SkipAcceptanceProof) {
  # Preserve the complete R208 closure. R209 only strengthens the prerequisite heartbeat.
  # The prover remains evidence-only and cannot mutate Canon or authorize promotion.
  Write-OmegaLog 'running preserved R208 physical sovereign acceptance proof after R209 heartbeat recovery'
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $AcceptanceProver -RootOverride $Root
  $proofExit = $LASTEXITCODE
  if (Test-Path $AcceptanceReceipt) {
    try {
      $receipt = Get-Content -Raw -Path $AcceptanceReceipt | ConvertFrom-Json
      Write-OmegaLog "R208 acceptance receipt full=$($receipt.fullAcceptance) state=$($receipt.acceptanceState) sha=$($receipt.production.canonicalGitSha) upstream=$($receipt.upstreamReceiptSha256)"
    } catch {
      Write-OmegaLog "R208 receipt parse failed: $($_.Exception.Message)"
    }
  }
  if ($proofExit -ne 0) {
    Write-OmegaLog "R208 acceptance prover returned exit=$proofExit; heartbeat remains proven but no full-acceptance success claim is promoted"
  }
} else {
  Write-OmegaLog 'R208 deep acceptance proof skipped for headless continuity launch; R209 current authenticated heartbeat remains the only PC ONLINE gate'
}

if (-not $NoBrowser) {
  Start-Process "$Base/"
}
