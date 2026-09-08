from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LEGACY_LAUNCHER = ROOT / "scripts" / "LAUNCH_OMEGA_V6_WINDOWS.ps1"
GATEWAY = ROOT / "scripts" / "START_OMEGA_SOVEREIGN.ps1"
CURRENT = ROOT / "scripts" / "START_OMEGA_R222_FULL_HYBRID.ps1"
INSTALLER = ROOT / "scripts" / "INSTALL_OMEGA_V6_WINDOWS.ps1"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r206_launcher_keeps_one_canonical_localhost_identity_through_successor_gateway():
    legacy = read(LEGACY_LAUNCHER)
    gateway = read(GATEWAY)
    current = read(CURRENT)
    assert "START_OMEGA_SOVEREIGN.ps1" in legacy
    assert "START_OMEGA_R222_FULL_HYBRID.ps1" in gateway
    assert "$Port = 8127" in current
    assert "$Port++" not in current
    assert "OMEGA_R222_FULL_HYBRID_SINGLE_INSTANCE" in current
    assert "WaitOne(0" in current
    assert "No duplicate launcher was started" in current
    assert "R222 will not kill it or start a duplicate runtime" in current


def test_r206_windows_delegation_uses_argument_boundaries_not_literal_quote_characters():
    legacy = read(LEGACY_LAUNCHER)
    gateway = read(GATEWAY)
    # R222 strengthens the old R206 delegation contract: the server identity is now an
    # explicit argument as well as the gateway path, while array splatting continues to
    # preserve Windows argument boundaries without embedding literal quote characters.
    assert "$args = @('-NoProfile','-ExecutionPolicy','Bypass','-File',$Gateway,'-ProductionBase',$ProductionBase)" in legacy
    assert "$invoke = @('-NoProfile','-ExecutionPolicy','Bypass','-File',$Implementation,'-ProductionBase',$ProductionBase)" in gateway
    assert "$env:OMEGA_SERVER_OVERRIDE" in legacy
    assert "$env:OMEGA_SERVER_OVERRIDE" in gateway
    assert '"`"$Gateway`""' not in legacy
    assert '"`"$Implementation`""' not in gateway
    assert '"`"$ProductionBase`""' not in legacy
    assert '"`"$ProductionBase`""' not in gateway


def test_r206_approved_repository_root_binding_survives_r207_and_r222_successors():
    legacy = read(LEGACY_LAUNCHER)
    current = read(CURRENT)
    assert "START_OMEGA_SOVEREIGN.ps1" in legacy
    assert "$env:OMEGA_ROOT_OVERRIDE" in current
    assert "Join-Path $Root 'scripts\\omega_sovereign_agent.py'" in current
    assert '"$LocalBase/api/hybrid/enrollment"' in current
    assert '"$ProductionBase/api/hybrid/enroll"' in current
    assert "'--root', \"`\"$Root`\"\"" in current
    assert "-WorkingDirectory $Root" in current
    assert "approvedRoot = $Root" in current


def test_r206_launcher_never_promotes_pending_heartbeat_to_online_after_successor_migration():
    current = read(CURRENT)
    assert "[bool]$hybrid.heartbeatCurrent" in current
    assert "[bool]$hybrid.authenticated" in current
    assert "[bool]$hybrid.pcOnline" in current
    assert "$hybrid.proof.agent_id -eq $DeviceId" in current
    assert "Outbound agent did not establish current authenticated cloud heartbeat" in current


def test_r206_installer_requires_native_rcwa_and_persists_stable_entry_point():
    text = read(INSTALLER)
    assert 'pip install -e "$Root[dev,rcwa]"' in text
    assert "omega_runtime.rcwa_solver --probe" in text
    assert '"available"\\s*:\\s*true' in text
    assert "test_r175_independent_solver_validation.py" in text
    assert "test_r222_hybrid_bootstrap_single_instance.py" in text
    assert "test_repair_system_contract.py" in text
    assert "GetFolderPath('Startup')" in text
    assert "OMEGA Sovereign Continuity.lnk" in text
    assert "START_OMEGA_SOVEREIGN.ps1" in text
