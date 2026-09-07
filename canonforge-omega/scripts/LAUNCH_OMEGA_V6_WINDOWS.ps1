param(
  [switch]$NoBrowser,
  [string]$RootOverride = '',
  [string]$AgentScriptOverride = '',
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
$LogDir = Join-Path $Root 'logs'
$RuntimeStdout = Join-Path $LogDir 'runtime_stdout.log'
$RuntimeStderr = Join-Path $LogDir 'runtime_stderr.log'
$AgentStdout = Join-Path $LogDir 'agent_stdout.log'
$AgentStderr = Join-Path $LogDir 'agent_stderr.log'
$Log = Join-Path $LogDir 'launcher.log'
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
  if (-not $Process) { return }
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

Write-OmegaLog "R208 launch requested root=$Root canonical_port=$Port force_repair=$ForceRepair"

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
$currentGeneration = if ($hybridBefore -and $null -ne $hybridBefore.pairingGeneration) { [int64]$hybridBefore.pairingGeneration } else { $null }
$authenticatedBefore = [bool]($hybridBefore -and ($hybridBefore.authenticated -or $hybridBefore.agentAuthenticated))
$heartbeatBefore = [bool]($hybridBefore -and ($hybridBefore.heartbeatCurrent -or $hybridBefore.pcOnline))
$generationBound = [bool]($null -ne $storedGeneration -and $null -ne $currentGeneration -and $storedGeneration -eq $currentGeneration)
$reuseAgent = [bool]($agentProcess -and -not $ForceRepair -and $heartbeatBefore -and $authenticatedBefore -and $generationBound)

if ($agentProcess -and -not $reuseAgent) {
  $reason = if ($ForceRepair) { 'operator/canonical repair requested' } elseif (-not $heartbeatBefore) { 'heartbeat stale or absent' } elseif (-not $authenticatedBefore) { 'heartbeat not authenticated' } elseif (-not $generationBound) { 'pairing generation changed or unbound' } else { 'proof incomplete' }
  Stop-OmegaAgent $agentProcess $reason
  $agentProcess = $null
}

if ($reuseAgent) {
  Write-OmegaLog "reusing sovereign agent pid=$($agentProcess.ProcessId) pairing_generation=$storedGeneration with current authenticated heartbeat"
} else {
  # The local R207/R208 sovereign runtime still exposes the credential-bearing launcher as
  # a one-time pairing envelope. R208 consumes it only as data, immediately deletes it,
  # records the non-secret generation, and starts the canonical agent with the verified venv.
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
  if (-not $pairedStatus -or $null -eq $pairedStatus.pairingGeneration) {
    throw 'OMEGA pairing rotated but the local runtime did not expose a pairing generation.'
  }
  $pairedGeneration = [int64]$pairedStatus.pairingGeneration
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
  if ($hybrid) {
    $generation = if ($null -ne $hybrid.pairingGeneration) { [int64]$hybrid.pairingGeneration } else { $null }
    $expectedGeneration = Get-StoredPairingGeneration
    $generationCurrent = [bool]($null -ne $generation -and $null -ne $expectedGeneration -and $generation -eq $expectedGeneration)
    $authenticated = [bool]($hybrid.authenticated -or $hybrid.agentAuthenticated)
    if (($hybrid.heartbeatCurrent -or $hybrid.pcOnline) -and $authenticated -and $generationCurrent) {
      $heartbeatCurrent = $true
      $age = if ($null -ne $hybrid.heartbeatAgeSeconds) { $hybrid.heartbeatAgeSeconds } else { 'unknown' }
      Write-OmegaLog "authenticated heartbeat current age=${age}s pairing_generation=$generation"
      break
    }
  }
  Start-Sleep -Milliseconds 500
}

if (-not $heartbeatCurrent) {
  $failedAgent = Get-OmegaAgentProcess
  if ($failedAgent) { Stop-OmegaAgent $failedAgent 'new/current heartbeat proof did not arrive' }
  Remove-Item $PairingGenerationFile -Force -ErrorAction SilentlyContinue
  Write-OmegaLog 'runtime is healthy but sovereign heartbeat recovery failed; PC ONLINE is not claimed'
  throw "OMEGA runtime is healthy, but an authenticated generation-bound heartbeat did not become current. Review $AgentStderr and $Log."
}

if (-not $NoBrowser) {
  Start-Process "$Base/"
}
