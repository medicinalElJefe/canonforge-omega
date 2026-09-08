from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LEGACY_LAUNCHER = ROOT / "scripts" / "LAUNCH_OMEGA_V6_WINDOWS.ps1"
GATEWAY = ROOT / "scripts" / "START_OMEGA_SOVEREIGN.ps1"
CURRENT = ROOT / "scripts" / "START_OMEGA_R222_FULL_HYBRID.ps1"
INSTALLER = ROOT / "scripts" / "INSTALL_OMEGA_V6_WINDOWS.ps1"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r207_consumes_authenticated_enrollment_but_runs_repository_agent_with_verified_venv():
    legacy = read(LEGACY_LAUNCHER)
    gateway = read(GATEWAY)
    current = read(CURRENT)
    assert "param(" in legacy and "[switch]$NoBrowser" in legacy
    assert "START_OMEGA_SOVEREIGN.ps1" in legacy
    assert "START_OMEGA_R222_FULL_HYBRID.ps1" in gateway
    assert "Join-Path $Root '.venv\\Scripts\\python.exe'" in current
    assert "Join-Path $Root 'scripts\\omega_sovereign_agent.py'" in current
    assert "/api/hybrid/r222/local-contract" in current
    assert "/api/hybrid/enrollment" in current
    assert "/api/hybrid/enroll" in current
    assert "Start-Process -FilePath $Vpy" in current
    assert "--token" in current and "--root" in current and "--interval" in current
    assert "Start-Process -FilePath $env:ComSpec" not in current


def test_r207_keeps_pc_online_claim_behind_current_heartbeat_proof_after_successor_migration():
    text = read(CURRENT)
    assert "[bool]$hybrid.heartbeatCurrent" in text
    assert "[bool]$hybrid.authenticated" in text
    assert "[bool]$hybrid.pcOnline" in text
    assert "$hybrid.proof.agent_id -eq $DeviceId" in text
    assert "Outbound agent did not establish current authenticated cloud heartbeat" in text


def test_r207_startup_continuity_is_headless_but_desktop_launch_remains_interactive_through_gateway():
    text = read(INSTALLER)
    assert "OMEGA Sovereign Continuity.lnk" in text
    assert "-NoBrowser -SkipAcceptanceProof" in text
    assert "OMEGA V6.lnk" in text
    assert "START_OMEGA_SOVEREIGN.ps1" in text


def test_r207_windows_install_keeps_native_rcwa_and_adds_successor_repair_gates():
    text = read(INSTALLER)
    assert 'pip install -e "$Root[dev,rcwa]"' in text
    assert "omega_runtime.rcwa_solver --probe" in text
    assert "test_r175_independent_solver_validation.py" in text
    assert "test_r207_windows_verified_venv_launch.py" in text
    assert "test_r222_hybrid_bootstrap_single_instance.py" in text
    assert "test_repair_system_contract.py" in text
