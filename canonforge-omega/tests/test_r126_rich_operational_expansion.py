from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UI = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "launchHdNavigation.ts"
WRANGLER = ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml"
HEARTBEAT = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "heartbeatTruth.ts"


def test_r126_preserves_canonical_runtime_authority():
    wrangler = WRANGLER.read_text(encoding="utf-8")
    heartbeat = HEARTBEAT.read_text(encoding="utf-8")
    assert 'main = "src/heartbeatTruth.ts"' in wrangler
    assert 'class_name = "OmegaRuntime"' in wrangler
    assert 'binding = "GENESIS"' in wrangler
    assert 'RICH_OPERATIONAL_UI_ID = "r126-rich-operational-expansion"' in wrangler
    assert "PC ONLINE requires" in heartbeat
    assert "handleCapabilityRequest" in heartbeat


def test_r126_extends_existing_rich_ui_instead_of_replacing_it():
    text = UI.read_text(encoding="utf-8")
    assert 'text.includes(\'id="nav"\')' in text
    assert "Living Field" in text
    assert "Earth Now" in text
    assert "Assistant" in text
    assert "Sovereign Build" in text
    assert "Proof & Rollback" in text
    assert "Living Calculus" in text
    assert "Living Memory" in text
    assert "State-Space Simulation" in text


def test_r126_calculus_is_manipulable_and_state_driven():
    text = UI.read_text(encoding="utf-8")
    for token in ["CΩ continuity", "Φ future plasticity", "Λ burden", "q contradiction", "phase", "omegaDt"]:
        assert token in text
    assert "USER_DEFINED_MODEL" in text
    assert "SIMULATED_CONTINUATION" in text
    assert "Ω score = (CΩ × Φ) / (q + Λ + ε)" in text
    assert "state.shell===144?4:state.shell===1728?8:12" in text
    assert "requestAnimationFrame(drawCalc)" in text
    for role in ["ALPHA", "BASE", "CONSTRUCT", "PRUNE", "OMEGA"]:
        assert role in text


def test_r126_memory_and_simulation_are_material_workspaces():
    text = UI.read_text(encoding="utf-8")
    assert "continuity + scar graph" in text
    assert "omegaMemoryCanvas" in text
    assert "Canonical" in text and "Scar" in text and "Relations" in text and "Forecast" in text
    assert "omegaBranchStay" in text
    assert "omegaBranchTurn" in text
    assert "omegaBranchEsc" in text
    assert "STAY" in text and "TURN" in text and "ESCALATE" in text
    assert "/api/omega/state" in text


def test_r126_keeps_representation_shell_truth_boundary():
    text = UI.read_text(encoding="utf-8")
    assert "144 representation shell" in text
    assert 'data-omega-shell="1728"' in text
    assert 'data-omega-shell="20736"' in text
    assert "physical-dimension" not in text.lower()
