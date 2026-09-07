param(
  [Parameter(Mandatory=$true)][string]$ReceiptPath,
  [Parameter(Mandatory=$true)][ValidateSet('R208_ATTEMPT','R209_CONVERGENCE')][string]$Kind,
  [int]$Attempt = 0,
  [string]$ArchiveRoot
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $PSScriptRoot
if (-not $ArchiveRoot) {
  $ArchiveRoot = Join-Path $Root 'logs\proof_archive'
}
if (-not (Test-Path $ReceiptPath)) {
  throw "Receipt missing: $ReceiptPath"
}

function Get-OmegaSha256([string]$Path) {
  $fullPath = [System.IO.Path]::GetFullPath($Path)
  $stream = [System.IO.File]::Open($fullPath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::Read)
  try {
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try {
      $bytes = $sha.ComputeHash($stream)
      return ([System.BitConverter]::ToString($bytes)).Replace('-', '').ToLowerInvariant()
    } finally {
      $sha.Dispose()
    }
  } finally {
    $stream.Dispose()
  }
}

$raw = Get-Content -Raw -Path $ReceiptPath
$receipt = $raw | ConvertFrom-Json
$expectedSchema = if ($Kind -eq 'R208_ATTEMPT') {
  'OMEGA_PHYSICAL_SOVEREIGN_ACCEPTANCE_R208'
} else {
  'OMEGA_SOVEREIGN_CONVERGENCE_R209'
}
if ([string]$receipt.schema -ne $expectedSchema) {
  throw "Receipt schema mismatch for ${Kind}: $($receipt.schema)"
}
if ([bool]$receipt.canonicalMutation -ne $false) {
  throw 'Only non-Canon receipts may enter the R210 local proof archive.'
}
if ([bool]$receipt.promotionAuthorized -ne $false) {
  throw 'Promotion-authorizing packets may not enter the R210 local proof archive.'
}

$hash = Get-OmegaSha256 $ReceiptPath
if ($hash -notmatch '^[a-f0-9]{64}$') {
  throw 'Failed to derive a SHA-256 content address.'
}

$kindDir = Join-Path $ArchiveRoot $Kind
New-Item -ItemType Directory -Force -Path $kindDir | Out-Null
$archivePath = Join-Path $kindDir "$hash.json"
$preexisting = Test-Path $archivePath

if ($preexisting) {
  $existingHash = Get-OmegaSha256 $archivePath
  if ($existingHash -ne $hash) {
    throw "Content-address collision or archive corruption: $archivePath"
  }
} else {
  Copy-Item -LiteralPath $ReceiptPath -Destination $archivePath
  $writtenHash = Get-OmegaSha256 $archivePath
  if ($writtenHash -ne $hash) {
    Remove-Item -LiteralPath $archivePath -Force -ErrorAction SilentlyContinue
    throw 'Archived receipt hash mismatch after write.'
  }
}

$relativeArchivePath = $archivePath
try {
  $relativeArchivePath = [System.IO.Path]::GetRelativePath($Root, $archivePath)
} catch {}

$result = [ordered]@{
  schema = 'OMEGA_SOVEREIGN_PROOF_ARCHIVE_RESULT_R210'
  revision = 'R210'
  authority = 'LOCAL_CONTENT_ADDRESSED_EVIDENCE_INDEX_NOT_CANON'
  kind = $Kind
  attempt = $Attempt
  receiptSchema = $expectedSchema
  receiptCapturedAt = [string]$receipt.capturedAt
  canonicalGitSha = if ($Kind -eq 'R208_ATTEMPT') { [string]$receipt.production.canonicalGitSha } else { $null }
  sha256 = $hash
  archivePath = $relativeArchivePath
  preexisting = $preexisting
  canonicalMutation = $false
  promotionAuthorized = $false
}
$result | ConvertTo-Json -Depth 8
