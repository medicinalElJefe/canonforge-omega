from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"
WRANGLER = ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml"


def text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r129_is_additive_beneath_protected_heartbeat_entrypoint():
    heartbeat = text(SRC / "heartbeatTruth.ts")
    wrangler = text(WRANGLER)
    assert 'main = "src/heartbeatTruth.ts"' in wrangler
    assert 'BUILD_ID = "r87-semantic-edge-settle-proof"' in wrangler
    assert 'from "./sovereignVisualShell"' in heartbeat
    assert "enhanceSovereignVisualShell" in heartbeat
    assert "enforceHeartbeatTruth" in heartbeat
    assert "roleSeparatedManifestReady" in heartbeat
    assert "syntheticCameraResponse" in heartbeat


def test_r129_visual_motion_is_runtime_reactive_not_fake_state():
    shell = text(SRC / "sovereignVisualShell.ts")
    for token in [
        "/api/convergence/edge",
        "/api/hybrid/status",
        "/api/development/status",
        "capability_count",
        "pc_online",
        "authority_contract_ready",
        "prefers-reduced-motion",
        "visual shell does not mutate canonical state",
    ]:
        assert token in shell
    assert "canonical state" in shell
    assert "invent evidence" in shell


def test_r129_adds_context_rail_continuity_ribbon_and_mobile_contract():
    shell = text(SRC / "sovereignVisualShell.ts")
    for token in [
        "omegaFieldMembrane",
        "omegaContextRail",
        "omegaContinuityRibbon",
        "omegaContextToggle",
        "SOVEREIGN ENVIRONMENT",
        "@media(max-width:760px)",
    ]:
        assert token in shell
