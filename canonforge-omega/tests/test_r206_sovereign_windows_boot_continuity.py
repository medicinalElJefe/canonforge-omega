from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LAUNCHER = ROOT / "scripts" / "LAUNCH_OMEGA_V6_WINDOWS.ps1"
INSTALLER = ROOT / "scripts" / "INSTALL_OMEGA_V6_WINDOWS.ps1"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r206_launcher_keeps_one_canonical_localhost_identity():
    text = read(LAUNCHER)
    assert "$Port = 8127" in text
    assert "$Port++" not in text
    assert "Get-HealthyOmegaRuntime" in text
    assert "reusing healthy canonical localhost runtime" in text
    assert "will not silently move the canonical Hybrid endpoint" in text


def test_r206_launcher_binds_pairing_launcher_to_approved_repository_root():
    text = read(LAUNCHER)
    assert '"$Base/api/hybrid/launcher"' in text
    assert "Join-Path $Root 'START_OMEGA_PC_LINK.cmd'" in text
    assert "OMEGA Sovereign PC Link" in text
    assert "/api/hybrid/agent" in text
    assert "omega_sovereign_agent\\.py" in text
    assert "Start-Process -FilePath $env:ComSpec" in text
    assert "-WorkingDirectory $Root" in text


def test_r206_launcher_never_promotes_pending_heartbeat_to_online():
    text = read(LAUNCHER)
    assert "$hybrid.heartbeatCurrent -or $hybrid.pcOnline" in text
    assert "sovereign heartbeat is still pending and is not being promoted to PC ONLINE" in text


def test_r206_installer_requires_native_rcwa_and_persists_same_entry_point():
    text = read(INSTALLER)
    assert 'pip install -e "$Root[dev,rcwa]"' in text
    assert "omega_runtime.rcwa_solver --probe" in text
    assert '"available"\\s*:\\s*true' in text
    assert "test_r175_independent_solver_validation.py" in text
    assert "GetFolderPath('Startup')" in text
    assert "OMEGA V6 Sovereign Continuity.lnk" in text
    assert "LAUNCH_OMEGA_V6_WINDOWS.ps1" in text
