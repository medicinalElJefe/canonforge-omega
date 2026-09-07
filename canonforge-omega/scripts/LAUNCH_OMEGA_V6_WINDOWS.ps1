param(
  [switch]$NoBrowser,
  [switch]$SkipAcceptanceProof
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $PSScriptRoot
$Vpy = Join-Path $Root '.venv\Scripts\python.exe'
$AgentScript = Join-Path $Root 'scripts\omega_sovereign_agent.py'
$AcceptanceProver = Join-Path $Root 'scripts\PROVE_OMEGA_V6_WINDOWS.ps1'
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
$PairingEnvelope = Join-Path $Root '.omega_pairing_once.cmd'

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

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

if (-not (Test-Path $Vpy)) {
  throw 'OMEGA .venv missing. Run INSTALL_OMEGA_V6_WINDOWS.ps1 first.'
}
if (-not (Test-Path $AgentScript)) {
  throw "Canonical sovereign agent missing: $AgentScript"
}
if (-not (Test-Path $AcceptanceProver)) {
  throw "R208 physical acceptance prover missing: $AcceptanceProver"
}

Write-OmegaLog "R208 launch requested root=$Root canonical_port=$Port"

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
if ($agentProcess) {
  Write-OmegaLog "reusing sovereign agent pid=$($agentProcess.ProcessId)"
} else {
  # Ask the local sovereign runtime to rotate pairing, but do not execute the generated
  # batch file. R206 showed why that is fragile: a downloaded batch may select a system
  # Python instead of OMEGA's verified venv. R207 consumes only the one-time credential
  # envelope and starts the canonical repository agent with the exact verified venv.
  Write-OmegaLog 'requesting one-time pairing envelope from local sovereign runtime'
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
    # Pairing credentials are one-time operational material; do not leave the generated
    # credential-bearing launcher at rest after the canonical process has consumed it.
    Remove-Item $PairingEnvelope -Force -ErrorAction SilentlyContinue
  }

  Write-OmegaLog "starting canonical sovereign agent with verified venv against $pairedServer"
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
for ($i = 0; $i -lt 40; $i++) {
  try {
    $hybrid = Invoke-RestMethod -Uri $HybridStatus -TimeoutSec 2
    if ($hybrid.heartbeatCurrent -or $hybrid.pcOnline) {
      $heartbeatCurrent = $true
      $age = if ($null -ne $hybrid.heartbeatAgeSeconds) { $hybrid.heartbeatAgeSeconds } else { 'unknown' }
      Write-OmegaLog "authenticated heartbeat current age=${age}s"
      break
    }
  } catch {
    Write-OmegaLog "hybrid status probe pending: $($_.Exception.Message)"
  }
  Start-Sleep -Milliseconds 500
}

if (-not $heartbeatCurrent) {
  Write-OmegaLog 'runtime is healthy; sovereign heartbeat is still pending and is not being promoted to PC ONLINE'
} elseif (-not $SkipAcceptanceProof) {
  # R208 closes the one-click loop after the heartbeat is current. This probe is read/proof
  # oriented: it cannot mutate Canon or authorize promotion. Full acceptance still requires
  # the production R181 conjunction of current authenticated physical heartbeat, exact deep
  # B059 verification, and a grounded B059 query.
  Write-OmegaLog 'running R208 physical sovereign acceptance proof against deployed production truth'
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $AcceptanceProver
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
    Write-OmegaLog "R208 acceptance prover returned exit=$proofExit; no success claim promoted"
  }
} else {
  Write-OmegaLog 'R208 deep acceptance proof skipped for headless continuity launch; current heartbeat remains the only PC ONLINE gate'
}

if (-not $NoBrowser) {
  Start-Process "$Base/"
}
