param(
  [string]$ProductionBase = 'https://omegav6.jeffdeweyeljefe.workers.dev',
  [int]$MaxAttempts = 12,
  [int]$DelaySeconds = 5,
  [switch]$RequireFullAcceptance,
  [switch]$ReportOnly,
  [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Port = 8127
$LocalBase = "http://127.0.0.1:$Port"
$ProductionBase = $ProductionBase.TrimEnd('/')
$InitialRoot = Split-Path -Parent $PSScriptRoot
$Root = $InitialRoot
$RootPointer = Join-Path $env:LOCALAPPDATA 'OMEGA\canonical-root.txt'

function Test-OmegaRoot([string]$Candidate) {
  if (-not $Candidate) { return $false }
  return (Test-Path (Join-Path $Candidate 'scripts\LAUNCH_OMEGA_V6_WINDOWS.ps1')) -and
         (Test-Path (Join-Path $Candidate 'scripts\PROVE_OMEGA_V6_R209_WINDOWS.ps1')) -and
         (Test-Path (Join-Path $Candidate 'scripts\omega_sovereign_agent.py'))
}

if (-not (Test-OmegaRoot $Root) -and (Test-Path $RootPointer)) {
  $pointedRoot = (Get-Content -Raw -Path $RootPointer).Trim()
  if (Test-OmegaRoot $pointedRoot) { $Root = $pointedRoot }
}
if (-not (Test-OmegaRoot $Root)) {
  throw "Canonical OMEGA root could not be established from script location or $RootPointer"
}

$Scripts = Join-Path $Root 'scripts'
$LogDir = Join-Path $Root 'logs'
$Vpy = Join-Path $Root '.venv\Scripts\python.exe'
$Installer = Join-Path $Scripts 'INSTALL_OMEGA_V6_WINDOWS.ps1'
$Launcher = Join-Path $Scripts 'LAUNCH_OMEGA_V6_WINDOWS.ps1'
$R209 = Join-Path $Scripts 'PROVE_OMEGA_V6_R209_WINDOWS.ps1'
$R211 = Join-Path $Scripts 'INDEX_OMEGA_SOVEREIGN_PROOF_R211.ps1'
$R209Receipt = Join-Path $LogDir 'r209_sovereign_convergence_latest.json'
$R211Index = Join-Path $LogDir 'r211_sovereign_proof_index_latest.json'
$ReceiptPath = Join-Path $LogDir 'r221_sovereign_repair_latest.json'
$LogPath = Join-Path $LogDir 'r221_sovereign_repair.log'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Write-R221Log([string]$Message) {
  "$(Get-Date -Format o) $Message" | Tee-Object -FilePath $LogPath -Append
}

function Invoke-JsonGet([string]$Uri, [int]$TimeoutSec = 5) {
  try {
    return Invoke-RestMethod -Uri $Uri -TimeoutSec $TimeoutSec
  } catch {
    return $null
  }
}

function Get-LocalTruth {
  $health = Invoke-JsonGet "$LocalBase/api/health" 3
  $hybrid = Invoke-JsonGet "$LocalBase/api/hybrid/status" 3
  return [ordered]@{
    runtimeHealthy = ($null -ne $health -and [bool]$health.ok)
    authenticated = ($null -ne $hybrid -and [bool]$hybrid.authenticated)
    heartbeatCurrent = ($null -ne $hybrid -and [bool]$hybrid.heartbeatCurrent)
    pcOnline = ($null -ne $hybrid -and [bool]$hybrid.pcOnline)
    heartbeatAgeSeconds = if ($null -ne $hybrid -and $null -ne $hybrid.PSObject.Properties['heartbeatAgeSeconds']) { $hybrid.heartbeatAgeSeconds } else { $null }
  }
}

function Get-ListenerProcess {
  $listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $listener) { return $null }
  try {
    return Get-CimInstance Win32_Process -Filter "ProcessId = $($listener.OwningProcess)" -ErrorAction Stop
  } catch {
    return $null
  }
}

function Get-RootAgentProcess {
  try {
    return Get-CimInstance Win32_Process -ErrorAction Stop |
      Where-Object {
        $_.CommandLine -and
        $_.CommandLine -match 'omega_sovereign_agent\.py' -and
        $_.CommandLine -like "*$Root*"
      } |
      Select-Object -First 1
  } catch {
    return $null
  }
}

function Test-OwnedRuntimeProcess($Process) {
  if ($null -eq $Process) { return $false }
  $commandLine = [string]$Process.CommandLine
  return $commandLine -match 'omega_runtime\.cli' -and $commandLine -like "*$Root*"
}

function Stop-OwnedProcess($Process, [string]$Kind) {
  if ($null -eq $Process) { return }
  $pid = [int]$Process.ProcessId
  Write-R221Log "stopping stale owned $Kind process pid=$pid"
  Stop-Process -Id $pid -Force -ErrorAction Stop
  for ($i = 0; $i -lt 40; $i++) {
    if (-not (Get-Process -Id $pid -ErrorAction SilentlyContinue)) { return }
    Start-Sleep -Milliseconds 250
  }
  throw "Owned $Kind process pid=$pid did not stop within bounded wait."
}

function Get-RcwaTruth {
  if (-not (Test-Path $Vpy)) {
    return [ordered]@{ venvPresent = $false; available = $false; python = $null; error = 'OMEGA_VENV_MISSING' }
  }
  try {
    $version = (& $Vpy -c 'import platform; print(platform.python_version())' 2>$null | Select-Object -First 1)
    $raw = & $Vpy -m omega_runtime.rcwa_solver --probe 2>$null
    if ($LASTEXITCODE -ne 0) {
      return [ordered]@{ venvPresent = $true; available = $false; python = [string]$version; error = 'RCWA_PROBE_EXIT_NONZERO' }
    }
    $probe = ($raw -join "`n") | ConvertFrom-Json
    return [ordered]@{ venvPresent = $true; available = [bool]$probe.available; python = [string]$version; error = $null }
  } catch {
    return [ordered]@{ venvPresent = $true; available = $false; python = $null; error = $_.Exception.Message }
  }
}

function Get-HostSummary {
  $os = $null
  $cpu = $null
  $memGb = $null
  try { $os = Get-CimInstance Win32_OperatingSystem -ErrorAction Stop } catch {}
  try { $cpu = Get-CimInstance Win32_Processor -ErrorAction Stop | Select-Object -First 1 } catch {}
  if ($null -ne $os -and $null -ne $os.TotalVisibleMemorySize) {
    $memGb = [math]::Round(([double]$os.TotalVisibleMemorySize * 1KB) / 1GB, 2)
  }
  $rootDrive = [System.IO.Path]::GetPathRoot($Root)
  $drive = $null
  try { $drive = Get-PSDrive -Name $rootDrive.TrimEnd(':','\') -ErrorAction Stop } catch {}
  return [ordered]@{
    osCaption = if ($null -ne $os) { [string]$os.Caption } else { $null }
    osVersion = if ($null -ne $os) { [string]$os.Version } else { $null }
    architecture = $env:PROCESSOR_ARCHITECTURE
    cpu = if ($null -ne $cpu) { [string]$cpu.Name } else { $null }
    memoryGb = $memGb
    rootDrive = $rootDrive
    rootDriveFreeGb = if ($null -ne $drive) { [math]::Round(([double]$drive.Free / 1GB), 2) } else { $null }
  }
}

function Get-ProductionSummary {
  $manifest = Invoke-JsonGet "$ProductionBase/api/acceptance/r181/manifest" 20
  if ($null -eq $manifest) {
    return [ordered]@{ reachable = $false; canonicalGitSha = $null; deploymentIdentityBound = $false; schema = $null }
  }
  return [ordered]@{
    reachable = [bool]$manifest.ok
    canonicalGitSha = [string]$manifest.canonicalGitSha
    deploymentIdentityBound = [bool]$manifest.deploymentIdentityBound
    schema = [string]$manifest.schema
  }
}

function Save-Receipt([string]$State, [string[]]$Blockers, $Before, $After, $Rcwa, $Production, $Convergence, $Index) {
  $receipt = [ordered]@{
    schema = 'OMEGA_WINDOWS_SOVEREIGN_SELF_HEAL_R221'
    revision = 'R221'
    capturedAt = (Get-Date).ToUniversalTime().ToString('o')
    authority = 'LOCAL_OPERATOR_REPAIR_AND_PROOF_ORCHESTRATION_NOT_CANON'
    canonicalMutation = $false
    promotionAuthorized = $false
    state = $State
    blockers = @($Blockers)
    root = $Root
    canonicalPort = $Port
    reportOnly = [bool]$ReportOnly
    host = Get-HostSummary
    before = $Before
    after = $After
    rcwa = $Rcwa
    production = $Production
    convergence = $Convergence
    evidenceIndex = $Index
    boundaries = [ordered]@{
      foreignPortOwnerIsNeverKilled = $true
      onlyRootOwnedOmegaProcessesMayBeRestarted = $true
      pairingCredentialsAreNeverWrittenToThisReceipt = $true
      windowsCiIsPhysicalPcProof = $false
      physicalPcOnlineRequiresCurrentAuthenticatedHeartbeat = $true
      fullAcceptanceStillRequiresR181PhysicalHeartbeatAndB059Proof = $true
      providerWeightsAreOmegaTrained = $false
      repairDoesNotCreateCanonOrPromotionAuthority = $true
    }
  }
  $receipt | ConvertTo-Json -Depth 16 | Set-Content -Path $ReceiptPath -Encoding utf8
  return $receipt
}

Write-R221Log "R221 sovereign self-heal requested root=$Root reportOnly=$ReportOnly"
$before = Get-LocalTruth
$rcwa = Get-RcwaTruth
$production = Get-ProductionSummary

if (-not $ReportOnly) {
  if (-not [bool]$before.runtimeHealthy) {
    $listener = Get-ListenerProcess
    if ($null -ne $listener) {
      if (Test-OwnedRuntimeProcess $listener) {
        Stop-OwnedProcess $listener 'runtime'
      } else {
        $foreignPid = [int]$listener.ProcessId
        $foreignName = [string]$listener.Name
        $receipt = Save-Receipt 'BLOCKED_FOREIGN_PORT_OWNER' @('CANONICAL_PORT_8127_OWNED_BY_NON_OMEGA_PROCESS') $before $before $rcwa $production $null $null
        Write-Error "Port $Port is occupied by non-OMEGA process pid=$foreignPid name=$foreignName. It was NOT stopped. Receipt: $ReceiptPath"
        exit 21
      }
    }
  }

  if (-not [bool]$before.heartbeatCurrent -or -not [bool]$before.authenticated) {
    $agent = Get-RootAgentProcess
    if ($null -ne $agent) { Stop-OwnedProcess $agent 'sovereign-agent' }
  }

  if (-not [bool]$rcwa.venvPresent -or -not [bool]$rcwa.available) {
    if (-not (Test-Path $Installer)) { throw "Installer missing: $Installer" }
    Write-R221Log 'verified venv/RCWA incomplete; invoking governed installer'
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $Installer
    if ($LASTEXITCODE -ne 0) { throw "Governed installer failed with exit code $LASTEXITCODE" }
    Start-Sleep -Seconds 2
    $rcwa = Get-RcwaTruth
  }

  $localAfterInstall = Get-LocalTruth
  if (-not [bool]$localAfterInstall.runtimeHealthy -or -not [bool]$localAfterInstall.heartbeatCurrent -or -not [bool]$localAfterInstall.authenticated) {
    Write-R221Log 'invoking canonical R209 launcher for runtime + authenticated heartbeat convergence'
    $launchArgs = @('-NoProfile','-ExecutionPolicy','Bypass','-File',"`"$Launcher`"",'-NoBrowser','-SkipAcceptanceProof')
    & powershell.exe @launchArgs
  }
}

$after = Get-LocalTruth
if (-not $ReportOnly) {
  for ($i = 0; $i -lt 60; $i++) {
    $after = Get-LocalTruth
    if ([bool]$after.runtimeHealthy -and [bool]$after.authenticated -and [bool]$after.heartbeatCurrent) { break }
    Start-Sleep -Seconds 1
  }
}

$convergence = $null
$index = $null
if ([bool]$after.runtimeHealthy -and [bool]$after.authenticated -and [bool]$after.heartbeatCurrent -and -not $ReportOnly) {
  Write-R221Log 'local authenticated heartbeat proven; running bounded R209/R208/R181 acceptance convergence'
  $r209Args = @('-NoProfile','-ExecutionPolicy','Bypass','-File',"`"$R209`",'-MaxAttempts',"$MaxAttempts",'-DelaySeconds',"$DelaySeconds")
  if ($RequireFullAcceptance) { $r209Args += '-RequireFullAcceptance' }
  & powershell.exe @r209Args
  $r209Exit = $LASTEXITCODE
  if (Test-Path $R209Receipt) {
    try { $convergence = Get-Content -Raw -Path $R209Receipt | ConvertFrom-Json } catch { $convergence = $null }
  }
  if ((Test-Path $R211) -and (Test-Path (Join-Path $LogDir 'proof_archive'))) {
    try {
      & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $R211 -OutputPath $R211Index | Out-Null
      if ($LASTEXITCODE -eq 0 -and (Test-Path $R211Index)) {
        $rawIndex = Get-Content -Raw -Path $R211Index | ConvertFrom-Json
        $index = [ordered]@{
          schema = [string]$rawIndex.schema
          recordCount = [int]$rawIndex.recordCount
          fullAcceptanceRecordCount = [int]$rawIndex.fullAcceptanceRecordCount
          latestCanonicalGitSha = if ($null -ne $rawIndex.latest) { [string]$rawIndex.latest.canonicalGitSha } else { $null }
        }
      }
    } catch {
      Write-R221Log "R211 index refresh failed: $($_.Exception.Message)"
    }
  }
  if ($r209Exit -ne 0 -and $RequireFullAcceptance) {
    Write-R221Log "R209 required-full-acceptance exited $r209Exit"
  }
}

$production = Get-ProductionSummary
$blockers = @()
if (-not [bool]$after.runtimeHealthy) { $blockers += 'LOCAL_RUNTIME_UNHEALTHY' }
if (-not [bool]$after.authenticated) { $blockers += 'LOCAL_HYBRID_UNAUTHENTICATED' }
if (-not [bool]$after.heartbeatCurrent) { $blockers += 'LOCAL_HEARTBEAT_NOT_CURRENT' }
if (-not [bool]$rcwa.available) { $blockers += 'NATIVE_RCWA_UNAVAILABLE' }
if (-not [bool]$production.reachable) { $blockers += 'PRODUCTION_R181_UNREACHABLE' }
if ($null -ne $convergence -and -not [bool]$convergence.fullAcceptance) {
  foreach ($item in @($convergence.blockers)) {
    if ($item -and $blockers -notcontains [string]$item) { $blockers += [string]$item }
  }
}

$state = 'READY_FOR_PHYSICAL_ACCEPTANCE_PROOF'
if ($blockers.Count -gt 0) { $state = 'PARTIAL_REPAIR_BLOCKERS_REMAIN' }
if ($null -ne $convergence -and [bool]$convergence.fullAcceptance) { $state = 'FULL_PHYSICAL_SOVEREIGN_ACCEPTANCE_VERIFIED' }
if ($ReportOnly) { $state = 'REPORT_ONLY_NO_REPAIR_ATTEMPTED' }

$receipt = Save-Receipt $state $blockers $before $after $rcwa $production $convergence $index
Write-R221Log "R221 complete state=$state blockers=$($blockers -join ',') receipt=$ReceiptPath"
Write-Host "OMEGA R221 state: $state"
Write-Host "Local runtime/auth/current: $($after.runtimeHealthy) / $($after.authenticated) / $($after.heartbeatCurrent)"
Write-Host "Native RCWA: $($rcwa.available)"
Write-Host "Production R181 reachable: $($production.reachable) sha=$($production.canonicalGitSha)"
if ($null -ne $convergence) { Write-Host "R209 full acceptance: $($convergence.fullAcceptance)" }
Write-Host "Receipt: $ReceiptPath"

if ($RequireFullAcceptance -and $state -ne 'FULL_PHYSICAL_SOVEREIGN_ACCEPTANCE_VERIFIED') {
  Write-Error "R221 repaired everything it could safely repair, but physical full acceptance still has blockers: $($blockers -join ',')"
  exit 22
}

if (-not $NoBrowser -and [bool]$after.runtimeHealthy) {
  Start-Process "$LocalBase/"
}

exit 0
