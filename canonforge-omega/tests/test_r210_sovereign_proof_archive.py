from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ARCHIVER = ROOT / "scripts" / "ARCHIVE_OMEGA_SOVEREIGN_PROOF_R210.ps1"
R209 = ROOT / "scripts" / "PROVE_OMEGA_V6_R209_WINDOWS.ps1"


def text(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def test_r210_is_content_addressed_and_hash_verified():
    source = text(ARCHIVER)
    required = [
        "function Get-OmegaSha256",
        "[System.Security.Cryptography.SHA256]::Create()",
        "ComputeHash($stream)",
        'Join-Path $kindDir "$hash.json"',
        "Content-address collision or archive corruption",
        "Archived receipt hash mismatch after write",
        "OMEGA_SOVEREIGN_PROOF_ARCHIVE_RESULT_R210",
    ]
    for token in required:
        assert token in source, token
    assert "Get-FileHash" not in source


def test_r210_accepts_only_known_noncanon_receipt_schemas():
    source = text(ARCHIVER)
    required = [
        "ValidateSet('R208_ATTEMPT','R209_CONVERGENCE')",
        "OMEGA_PHYSICAL_SOVEREIGN_ACCEPTANCE_R208",
        "OMEGA_SOVEREIGN_CONVERGENCE_R209",
        "Only non-Canon receipts may enter the R210 local proof archive",
        "Promotion-authorizing packets may not enter the R210 local proof archive",
        "canonicalMutation = $false",
        "promotionAuthorized = $false",
    ]
    for token in required:
        assert token in source, token


def test_r210_archive_is_local_and_not_a_canon_or_cloud_write_surface():
    source = text(ARCHIVER).lower()
    forbidden = [
        "invoke-restmethod",
        "invoke-webrequest",
        "curl ",
        "wrangler",
        "git push",
        "pip install",
        "npm install",
        "reg add",
        "new-service",
        "set-service",
    ]
    for token in forbidden:
        assert token not in source, token


def test_r209_archives_fresh_r208_before_next_remove_and_archives_final_r209():
    source = text(R209)
    remove_pos = source.index("Remove-Item $R208ReceiptPath")
    archive_pos = source.index("Save-R210Archive -Path $R208ReceiptPath")
    final_archive_pos = source.index("Save-R210Archive -Path $R209ReceiptPath")
    assert remove_pos < archive_pos < final_archive_pos
    assert "r210ArchiveSha256" in source
    assert "r210ArchivePath" in source
    assert "everyValidatedR208AttemptContentAddressedBeforeReplacement = $true" in source
