from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PROVER = ROOT / "scripts" / "PROVE_OMEGA_V6_WINDOWS.ps1"
LAUNCHER = ROOT / "scripts" / "LAUNCH_OMEGA_V6_WINDOWS.ps1"
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


def test_r208_remains_additive_to_r207_launch_contract():
    launcher = text(LAUNCHER)
    installer = text(INSTALLER)
    assert "$Port = 8127" in launcher
    assert ".venv\\Scripts\\python.exe" in launcher
    assert "Remove-Item $PairingEnvelope" in launcher
    assert "PC ONLINE is still proof-gated" in launcher
    assert "canonical-root.txt" in installer
    assert "OMEGA V6 Sovereign Continuity.lnk" in installer
