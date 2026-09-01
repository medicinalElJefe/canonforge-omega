from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"


def text(name: str) -> str:
    return (SRC / name).read_text(encoding="utf-8")


def test_worker_entry_authority_is_unchanged():
    wrangler = (ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml").read_text(encoding="utf-8")
    heartbeat = text("heartbeatTruth.ts")
    assert 'main = "src/heartbeatTruth.ts"' in wrangler
    assert "export { OmegaRuntime }" in heartbeat
    assert "enhanceSovereignVisualShell" in heartbeat


def test_calculus_is_mounted_inside_existing_compositor():
    lattice = text("virtualLatticeDisplay.ts")
    calculus = text("calculusInstrument.ts")
    assert 'import { enhanceCalculusInstrument } from "./calculusInstrument";' in lattice
    assert "rendered = await enhanceCalculusInstrument(rendered);" in lattice
    assert "CALCULUS_INSTRUMENT_BOUNDARY" in calculus
    assert "/api/omega/state" in calculus
    assert "does not mutate canonical state" in calculus


def test_one_environment_navigation_exposes_acceptance_workspaces():
    acceptance = text("unifiedWorkspaceAcceptance.ts")
    environment = text("omegaEnvironmentShell.ts")
    assert "#omegaEnvironmentDeck .oesWorkspaces" in acceptance
    for label in ["CALCULUS", "MEMORY", "CREATE / SIMULATE", "BUILD / EVOLUTION"]:
        assert label in acceptance
    for label in ["FIELD", "EARTH", "INTELLIGENCE", "SOVEREIGN", "PROOF"]:
        assert label in environment
    assert "second state" in acceptance
    assert "second state authority" in environment


def test_specialized_workspaces_use_existing_instruments_not_shadow_apps():
    acceptance = text("unifiedWorkspaceAcceptance.ts")
    assert "data-oes-workspace" in acceptance
    assert "location.assign" in acceptance
    assert "omega-acceptance-instrument-active" in acceptance
    assert "omegaRootSovereignField" in acceptance
    assert "surface.app.active" in acceptance
    assert "fetch('/api/chat'" not in acceptance
