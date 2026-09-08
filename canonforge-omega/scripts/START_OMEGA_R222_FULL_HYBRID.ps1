param(
  [string]$ProductionBase = 'https://omegav6.jeffdeweyeljefe.workers.dev',
  [switch]$Headless,
  [switch]$NoBrowser,
  [switch]$SkipDevelopment
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$ProductionBase = $ProductionBase.TrimEnd('/')
$MutexName = 'Global\OMEGA_R222_FULL_HYBRID_SINGLE_INSTANCE'
$Mutex = New-Object System.Threading.Mutex($false, $MutexName)
$HasMutex = $false

function Write-Step([string]$Text) {
  Write-Host $Text
}

try {
  try {
    $HasMutex = $Mutex.WaitOne(0, $false)
  } catch [System.Threading.AbandonedMutexException] {
    $HasMutex = $true
  }
  if (-not $HasMutex) {
    Write-Host 'OMEGA R222 is already starting or repairing on this PC. No duplicate launcher was started.'
    exit 0
  }

  $Root = if ($env:OMEGA_ROOT_OVERRIDE) { $env:OMEGA_ROOT_OVERRIDE } else { Split-Path -Parent $PSScriptRoot }
  $Root = [System.IO.Path]::GetFullPath($Root)
  if (-not (Test-Path (Join-Path $Root 'pyproject.toml'))) { throw "Canonical root is invalid: $Root" }
  if (-not (Test-Path (Join-Path $Root 'scripts\omega_sovereign_agent.py'))) { throw "Canonical sovereign agent is missing under $Root" }

  $OmegaHome = Join-Path $env:LOCALAPPDATA 'OMEGA'
  $LogDir = Join-Path $OmegaHome 'r222'
  $ReceiptPath = Join-Path $LogDir 'r222_physical_hybrid_latest.json'
  $RootPointer = Join-Path $OmegaHome 'canonical-root.txt'
  $RuntimeOut = Join-Path $LogDir 'runtime_stdout.log'
  $RuntimeErr = Join-Path $LogDir 'runtime_stderr.log'
  $AgentOut = Join-Path $LogDir 'agent_stdout.log'
  $AgentErr = Join-Path $LogDir 'agent_stderr.log'
  New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
  Set-Content -Path $RootPointer -Value $Root -Encoding utf8

  $Vpy = Join-Path $Root '.venv\Scripts\python.exe'
  $AgentScript = Join-Path $Root 'scripts\omega_sovereign_agent.py'
  $Port = 8127
  $LocalBase = "http://127.0.0.1:$Port"

  Write-Host '============================================================'
  Write-Host 'OMEGA R222 FULL HYBRID - SINGLE INSTANCE / OUTBOUND LINK'
  Write-Host '============================================================'
  Write-Host "Canonical cloud: $ProductionBase"
  Write-Host "Approved root:   $Root"
  Write-Host ''

  Write-Step '[1/9] Verifying one canonical local runtime identity...'
  function Get-LocalHealth {
    try { return Invoke-RestMethod -Uri "$LocalBase/api/health" -TimeoutSec 2 } catch { return $null }
  }
  function Get-CloudHybrid {
    try { return Invoke-RestMethod -Uri "$ProductionBase/api/hybrid/status" -TimeoutSec 8 } catch { return $null }
  }
  function Get-ListenerProcess {
    $listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $listener) { return $null }
    try { return Get-CimInstance Win32_Process -Filter "ProcessId = $($listener.OwningProcess)" -ErrorAction Stop } catch { return $null }
  }
  function Test-OwnedRuntime($Process) {
    if ($null -eq $Process) { return $false }
    $cmd = [string]$Process.CommandLine
    $exe = [string]$Process.ExecutablePath
    return ($cmd -match 'omega_runtime\.cli') -and (($exe -and ([System.IO.Path]::GetFullPath($exe) -eq [System.IO.Path]::GetFullPath($Vpy))) -or $cmd -like "*$Root*")
  }
  function Get-OwnedAgents {
    try {
      return @(Get-CimInstance Win32_Process -ErrorAction Stop | Where-Object {
        $_.CommandLine -and $_.CommandLine -match 'omega_sovereign_agent\.py' -and $_.CommandLine -like "*$Root*"
      })
    } catch { return @() }
  }
  function Stop-OwnedAgents {
    foreach ($p in @(Get-OwnedAgents)) {
      try { Stop-Process -Id ([int]$p.ProcessId) -Force -ErrorAction Stop } catch {}
    }
    Start-Sleep -Milliseconds 350
  }

  $health = Get-LocalHealth
  if ($null -eq $health -or -not [bool]$health.ok) {
    $listener = Get-ListenerProcess
    if ($null -ne $listener -and -not (Test-OwnedRuntime $listener)) {
      throw "Canonical port 8127 is owned by a non-OMEGA or different-root process (PID $($listener.ProcessId)). R222 will not kill it or start a duplicate runtime."
    }
  }

  Write-Step '[2/9] Verifying Python / Node / Git toolchain and native RCWA...'
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'Git is required.' }
  if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw 'Node.js/npm is required.' }
  if (-not (Get-Command npx -ErrorAction SilentlyContinue)) { throw 'npx is required.' }

  if (-not (Test-Path $Vpy)) {
    $py = $null
    foreach ($candidate in @('3.12','3.11','3.10')) {
      if (Get-Command py -ErrorAction SilentlyContinue) {
        & py "-$candidate" -c "import sys; raise SystemExit(0 if sys.version_info >= (3,10) else 1)" *> $null
        if ($LASTEXITCODE -eq 0) { $py = @('py', "-$candidate"); break }
      }
    }
    if (-not $py -and (Get-Command python -ErrorAction SilentlyContinue)) {
      & python -c "import sys; raise SystemExit(0 if sys.version_info >= (3,10) else 1)" *> $null
      if ($LASTEXITCODE -eq 0) { $py = @('python') }
    }
    if (-not $py) { throw 'Python 3.10+ is required.' }
    if ($py.Count -eq 2) { & $py[0] $py[1] -m venv (Join-Path $Root '.venv') } else { & $py[0] -m venv (Join-Path $Root '.venv') }
    if ($LASTEXITCODE -ne 0) { throw 'OMEGA virtual environment creation failed.' }
  }

  & $Vpy -c "import omega_runtime, grcwa" *> $null
  if ($LASTEXITCODE -ne 0) {
    & $Vpy -m pip install --upgrade pip
    if ($LASTEXITCODE -ne 0) { throw 'pip upgrade failed.' }
    & $Vpy -m pip install -e "$Root[dev,rcwa]"
    if ($LASTEXITCODE -ne 0) { throw 'OMEGA dependencies failed to install.' }
  }
  $rcwaRaw = & $Vpy -m omega_runtime.rcwa_solver --probe
  if ($LASTEXITCODE -ne 0 -or ($rcwaRaw -join "`n") -notmatch '"available"\s*:\s*true') {
    throw 'Native grcwa RCWA probe failed. No fallback is promoted as RCWA.'
  }

  Write-Step '[3/9] Starting or reusing exactly one localhost runtime...'
  if ($null -eq (Get-LocalHealth)) {
    if (-not $env:OMEGA_GATEWAY_TOKEN) {
      $userKey = [Environment]::GetEnvironmentVariable('OMEGA_GATEWAY_TOKEN', 'User')
      $machineKey = [Environment]::GetEnvironmentVariable('OMEGA_GATEWAY_TOKEN', 'Machine')
      if ($userKey) { $env:OMEGA_GATEWAY_TOKEN = $userKey }
      elseif ($machineKey) { $env:OMEGA_GATEWAY_TOKEN = $machineKey }
    }
    $env:OMEGA_APPROVED_ROOT = $Root
    $runtime = Start-Process -FilePath $Vpy -ArgumentList @('-m','omega_runtime.cli','--host','127.0.0.1','--port',"$Port") -WorkingDirectory $Root -RedirectStandardOutput $RuntimeOut -RedirectStandardError $RuntimeErr -WindowStyle Hidden -PassThru
    $ready = $false
    for ($i = 0; $i -lt 80; $i++) {
      if ($runtime.HasExited) { break }
      $health = Get-LocalHealth
      if ($null -ne $health -and [bool]$health.ok) { $ready = $true; break }
      Start-Sleep -Milliseconds 250
    }
    if (-not $ready) { throw "Local runtime did not become healthy. Review $RuntimeErr" }
  }

  $existingCloud = Get-CloudHybrid
  $existingAgents = @(Get-OwnedAgents)
  if ($Headless -and $existingAgents.Count -eq 1 -and $null -ne $existingCloud -and [bool]$existingCloud.heartbeatCurrent -and [bool]$existingCloud.authenticated) {
    Write-Step '[4/9] Existing authenticated outbound agent is current. Reusing it; no duplicate was started.'
    $receipt = [ordered]@{
      schema = 'OMEGA_R222_PHYSICAL_HYBRID_RECEIPT'
      state = 'EXISTING_SINGLE_INSTANCE_REUSED'
      capturedAt = (Get-Date).ToUniversalTime().ToString('o')
      approvedRoot = $Root
      cloudHeartbeatCurrent = $true
      cloudAuthenticated = $true
      localExecutionAuthorityRequested = $false
      nativeRcwa = $true
      duplicateLauncherStarted = $false
      inboundCloudToPcRequired = $false
    }
    $receipt | ConvertTo-Json -Depth 10 | Set-Content -Path $ReceiptPath -Encoding utf8
    exit 0
  }

  Write-Step '[4/9] Reconciling stale/duplicate owned agents before rotating enrollment...'
  Stop-OwnedAgents

  Write-Step '[5/9] Minting localhost-signed outbound enrollment proof...'
  $localContract = Invoke-RestMethod -Uri "$LocalBase/api/hybrid/r222/local-contract" -TimeoutSec 8
  if (-not [bool]$localContract.gatewayEnrollmentKeyConfigured) {
    throw 'LOCAL ENROLLMENT KEY MISSING: OMEGA_GATEWAY_TOKEN is not configured for the localhost runtime. R222 refuses insecure unsigned pairing.'
  }
  $enrollment = Invoke-RestMethod -Uri "$LocalBase/api/hybrid/enrollment" -TimeoutSec 8
  if (-not [bool]$enrollment.ok -or -not $enrollment.token -or -not $enrollment.signature) { throw 'Local outbound enrollment packet was incomplete.' }

  $enrollBody = [ordered]@{
    schema = [string]$enrollment.schema
    issuedAt = [int64]$enrollment.issuedAt
    expiresAt = [int64]$enrollment.expiresAt
    nonce = [string]$enrollment.nonce
    deviceId = [string]$enrollment.deviceId
    approvedRoot = [string]$enrollment.approvedRoot
    token = [string]$enrollment.token
    tokenSha256 = [string]$enrollment.tokenSha256
    signature = [string]$enrollment.signature
  } | ConvertTo-Json -Compress
  $cloudEnroll = Invoke-RestMethod -Method Post -Uri "$ProductionBase/api/hybrid/enroll" -ContentType 'application/json' -Body $enrollBody -TimeoutSec 20
  if (-not [bool]$cloudEnroll.ok) { throw 'Cloud refused the signed outbound enrollment packet.' }
  $Token = [string]$enrollment.token
  $DeviceId = [string]$enrollment.deviceId

  Write-Step '[6/9] Starting exactly one hidden sovereign outbound agent...'
  $agentArgs = @(
    "`"$AgentScript`"",
    '--server', "`"$ProductionBase`"",
    '--token', "`"$Token`"",
    '--root', "`"$Root`"",
    '--agent-id', "`"$DeviceId`"",
    '--interval', '8'
  )
  $agent = Start-Process -FilePath $Vpy -ArgumentList $agentArgs -WorkingDirectory $Root -RedirectStandardOutput $AgentOut -RedirectStandardError $AgentErr -WindowStyle Hidden -PassThru
  $linked = $false
  $hybrid = $null
  for ($i = 0; $i -lt 50; $i++) {
    $hybrid = Get-CloudHybrid
    if ($null -ne $hybrid -and [bool]$hybrid.heartbeatCurrent -and [bool]$hybrid.authenticated -and [bool]$hybrid.pcOnline -and $hybrid.proof.agent_id -eq $DeviceId) {
      $linked = $true
      break
    }
    if ($agent.HasExited) { break }
    Start-Sleep -Milliseconds 600
  }
  if (-not $linked) { throw "Outbound agent did not establish current authenticated cloud heartbeat. Review $AgentErr" }

  Write-Step '[7/9] Hybrid link is authenticated. Connection is not execution authority.'
  $GrantExecution = $false
  if (-not $Headless) {
    $answer = Read-Host 'Grant governed native development execution on this PC for up to 4 hours? [y/N]'
    $GrantExecution = @('y','yes') -contains $answer.Trim().ToLowerInvariant()
  }

  $authority = $null
  $continuity = $null
  if ($GrantExecution) {
    $headers = @{ 'x-omega-agent-token' = $Token }
    $grantBody = @{
      localApproval = $true
      approvalMethod = 'LOCAL_R222_ONE_CLICK_EXPLICIT_YES'
      deviceId = $DeviceId
      approvedRoot = $Root
      expiresSeconds = 14400
    } | ConvertTo-Json -Compress
    $authority = Invoke-RestMethod -Method Post -Uri "$ProductionBase/api/hybrid/authority/grant" -Headers $headers -ContentType 'application/json' -Body $grantBody -TimeoutSec 15
    if (-not [bool]$authority.active) { throw 'Local execution authority grant was not admitted by the cloud control plane.' }

    if (-not $SkipDevelopment) {
      Write-Step '[8/9] Starting the bounded durable development loop...'
      $modeBody = @{ mode = 'DEVELOPMENT_LOOP' } | ConvertTo-Json -Compress
      $mode = Invoke-RestMethod -Method Post -Uri "$ProductionBase/api/development/mode" -Headers $headers -ContentType 'application/json' -Body $modeBody -TimeoutSec 15
      if ($mode.mode -ne 'DEVELOPMENT_LOOP') { throw 'Durable development loop did not enter DEVELOPMENT_LOOP mode.' }

      $verified = $false
      for ($i = 0; $i -lt 120; $i++) {
        try {
          $dev = Invoke-RestMethod -Uri "$ProductionBase/api/development/status" -TimeoutSec 8
          $recent = @($dev.recent_jobs)
          $lastVerified = @($recent | Where-Object { $_.state -eq 'VERIFIED' -and $null -ne $_.evidence } | Select-Object -Last 1)
          $active = $dev.active_job
          if ($lastVerified.Count -gt 0 -and $null -ne $active -and $active.id -ne $lastVerified[0].id) {
            $verified = $true
            $continuity = [ordered]@{ verifiedHostJob = $lastVerified[0]; nextActiveJob = $active; continuityProven = $true }
            break
          }
        } catch {}
        Start-Sleep -Seconds 1
      }
      if (-not $verified) {
        $dev = $null
        try { $dev = Invoke-RestMethod -Uri "$ProductionBase/api/development/status" -TimeoutSec 8 } catch {}
        $continuity = [ordered]@{ continuityProven = $false; development = $dev; boundary = 'Hybrid link and local authority are active; a verified host return followed by a different next stage was not yet observed inside the setup wait window.' }
      }
    }
  } else {
    Write-Step '[8/9] Native execution was not granted. Heartbeat-only mode remains active.'
  }

  Write-Step '[9/9] Writing sanitized physical-PC receipt and reconciling Windows startup continuity...'
  $finalHybrid = Get-CloudHybrid
  $receipt = [ordered]@{
    schema = 'OMEGA_R222_PHYSICAL_HYBRID_RECEIPT'
    state = if ($GrantExecution -and $continuity -and [bool]$continuity.continuityProven) { 'LINK_AUTHORITY_AND_CONTINUITY_VERIFIED' } elseif ($GrantExecution) { 'LINK_AND_AUTHORITY_ACTIVE_DEVELOPMENT_PENDING' } else { 'LINK_AUTHENTICATED_EXECUTION_NOT_GRANTED' }
    capturedAt = (Get-Date).ToUniversalTime().ToString('o')
    productionBase = $ProductionBase
    approvedRoot = $Root
    deviceId = $DeviceId
    pairingTokenPersisted = $false
    tokenSha256 = [string]$enrollment.tokenSha256
    cloudHeartbeatCurrent = [bool]$finalHybrid.heartbeatCurrent
    cloudAuthenticated = [bool]$finalHybrid.authenticated
    pcOnline = [bool]$finalHybrid.pcOnline
    localExecutionAuthorityGranted = [bool]$GrantExecution
    executionAuthority = if ($authority) { $authority } else { $finalHybrid.executionAuthority }
    nativeRcwa = $true
    controlPlane = 'CLOUDFLARE_DURABLE_OBJECT_OUTBOUND_AGENT_POLL'
    inboundCloudToPcRequired = $false
    duplicateLauncherStarted = $false
    continuity = $continuity
    canonicalMutation = $false
    githubMutation = $false
    deploymentAuthorized = $false
    promotionAuthorized = $false
  }
  $receipt | ConvertTo-Json -Depth 30 | Set-Content -Path $ReceiptPath -Encoding utf8

  if (-not $Headless) {
    try {
      $startup = [Environment]::GetFolderPath('Startup')
      if ($startup) {
        $shell = New-Object -ComObject WScript.Shell
        Get-ChildItem -Path $startup -Filter 'OMEGA*.lnk' -ErrorAction SilentlyContinue | ForEach-Object {
          try {
            $lnk = $shell.CreateShortcut($_.FullName)
            $args = [string]$lnk.Arguments
            if ($args -match 'LAUNCH_OMEGA_V6_WINDOWS\.ps1|START_OMEGA_R220|START_OMEGA_R222') { Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue }
          } catch {}
        }
        $startupLink = Join-Path $startup 'OMEGA R222 Sovereign Continuity.lnk'
        $shortcut = $shell.CreateShortcut($startupLink)
        $shortcut.TargetPath = 'powershell.exe'
        $shortcut.Arguments = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$PSCommandPath`" -Headless -NoBrowser -SkipDevelopment"
        $shortcut.WorkingDirectory = $Root
        $shortcut.Description = 'OMEGA R222 single-instance authenticated outbound heartbeat continuity'
        $shortcut.Save()
      }
    } catch {
      Write-Host "Startup shortcut reconciliation warning: $($_.Exception.Message)"
    }
  }

  $Token = $null
  $enrollment.token = $null
  Write-Host ''
  Write-Host 'OMEGA R222 HYBRID LINK IS ACTIVE.'
  Write-Host "PC online/authenticated: $($receipt.pcOnline) / $($receipt.cloudAuthenticated)"
  Write-Host "Execution authority:      $($receipt.localExecutionAuthorityGranted)"
  if ($continuity) { Write-Host "Development continuity:  $($continuity.continuityProven)" }
  Write-Host "Receipt:                  $ReceiptPath"
  Write-Host 'One localhost runtime and one sovereign agent are authoritative for this root.'

  if (-not $NoBrowser -and -not $Headless) {
    Start-Process "$ProductionBase/?app=Hybrid"
  }
  exit 0
}
catch {
  Write-Host ''
  Write-Host 'OMEGA R222 SETUP BLOCKED:' -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  Write-Host 'No success state is being fabricated. Check the R222 logs under %LOCALAPPDATA%\OMEGA\r222.'
  exit 1
}
finally {
  if ($HasMutex) {
    try { $Mutex.ReleaseMutex() } catch {}
  }
  $Mutex.Dispose()
}
