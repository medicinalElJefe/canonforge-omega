from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LAUNCHER = ROOT / "scripts" / "LAUNCH_OMEGA_V6_WINDOWS.ps1"
INSTALLER = ROOT / "scripts" / "INSTALL_OMEGA_V6_WINDOWS.ps1"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r207_consumes_pairing_envelope_but_runs_repository_agent_with_verified_venv():
    text = read(LAUNCHER)
    assert "param(" in text and "[switch]$NoBrowser" in text
    assert "Join-Path $Root '.venv\\Scripts\\python.exe'" in text
    assert "Join-Path $Root 'scripts\\omega_sovereign_agent.py'" in text
    assert "Join-Path $Root '.omega_pairing_once.cmd'" in text
    assert "requesting one-time pairing envelope" in text
    assert "set \"OMEGA_TOKEN=([^\"\\r\\n]+)\"" in text
    assert "set \"OMEGA_SERVER=([^\"\\r\\n]+)\"" in text
    assert "Remove-Item $PairingEnvelope" in text
    assert "Start-Process -FilePath $Vpy" in text
    assert "--token" in text and "--root" in text and "--interval" in text
    assert "Start-Process -FilePath $env:ComSpec" not in text


def test_r207_keeps_pc_online_claim_behind_current_heartbeat_proof():
    text = read(LAUNCHER)
    assert "$hybrid.heartbeatCurrent -or $hybrid.pcOnline" in text
    assert "PC ONLINE is still proof-gated" in text
    assert "sovereign heartbeat is still pending and is not being promoted to PC ONLINE" in text


def test_r207_startup_continuity_is_headless_but_desktop_launch_remains_interactive():
    text = read(INSTALLER)
    assert "OMEGA V6 Sovereign Continuity.lnk" in text
    assert "-NoBrowser" in text
    assert "OMEGA V6.lnk" in text


def test_r207_windows_install_keeps_native_rcwa_and_adds_r207_gate():
    text = read(INSTALLER)
    assert 'pip install -e "$Root[dev,rcwa]"' in text
    assert "omega_runtime.rcwa_solver --probe" in text
    assert "test_r175_independent_solver_validation.py" in text
    assert "test_r207_windows_verified_venv_launch.py" in text
