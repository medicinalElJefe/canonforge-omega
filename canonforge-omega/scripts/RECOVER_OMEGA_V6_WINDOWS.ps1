param(
  [string]$Root = '',
  [string]$RemoteName = 'origin',
  [string]$CanonicalBranch = 'omega-v6-full-convergence',
  [switch]$NoInstall
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$ExpectedRepository = 'medicinalElJefe/canonforge-omega'
$ExpectedOriginPattern = 'medicinalElJefe[/:]canonforge-omega(?:\.git)?$'
$OmegaLocal = Join-Path $env:LOCALAPPDATA 'OMEGA'
$RootPointer = Join-Path $OmegaLocal 'canonical-root.txt'

function Invoke-Git([string]$WorkingRoot, [string[]]$Arguments, [switch]$AllowFailure) {
  $output = & git -C $WorkingRoot @Arguments 2>&1
  $exit = $LASTEXITCODE
  if (-not $AllowFailure -and $exit -ne 0) {
    throw "git $($Arguments -join ' ') failed with exit $exit`: $($output -join ' ')"
  }
  return [pscustomobject]@{ ExitCode = $exit; Output = @($output) }
}

function First-Line($Result) {
  if ($null -eq $Result -or $Result.Output.Count -eq 0) { return '' }
  return ([string]$Result.Output[0]).Trim()
}

function Assert-Sha([string]$Value, [string]$Label) {
  if ($Value -notmatch '^[0-9a-f]{40}$') { throw "$Label is not a full Git SHA: $Value" }
}

function Write-Receipt([hashtable]$Receipt, [string]$Path) {
  $Receipt.capturedAt = (Get-Date).ToUniversalTime().ToString('o')
  $Receipt | ConvertTo-Json -Depth 12 | Set-Content -Path $Path -Encoding utf8
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw 'Git for Windows is required for bounded OMEGA recovery.'
}

if (-not $Root) {
  if (Test-Path $RootPointer) {
    $Root = (Get-Content -Raw -Path $RootPointer).Trim()
  }
  if (-not $Root) {
    $Root = Split-Path -Parent $PSScriptRoot
  }
}

$Root = [System.IO.Path]::GetFullPath($Root)
$LogDir = Join-Path $Root 'logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$ReceiptPath = Join-Path $LogDir 'r209_host_recovery_latest.json'
$Installer = Join-Path $Root 'scripts\INSTALL_OMEGA_V6_WINDOWS.ps1'
$Launcher = Join-Path $Root 'scripts\LAUNCH_OMEGA_V6_WINDOWS.ps1'
$Prover = Join-Path $Root 'scripts\PROVE_OMEGA_V6_WINDOWS.ps1'

$receipt = [ordered]@{
  schema = 'OMEGA_PHYSICAL_HOST_RECOVERY_R209'
  revision = 'R209'
  authority = 'LOCAL_RECOVERY_OBSERVATION_NOT_CANON'
  canonicalMutation = $false
  promotionAuthorized = $false
  expectedRepository = $ExpectedRepository
  root = $Root
  gitRoot = $null
  remoteName = $RemoteName
  originUrl = $null
  canonicalBranch = $CanonicalBranch
  branch = $null
  beforeSha = $null
  remoteSha = $null
  afterSha = $null
  dirty = $null
  dirtyEntryCount = 0
  relation = 'UNKNOWN'
  updateState = 'UNSTARTED'
  installInvoked = $false
  installExitCode = $null
  safeToLaunch = $false
  boundaries = [ordered]@{
    destructiveResetAllowed = $false
    forcedCheckoutAllowed = $false
    localChangesMayBeOverwritten = $false
    fastForwardOnly = $true
    arbitraryRemoteAllowed = $false
    recoveryReceiptIsCanon = $false
    recoveryProvesPhysicalAcceptance = $false
  }
}

try {
  foreach ($required in @($Installer, $Launcher, $Prover)) {
    if (-not (Test-Path $required)) { throw "Canonical R208+ runtime component missing: $required" }
  }

  $gitRootResult = Invoke-Git $Root @('rev-parse','--show-toplevel')
  $gitRoot = First-Line $gitRootResult
  if (-not $gitRoot) { throw 'The selected OMEGA root is not inside a Git checkout.' }
  $gitRoot = [System.IO.Path]::GetFullPath($gitRoot)
  $receipt.gitRoot = $gitRoot

  $origin = First-Line (Invoke-Git $gitRoot @('remote','get-url',$RemoteName))
  $receipt.originUrl = $origin
  if ($origin -notmatch $ExpectedOriginPattern) {
    $receipt.updateState = 'BLOCKED_UNTRUSTED_REMOTE'
    throw "Recovery refused remote '$origin'. Expected $ExpectedRepository."
  }

  $branch = First-Line (Invoke-Git $gitRoot @('branch','--show-current'))
  $receipt.branch = $branch
  if ($branch -ne $CanonicalBranch) {
    $receipt.updateState = 'BLOCKED_WRONG_BRANCH'
    throw "Recovery will not switch branches implicitly. Current '$branch'; expected '$CanonicalBranch'."
  }

  $beforeSha = First-Line (Invoke-Git $gitRoot @('rev-parse','HEAD'))
  Assert-Sha $beforeSha 'Local HEAD'
  $receipt.beforeSha = $beforeSha

  $status = Invoke-Git $gitRoot @('status','--porcelain=v1','--untracked-files=normal')
  $dirtyEntries = @($status.Output | Where-Object { ([string]$_).Trim().Length -gt 0 })
  $receipt.dirtyEntryCount = $dirtyEntries.Count
  $receipt.dirty = ($dirtyEntries.Count -gt 0)

  # Read the authoritative remote branch without changing the working tree.
  $lsRemote = Invoke-Git $gitRoot @('ls-remote','--heads',$RemoteName,"refs/heads/$CanonicalBranch")
  $remoteLine = First-Line $lsRemote
  if ($remoteLine -notmatch '^([0-9a-f]{40})\s+') {
    $receipt.updateState = 'BLOCKED_REMOTE_HEAD_UNAVAILABLE'
    throw "Canonical remote head could not be resolved for $CanonicalBranch."
  }
  $remoteSha = $Matches[1]
  Assert-Sha $remoteSha 'Remote canonical HEAD'
  $receipt.remoteSha = $remoteSha

  if ($beforeSha -eq $remoteSha) {
    $receipt.relation = 'EXACT'
    $receipt.updateState = 'ALREADY_CURRENT'
  } else {
    if ($receipt.dirty) {
      $receipt.relation = 'UNKNOWN_DIRTY'
      $receipt.updateState = 'BLOCKED_DIRTY_WORKTREE'
      throw 'Recovery found local tracked/untracked work. It will not overwrite or stash operator work automatically.'
    }

    # Fetch only the declared canonical ref, then prove ancestry before any working-tree mutation.
    Invoke-Git $gitRoot @('fetch','--no-tags',$RemoteName,"refs/heads/$CanonicalBranch:refs/remotes/$RemoteName/$CanonicalBranch") | Out-Null
    $fetchedSha = First-Line (Invoke-Git $gitRoot @('rev-parse',"refs/remotes/$RemoteName/$CanonicalBranch"))
    Assert-Sha $fetchedSha 'Fetched canonical HEAD'
    if ($fetchedSha -ne $remoteSha) {
      $receipt.updateState = 'BLOCKED_REMOTE_RACE'
      throw "Remote branch changed during recovery ($remoteSha -> $fetchedSha). Run recovery again."
    }

    $ancestor = Invoke-Git $gitRoot @('merge-base','--is-ancestor',$beforeSha,$remoteSha) -AllowFailure
    if ($ancestor.ExitCode -ne 0) {
      $receipt.relation = 'DIVERGED_OR_LOCAL_AHEAD'
      $receipt.updateState = 'BLOCKED_NON_FAST_FORWARD'
      throw 'Local canonical checkout is not an ancestor of the remote canonical head. No reset/rebase/force operation is permitted by recovery.'
    }

    $receipt.relation = 'LOCAL_BEHIND_REMOTE'
    Invoke-Git $gitRoot @('merge','--ff-only',$remoteSha) | Out-Null
    $afterUpdate = First-Line (Invoke-Git $gitRoot @('rev-parse','HEAD'))
    Assert-Sha $afterUpdate 'Post-update HEAD'
    if ($afterUpdate -ne $remoteSha) {
      $receipt.updateState = 'FAILED_POST_UPDATE_SHA_MISMATCH'
      throw "Fast-forward completed without exact canonical SHA ($afterUpdate != $remoteSha)."
    }
    $receipt.updateState = 'FAST_FORWARDED'
  }

  $afterSha = First-Line (Invoke-Git $gitRoot @('rev-parse','HEAD'))
  Assert-Sha $afterSha 'Final local HEAD'
  $receipt.afterSha = $afterSha
  if ($afterSha -ne $remoteSha) {
    $receipt.updateState = 'BLOCKED_NOT_EXACT_CANONICAL'
    throw "Recovery cannot launch because local HEAD is not exact canonical ($afterSha != $remoteSha)."
  }

  $receipt.safeToLaunch = $true
  Write-Receipt $receipt $ReceiptPath

  Write-Host "OMEGA R209 recovery: $($receipt.updateState)"
  Write-Host "Canonical SHA: $remoteSha"
  Write-Host "Receipt: $ReceiptPath"

  if (-not $NoInstall) {
    $receipt.installInvoked = $true
    Write-Receipt $receipt $ReceiptPath
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $Installer
    $receipt.installExitCode = $LASTEXITCODE
    if ($LASTEXITCODE -ne 0) {
      $receipt.safeToLaunch = $false
      $receipt.updateState = 'CANONICAL_SYNCED_INSTALL_FAILED'
      Write-Receipt $receipt $ReceiptPath
      throw "Canonical recovery succeeded, but verified installer failed with exit $LASTEXITCODE."
    }
    $receipt.updateState = 'CANONICAL_SYNCED_INSTALL_LAUNCH_REQUESTED'
    Write-Receipt $receipt $ReceiptPath
  }
} catch {
  if (-not $receipt.afterSha -and $receipt.gitRoot) {
    try {
      $current = First-Line (Invoke-Git ([string]$receipt.gitRoot) @('rev-parse','HEAD') -AllowFailure)
      if ($current -match '^[0-9a-f]{40}$') { $receipt.afterSha = $current }
    } catch { }
  }
  Write-Receipt $receipt $ReceiptPath
  Write-Error $_.Exception.Message
  exit 9
}

exit 0
