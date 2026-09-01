import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WRAPPER = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "virtualLatticeDisplay.ts"
WORKFLOW = ROOT.parent / ".github" / "workflows" / "omega-v6-visual-delivery.yml"


def header_contract(source: str, name: str) -> str:
    match = re.search(rf'headers\.set\("{re.escape(name)}", "([^"]+)"\)', source)
    assert match, f"missing {name} in virtualLatticeDisplay.ts"
    return match.group(1)


def test_r163_public_delivery_uses_current_source_contracts():
    source = WRAPPER.read_text(encoding="utf-8")
    workflow = WORKFLOW.read_text(encoding="utf-8")

    visual_contract = header_contract(source, "x-omega-visual-contract")
    field_contract = header_contract(source, "x-omega-field-contract")

    assert visual_contract in workflow
    assert field_contract in workflow
    assert "recovered-experience-orchestration" in visual_contract
    assert "drag-pan+wheel-pinch-zoom+probe+pause-reset" in field_contract


def test_r163_public_delivery_requires_living_field_markers():
    workflow = WORKFLOW.read_text(encoding="utf-8")
    for marker in [
        "EXPECTED_FIELD_RELEASE: r163-immersive-living-field",
        "x-omega-field-release",
        "x-omega-field-contract",
        "omegaInteractiveFieldRelease",
        "omegaFieldFrame",
        "omega-field-reset",
        "DRAG TO EXPLORE",
        "PUBLIC_BUILD_EVOLUTION_AND_FIELD_VERIFIED",
    ]:
        assert marker in workflow
