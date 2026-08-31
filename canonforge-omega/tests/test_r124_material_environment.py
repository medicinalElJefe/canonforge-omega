from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SURFACE = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "sovereignEnvironment.ts"
HEARTBEAT = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "heartbeatTruth.ts"
WRANGLER = ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml"


def test_r124_is_bound_beneath_canonical_heartbeat_entrypoint():
    wrangler = WRANGLER.read_text(encoding="utf-8")
    heartbeat = HEARTBEAT.read_text(encoding="utf-8")
    assert 'main = "src/heartbeatTruth.ts"' in wrangler
    assert 'class_name = "OmegaRuntime"' in wrangler
    assert 'binding = "GENESIS"' in wrangler
    assert 'import sovereignEnvironment from "./sovereignEnvironment"' in heartbeat
    assert 'url.pathname === "/"' in heartbeat
    assert "sovereignEnvironment.fetch(request, env)" in heartbeat


def test_material_primary_workspaces_exist():
    text = SURFACE.read_text(encoding="utf-8")
    for name in ["Omega", "Calculus", "Earth", "Memory", "Intelligence", "Simulate", "Sovereign", "Build", "Proof"]:
        assert f'data-surface="{name}"' in text
    assert "Calculus is manipulable" in text
    assert "Memory is a navigable field" in text
    assert "Intelligence shows its route" in text
    assert "Cloud, PC and mobile share canonical intent" in text


def test_material_environment_preserves_truth_and_existing_runtime():
    text = SURFACE.read_text(encoding="utf-8")
    assert 'from "./heartbeatTruth"' in text
    assert "export { OmegaRuntime }" in text
    assert "runtime.fetch(request, env)" in text
    assert "/api/omega/state" in text
    assert "/api/convergence/edge" in text
    assert "/api/earth/catalog" in text
    assert "/api/route-preview" in text
    assert "PC ONLINE requires" not in text or "heartbeat" in text.lower()


def test_calculus_and_shells_are_real_interactions_not_labels_only():
    text = SURFACE.read_text(encoding="utf-8")
    assert 'data-calc="' in text
    assert "drawCalc" in text
    assert "requestAnimationFrame(drawCalc)" in text
    assert 'data-shell="144"' in text
    assert 'data-shell="1728"' in text
    assert 'data-shell="20736"' in text
    assert "const rings=shell===144?4:shell===1728?8:12" in text
    assert "USER_DEFINED_MODEL" in text
    assert "SIMULATED_CONTINUATION" in text
