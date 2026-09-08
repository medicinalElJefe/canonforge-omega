from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
R209 = ROOT / "scripts" / "PROVE_OMEGA_V6_R209_WINDOWS.ps1"
R208 = ROOT / "scripts" / "PROVE_OMEGA_V6_WINDOWS.ps1"
R210 = ROOT / "scripts" / "ARCHIVE_OMEGA_SOVEREIGN_PROOF_R210.ps1"
LEGACY_LAUNCHER = ROOT / "scripts" / "LAUNCH_OMEGA_V6_WINDOWS.ps1"
GATEWAY = ROOT / "scripts" / "START_OMEGA_SOVEREIGN.ps1"


def text(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def test_r209_wraps_r208_truth_instead_of_redefining_acceptance():
    source = text(R209)
    required = [
        "OMEGA_SOVEREIGN_CONVERGENCE_R209",
        "OMEGA_PHYSICAL_SOVEREIGN_ACCEPTANCE_R208",
        "PROVE_OMEGA_V6_WINDOWS.ps1",
        "onlyR208R181ReceiptsDetermineAcceptance = $true",
        "retriesDoNotCreateProof = $true",
        "LOCAL_OPERATOR_CONVERGENCE_OBSERVATION_NOT_CANON",
        "canonicalMutation = $false",
        "promotionAuthorized = $false",
        "windowsCiIsPhysicalPcProof = $false",
        "providerWeightsAreOmegaTrained = $false",
    ]
    for token in required:
        assert token in source, token


def test_r209_bounded_retry_and_blocker_taxonomy_are_explicit():
    source = text(R209)
    assert "$MaxAttempts = 12" in source
    assert "$DelaySeconds = 5" in source
    assert "$MaxAttempts -gt 60" in source
    assert "$DelaySeconds -gt 60" in source
    blockers = [
        "LOCAL_RUNTIME_UNHEALTHY",
        "NATIVE_RCWA_UNAVAILABLE",
        "LOCAL_HYBRID_UNAUTHENTICATED",
        "LOCAL_HEARTBEAT_NOT_CURRENT",
        "PRODUCTION_PC_UNAUTHENTICATED",
        "PRODUCTION_HEARTBEAT_NOT_CURRENT",
        "PRODUCTION_PC_NOT_ACCEPTED",
        "B059_DEEP_VERIFICATION_INCOMPLETE",
        "B059_GROUNDED_QUERY_INCOMPLETE",
    ]
    for blocker in blockers:
        assert blocker in source, blocker


def test_r209_rejects_stale_receipts_and_retains_fresh_attempts_before_replacement():
    source = text(R209)
    required = [
        "Remove-Item $R208ReceiptPath -Force -ErrorAction SilentlyContinue",
        "[DateTimeOffset]::Parse",
        "r208ReceiptCapturedAt",
        "R208_RECEIPT_PARSE_FRESHNESS_OR_ARCHIVE_FAILED",
        "R208_RECEIPT_MISSING",
        "staleR208ReceiptsRejected = $true",
        "everyValidatedR208AttemptContentAddressedBeforeReplacement = $true",
        "ARCHIVE_OMEGA_SOVEREIGN_PROOF_R210.ps1",
        "r210ArchiveSha256",
        "r210ArchivePath",
        "retentionRevision = 'R210'",
    ]
    for token in required:
        assert token in source, token


def test_r209_does_not_install_or_mutate_machine_state():
    source = text(R209).lower()
    forbidden = [
        "pip install",
        "npm install",
        "reg add",
        "new-service",
        "set-service",
        "powercfg",
        "sc.exe create",
    ]
    for token in forbidden:
        assert token not in source, token


def test_r208_truth_prover_remains_present_and_unchanged_as_authority_layer():
    source = text(R208)
    assert "OMEGA_PHYSICAL_SOVEREIGN_ACCEPTANCE_R208" in source
    assert "/api/acceptance/r181/probe" in source
    assert "fullAcceptance -eq $expectedFull" in source
    assert "canonicalMutation = $false" in source
    assert "promotionAuthorized = $false" in source


def test_r210_archiver_is_evidence_retention_not_acceptance_authority():
    source = text(R210)
    assert "OMEGA_SOVEREIGN_PROOF_ARCHIVE_RESULT_R210" in source
    assert "LOCAL_CONTENT_ADDRESSED_EVIDENCE_INDEX_NOT_CANON" in source
    assert "canonicalMutation = $false" in source
    assert "promotionAuthorized = $false" in source


def test_stable_gateway_wires_r209_truth_without_reintroducing_runtime_ownership():
    legacy = text(LEGACY_LAUNCHER)
    gateway = text(GATEWAY)
    assert "START_OMEGA_SOVEREIGN.ps1" in legacy
    assert "PROVE_OMEGA_V6_R209_WINDOWS.ps1" in gateway
    assert "r209_sovereign_convergence_latest.json" in gateway
    assert "-MaxAttempts 12 -DelaySeconds 5" in gateway
    assert "R209 is additive to R208" in gateway
    assert "existing single-owner runtime" in gateway
    assert "omega_runtime.cli" not in gateway
    assert "omega_sovereign_agent.py" not in gateway
