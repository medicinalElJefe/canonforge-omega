from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PROVER = ROOT / "scripts" / "PROVE_OMEGA_V6_WINDOWS.ps1"
LEGACY_LAUNCHER = ROOT / "scripts" / "LAUNCH_OMEGA_V6_WINDOWS.ps1"
GATEWAY = ROOT / "scripts" / "START_OMEGA_SOVEREIGN.ps1"
CURRENT = ROOT / "scripts" / "START_OMEGA_R222_FULL_HYBRID.ps1"
INSTALLER = ROOT / "scripts" / "INSTALL_OMEGA_V6_WINDOWS.ps1"


def text(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def test_r208_prover_preserves_physical_acceptance_truth_boundary():
    source = text(PROVER)
    required = [
        "OMEGA_PHYSICAL_SOVEREIGN_ACCEPTANCE_R208",
        "/api/acceptance/r181/manifest",
        "/api/acceptance/r181/probe",
        "deep_b059 = $true",
        "query_b059 = $true",
        "OMEGA_LIVE_AI_SAI_SOVEREIGN_ACCEPTANCE_R181",
        "LIVE_ACCEPTANCE_RECEIPT_NOT_CANON",
        "deploymentIdentityBound",
        "canonicalGitSha",
        "fullyTrainedWithinDeclaredScope",
        "b059GroundedQuery.grounded",
        "hybrid.heartbeatCurrent",
        "fullAcceptance",
        "LOCAL_OPERATOR_ACCEPTANCE_OBSERVATION_NOT_CANON",
        "canonicalMutation = $false",
        "promotionAuthorized = $false",
        "windowsCiIsPhysicalPcProof = $false",
        "providerWeightsAreOmegaTrained = $false",
    ]
    for token in required:
        assert token in source, token


def test_r208_prover_uses_verified_venv_and_no_rcwa_fallback():
    source = text(PROVER)
    assert ".venv\\Scripts\\python.exe" in source
    assert "omega_runtime.rcwa_solver --probe" in source
    assert "Native grcwa RCWA is unavailable; no fallback is accepted as RCWA." in source
    assert "pip install" not in source
    assert "npm install" not in source
    assert "reg add" not in source.lower()
    assert "new-service" not in source.lower()


def test_r208_remains_additive_after_single_owner_successor_migration():
    legacy = text(LEGACY_LAUNCHER)
    gateway = text(GATEWAY)
    current = text(CURRENT)
    installer = text(INSTALLER)

    # Ownership moved behind the stable gateway; R208/R209 proof must move with it
    # rather than forcing the compatibility launcher to own another runtime.
    assert "START_OMEGA_SOVEREIGN.ps1" in legacy
    assert "START_OMEGA_R222_FULL_HYBRID.ps1" in gateway
    assert "PROVE_OMEGA_V6_R209_WINDOWS.ps1" in gateway
    assert "R208/R209 acceptance diagnostics" in gateway
    assert "$Port = 8127" in current
    assert "Join-Path $Root '.venv\\Scripts\\python.exe'" in current
    assert "Outbound agent did not establish current authenticated cloud heartbeat" in current

    # Installer persists the stable gateway and the non-secret canonical root; it does
    # not resurrect the old R207 process owner just to satisfy a historical filename.
    assert "canonical-root.txt" in installer
    assert "OMEGA Sovereign Continuity.lnk" in installer
    assert "START_OMEGA_SOVEREIGN.ps1" in installer
    assert "PROVE_OMEGA_V6_WINDOWS.ps1" in installer
    assert "PROVE_OMEGA_V6_R209_WINDOWS.ps1" in installer
