$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $PSScriptRoot
$Vpy = Join-Path $Root '.venv\Scripts\python.exe'
$LogDir = Join-Path $Root 'logs'
$RuntimeStdout = Join-Path $LogDir 'runtime_stdout.log'
$RuntimeStderr = Join-Path $LogDir 'runtime_stderr.log'
$Log = Join-Path $LogDir 'launcher.log'
$Port = 8127
$Base = "http://127.0.0.1:$Port"
$Health = "$Base/api/health"
$HybridStatus = "$Base/api/hybrid/status"
$HybridLauncher = "$Base/api/hybrid/launcher"
$AgentLauncher = Join-Path $Root 'START_OMEGA_PC_LINK.cmd'

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

Write-OmegaLog "R206 launch requested root=$Root canonical_port=$Port"

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
  Write-OmegaLog "requesting fresh one-time pairing launcher from local sovereign runtime"
  Invoke-WebRequest -UseBasicParsing -Uri $HybridLauncher -OutFile $AgentLauncher -TimeoutSec 15
  $launcherText = Get-Content -Raw -Path $AgentLauncher
  if ($launcherText -notmatch 'OMEGA Sovereign PC Link' -or
      $launcherText -notmatch '/api/hybrid/agent' -or
      $launcherText -notmatch 'omega_sovereign_agent\.py') {
    Remove-Item $AgentLauncher -Force -ErrorAction SilentlyContinue
    throw 'Local sovereign runtime returned an invalid Hybrid launcher contract.'
  }

  # The generated launcher derives OMEGA_ROOT from its own directory.
  # Saving it in $Root binds heartbeat proof to the approved repository root
  # instead of accidentally treating Downloads/Desktop as the sovereign root.
  Write-OmegaLog "starting authenticated sovereign agent from root-bound launcher $AgentLauncher"
  Start-Process -FilePath $env:ComSpec `
    -ArgumentList @('/d','/c',"`"$AgentLauncher`"") `
    -WorkingDirectory $Root `
    -WindowStyle Minimized | Out-Null
}

$heartbeatCurrent = $false
for ($i = 0; $i -lt 24; $i++) {
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
}

Start-Process "$Base/"
