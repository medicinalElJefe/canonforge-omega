from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RECOVERY = ROOT / "scripts" / "RECOVER_OMEGA_V6_WINDOWS.ps1"
RECOVERY_BAT = ROOT / "RECOVER_OMEGA_V6_WINDOWS.bat"
INSTALLER = ROOT / "scripts" / "INSTALL_OMEGA_V6_WINDOWS.ps1"


def text(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def test_r209_recovery_is_exact_canonical_fast_forward_only():
    source = text(RECOVERY)
    required = [
        "OMEGA_PHYSICAL_HOST_RECOVERY_R209",
        "omega-v6-full-convergence",
        "medicinalElJefe/canonforge-omega",
        "ls-remote",
        "merge-base",
        "--is-ancestor",
        "merge','--ff-only",
        "BLOCKED_DIRTY_WORKTREE",
        "BLOCKED_NON_FAST_FORWARD",
        "BLOCKED_REMOTE_RACE",
        "BLOCKED_UNTRUSTED_REMOTE",
        "BLOCKED_WRONG_BRANCH",
        "LOCAL_RECOVERY_OBSERVATION_NOT_CANON",
        "recoveryProvesPhysicalAcceptance = $false",
    ]
    for token in required:
        assert token in source, token


def test_r209_recovery_forbids_destructive_git_repair_and_secret_persistence():
    source = text(RECOVERY).lower()
    forbidden = [
        "git reset --hard",
        "git checkout -f",
        "git switch -f",
        "git rebase",
        "git stash",
        "push --force",
        "push -f",
        "omega_token",
        "pairingtoken",
        "reg add",
        "new-service",
        "set-service",
        "powercfg",
    ]
    for token in forbidden:
        assert token not in source, token


def test_r209_one_click_wrapper_and_installer_handoff_exist():
    recovery = text(RECOVERY)
    wrapper = text(RECOVERY_BAT)
    installer = text(INSTALLER)
    assert "INSTALL_OMEGA_V6_WINDOWS.ps1" in recovery
    assert "PROVE_OMEGA_V6_WINDOWS.ps1" in recovery
    assert "RECOVER_OMEGA_V6_WINDOWS.ps1" in wrapper
    assert "canonical-root.txt" in installer
    assert "OMEGA V6 Sovereign Continuity.lnk" in installer
