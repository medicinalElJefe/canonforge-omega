from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "REPAIR_AND_PROVE_OMEGA_V6_WINDOWS_R221.ps1"


def source() -> str:
    return SCRIPT.read_text(encoding="utf-8")


def test_r221_exists_and_preserves_canonical_windows_identity():
    s = source()
    assert "$Port = 8127" in s
    assert 'http://127.0.0.1:$Port' in s
    assert "LAUNCH_OMEGA_V6_WINDOWS.ps1" in s
    assert "PROVE_OMEGA_V6_R209_WINDOWS.ps1" in s
    assert "INDEX_OMEGA_SOVEREIGN_PROOF_R211.ps1" in s
    assert "omega_sovereign_agent.py" in s
    assert "canonical-root.txt" in s


def test_r221_repairs_only_owned_omega_processes_and_fails_closed_on_foreign_port_owner():
    s = source()
    assert "function Test-OwnedRuntimeProcess" in s
    assert "omega_runtime\\.cli" in s
    assert "omega_sovereign_agent\\.py" in s
    assert "Stop-OwnedProcess $listener 'runtime'" in s
    assert "Stop-OwnedProcess $agent 'sovereign-agent'" in s
    assert "CANONICAL_PORT_8127_OWNED_BY_NON_OMEGA_PROCESS" in s
    assert "It was NOT stopped" in s
    assert "foreignPortOwnerIsNeverKilled = $true" in s
    assert "onlyRootOwnedOmegaProcessesMayBeRestarted = $true" in s


def test_r221_does_not_shadow_read_only_pid_automatic_variable():
    s = source().lower()
    assert "$processid = [int]$process.processid" in s
    assert "$pid = [int]$process.processid" not in s


def test_r221_uses_verified_venv_native_rcwa_and_governed_installer_when_needed():
    s = source()
    assert ".venv\\Scripts\\python.exe" in s
    assert "omega_runtime.rcwa_solver --probe" in s
    assert "INSTALL_OMEGA_V6_WINDOWS.ps1" in s
    assert "verified venv/RCWA incomplete; invoking governed installer" in s
    assert "NATIVE_RCWA_UNAVAILABLE" in s


def test_r221_heartbeat_and_full_acceptance_remain_proof_gated():
    s = source()
    assert "heartbeatCurrent" in s
    assert "authenticated" in s
    assert "-SkipAcceptanceProof" in s
    assert "-RequireFullAcceptance" in s
    assert "FULL_PHYSICAL_SOVEREIGN_ACCEPTANCE_VERIFIED" in s
    assert "physicalPcOnlineRequiresCurrentAuthenticatedHeartbeat = $true" in s
    assert "fullAcceptanceStillRequiresR181PhysicalHeartbeatAndB059Proof = $true" in s
    assert "windowsCiIsPhysicalPcProof = $false" in s


def test_r221_receipt_is_sanitized_noncanon_and_refreshes_content_addressed_index():
    s = source()
    assert "OMEGA_WINDOWS_SOVEREIGN_SELF_HEAL_R221" in s
    assert "LOCAL_OPERATOR_REPAIR_AND_PROOF_ORCHESTRATION_NOT_CANON" in s
    assert "canonicalMutation = $false" in s
    assert "promotionAuthorized = $false" in s
    assert "pairingCredentialsAreNeverWrittenToThisReceipt = $true" in s
    assert "providerWeightsAreOmegaTrained = $false" in s
    assert "r211_sovereign_proof_index_latest.json" in s
    assert "fullAcceptanceRecordCount" in s
    assert "OMEGA_TOKEN" not in s
    assert "OMEGA_RELEASE_LEASE" not in s


def test_r221_supports_nonmutating_report_only_mode():
    s = source()
    assert "[switch]$ReportOnly" in s
    assert "REPORT_ONLY_NO_REPAIR_ATTEMPTED" in s
    assert "if (-not $ReportOnly)" in s
    assert "reportOnly = [bool]$ReportOnly" in s
