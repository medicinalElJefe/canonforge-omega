from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"


def test_r160_environment_shell_is_wired_and_truth_bounded():
    env = (SRC / "omegaEnvironmentShell.ts").read_text(encoding="utf-8")
    sovereign = (SRC / "sovereignVisualShell.ts").read_text(encoding="utf-8")

    assert "OMEGA_ENVIRONMENT_SHELL_BOUNDARY" in env
    assert "Observation, interpretation, hypothesis, canonical state, permission, execution, outcome and proof remain distinct" in env
    assert "Reasoning may propose" in env
    assert "data-oes-app=\"Field\"" in env
    assert "data-oes-app=\"Earth\"" in env
    assert "data-oes-app=\"Assistant\"" in env
    assert "data-oes-app=\"Hybrid\"" in env
    assert "data-oes-app=\"Proof\"" in env
    assert "/api/convergence/edge" in env
    assert "/api/hybrid/status" in env
    assert "/api/development/status" in env
    assert "authenticated host" in env
    assert "no host proof" in env
    assert "unobserved" in env
    assert "omegaEnvironmentShell='r160'" in env

    assert 'import { enhanceOmegaEnvironmentShell } from "./omegaEnvironmentShell";' in sovereign
    assert "enhanceOmegaEnvironmentShell(await lattice)" in sovereign


def test_r160_does_not_create_shadow_authority_or_fake_execution():
    env = (SRC / "omegaEnvironmentShell.ts").read_text(encoding="utf-8")

    forbidden = [
        "pc_online:true",
        "heartbeat_current:true",
        "execution_success:true",
        "EARTH_LIVE=true",
    ]
    for token in forbidden:
        assert token not in env

    assert "second state authority" in env
    assert "never invents heartbeat" in env
    assert "successful outcome" in env
    assert "source interfaces reachable" in env
