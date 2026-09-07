from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEXER = ROOT / "scripts" / "INDEX_OMEGA_SOVEREIGN_PROOF_R211.ps1"


def source() -> str:
    assert INDEXER.exists(), INDEXER
    return INDEXER.read_text(encoding="utf-8")


def test_r211_revalidates_content_address_and_receipt_schema():
    s = source()
    for token in (
        "function Get-OmegaSha256",
        "[System.Security.Cryptography.SHA256]::Create()",
        "Archive hash mismatch",
        "OMEGA_PHYSICAL_SOVEREIGN_ACCEPTANCE_R208",
        "OMEGA_SOVEREIGN_CONVERGENCE_R209",
        "Archive schema mismatch",
    ):
        assert token in s, token


def test_r211_is_query_index_not_acceptance_authority():
    s = source()
    for token in (
        "OMEGA_SOVEREIGN_PROOF_INDEX_R211",
        "LOCAL_EVIDENCE_QUERY_INDEX_NOT_CANON",
        "sourceReceiptsRemainAuthority = $true",
        "indexMayCreateAcceptance = $false",
        "indexMayMutateCanon = $false",
        "indexMayAuthorizePromotion = $false",
        "canonicalMutation = $false",
        "promotionAuthorized = $false",
    ):
        assert token in s, token


def test_r211_is_local_read_index_only():
    s = source().lower()
    for forbidden in (
        "invoke-restmethod",
        "invoke-webrequest",
        "wrangler",
        "git push",
        "pip install",
        "npm install",
        "reg add",
        "new-service",
        "set-service",
    ):
        assert forbidden not in s, forbidden


def test_r211_output_is_deterministically_sorted():
    s = source()
    assert "Sort-Object Name" in s
    assert "Sort-Object @{Expression='capturedAt';Ascending=$true}, @{Expression='sha256';Ascending=$true}" in s
