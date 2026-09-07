param(
  [string]$ArchiveRoot,
  [string]$OutputPath
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $PSScriptRoot
if (-not $ArchiveRoot) { $ArchiveRoot = Join-Path $Root 'logs\proof_archive' }
if (-not $OutputPath) { $OutputPath = Join-Path $Root 'logs\r211_sovereign_proof_index_latest.json' }

function Get-OmegaSha256([string]$Path) {
  $stream = [System.IO.File]::Open([System.IO.Path]::GetFullPath($Path), [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::Read)
  try {
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try { return ([System.BitConverter]::ToString($sha.ComputeHash($stream))).Replace('-', '').ToLowerInvariant() }
    finally { $sha.Dispose() }
  } finally { $stream.Dispose() }
}

function Get-OmegaRelativePath([string]$BasePath, [string]$TargetPath) {
  $baseFull = [System.IO.Path]::GetFullPath($BasePath)
  $separator = [string][System.IO.Path]::DirectorySeparatorChar
  if (-not $baseFull.EndsWith($separator)) { $baseFull = $baseFull + $separator }
  $targetFull = [System.IO.Path]::GetFullPath($TargetPath)
  $baseUri = New-Object System.Uri($baseFull)
  $targetUri = New-Object System.Uri($targetFull)
  $relative = [System.Uri]::UnescapeDataString($baseUri.MakeRelativeUri($targetUri).ToString())
  return $relative.Replace('/', [System.IO.Path]::DirectorySeparatorChar)
}

$records = @()
foreach ($kind in @('R208_ATTEMPT','R209_CONVERGENCE')) {
  $dir = Join-Path $ArchiveRoot $kind
  if (-not (Test-Path $dir)) { continue }
  foreach ($file in Get-ChildItem -LiteralPath $dir -Filter '*.json' -File | Sort-Object Name) {
    $expectedHash = [System.IO.Path]::GetFileNameWithoutExtension($file.Name).ToLowerInvariant()
    if ($expectedHash -notmatch '^[a-f0-9]{64}$') { throw "Non-content-addressed archive file: $($file.FullName)" }
    $actualHash = Get-OmegaSha256 $file.FullName
    if ($actualHash -ne $expectedHash) { throw "Archive hash mismatch: $($file.FullName)" }
    $receipt = Get-Content -Raw -Path $file.FullName | ConvertFrom-Json
    $expectedSchema = if ($kind -eq 'R208_ATTEMPT') { 'OMEGA_PHYSICAL_SOVEREIGN_ACCEPTANCE_R208' } else { 'OMEGA_SOVEREIGN_CONVERGENCE_R209' }
    if ([string]$receipt.schema -ne $expectedSchema) { throw "Archive schema mismatch: $($file.FullName)" }
    if ([bool]$receipt.canonicalMutation -ne $false -or [bool]$receipt.promotionAuthorized -ne $false) {
      throw "Archive authority boundary violated: $($file.FullName)"
    }
    $full = [bool]$receipt.fullAcceptance
    $canonicalSha = $null
    $state = $null
    if ($kind -eq 'R208_ATTEMPT') {
      $canonicalSha = [string]$receipt.production.canonicalGitSha
      $state = [string]$receipt.acceptanceState
    } elseif ($receipt.attempts.Count -gt 0) {
      $canonicalSha = [string]$receipt.attempts[$receipt.attempts.Count - 1].canonicalGitSha
      $state = [string]$receipt.attempts[$receipt.attempts.Count - 1].acceptanceState
    }
    $records += [ordered]@{
      kind = $kind
      sha256 = $actualHash
      capturedAt = [string]$receipt.capturedAt
      canonicalGitSha = $canonicalSha
      acceptanceState = $state
      fullAcceptance = $full
      relativePath = Get-OmegaRelativePath $Root $file.FullName
    }
  }
}

$records = @($records | Sort-Object @{Expression='capturedAt';Ascending=$true}, @{Expression='sha256';Ascending=$true})
$acceptedCount = @($records | Where-Object { $_.fullAcceptance }).Count
$latest = if ($records.Count -gt 0) { $records[$records.Count - 1] } else { $null }
$manifest = [ordered]@{
  schema = 'OMEGA_SOVEREIGN_PROOF_INDEX_R211'
  revision = 'R211'
  authority = 'LOCAL_EVIDENCE_QUERY_INDEX_NOT_CANON'
  generatedAt = (Get-Date).ToUniversalTime().ToString('o')
  archiveRoot = [System.IO.Path]::GetFullPath($ArchiveRoot)
  recordCount = $records.Count
  fullAcceptanceRecordCount = $acceptedCount
  latest = $latest
  records = $records
  boundaries = [ordered]@{
    sourceReceiptsRemainAuthority = $true
    indexMayCreateAcceptance = $false
    indexMayMutateCanon = $false
    indexMayAuthorizePromotion = $false
  }
  canonicalMutation = $false
  promotionAuthorized = $false
}

$outDir = Split-Path -Parent $OutputPath
if ($outDir) { New-Item -ItemType Directory -Force -Path $outDir | Out-Null }
$manifest | ConvertTo-Json -Depth 12 | Set-Content -Path $OutputPath -Encoding utf8
$manifest | ConvertTo-Json -Depth 12
