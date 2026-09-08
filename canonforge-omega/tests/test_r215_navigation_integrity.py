from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"

EXPECTED_WORKSPACES = {
    "/?app=Field",
    "/?app=Calculus&mode=dewey-calculus",
    "/?app=Memory",
    "/?app=Simulate",
    "/?app=Earth",
    "/?app=Assistant",
    "/?app=Hybrid",
    "/?app=Proof",
}

EXPECTED_SYSTEMS = {
    "/workbench",
    "/relations",
    "/calibration",
    "/capabilities",
    "/core",
    "/sai",
    "/compute",
    "/validate",
    "/validate/cross-runtime",
    "/validate/independent",
    "/clouds",
    "/warp",
    "/warp/build",
    "/federation",
    "/evolution",
    "/truth",
    "/convergence",
    "/fabric",
    "/instrument",
}


def _quoted_routes(block: str) -> set[str]:
    return set(re.findall(r'"(/[^"]*)"', block))


def test_r215_declared_workspace_and_system_route_contract_is_complete():
    source = (SRC / "universalWorkspaceR193.ts").read_text()
    workspace_block = source.split("const WORKSPACES = [", 1)[1].split("] as const;", 1)[0]
    system_block = source.split("const SYSTEMS = [", 1)[1].split("] as const;", 1)[0]
    assert _quoted_routes(workspace_block) == EXPECTED_WORKSPACES
    assert _quoted_routes(system_block) == EXPECTED_SYSTEMS


def test_r215_one_system_is_reachable_in_rail_control_deck_and_command_palette():
    nav = (SRC / "system" / "oneSystemNavigationR195.ts").read_text()
    assert 'NAVIGATION_INTEGRITY_RELEASE_R215 = "r215-command-palette-route-integrity"' in nav
    assert 'data-r195-one-system="true"' in nav
    assert 'href="/system"' in nav
    assert 'id="omegaR214ControlMenu"' in nav
    assert 'id="omegaNavigationIntegrityR215Runtime"' in nav
    assert "b.dataset.r193Href='/system'" in nav
    assert "b.dataset.r215System='true'" in nav
    assert "ONE SYSTEM" in nav
    assert "operator · mission · continuity · residual restoration" in nav


def test_r215_palette_integrity_runs_after_r193_render_paths_and_survives_search():
    nav = (SRC / "system" / "oneSystemNavigationR195.ts").read_text()
    workspace = (SRC / "universalWorkspaceR193.ts").read_text()
    assert "function render(term='')" in workspace
    assert "$('#r193Query')?.addEventListener('input',e=>render(e.target.value))" in workspace
    assert "query.addEventListener('input',later)" in nav
    assert "command?.addEventListener('click',later)" in nav
    assert "queueMicrotask(augment)" in nav
    assert "new MutationObserver(later).observe(palette" in nav
    assert "(e.ctrlKey||e.metaKey)" in nav
    assert "results.querySelector('[data-r215-system]')" in nav


def test_r215_navigation_layers_remain_non_mutating_and_preserve_runtime_authority():
    nav = (SRC / "system" / "oneSystemNavigationR195.ts").read_text()
    entry = (SRC / "runtimeEntryR169.ts").read_text()
    wrangler = (ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml").read_text()
    assert 'main = "src/runtimeEntryR169.ts"' in wrangler
    assert "enhanceOneSystemNavigationR195" in entry
    assert "enhanceWholeSystemSurfaceR205" in entry
    assert 'headers.set("x-omega-navigation-integrity", NAVIGATION_INTEGRITY_RELEASE_R215)' in nav
    for forbidden in (
        "canonicalMutation = true",
        "promotionAuthorized = true",
        "wrangler deploy",
        "CF_API_TOKEN",
        "deleteDeployment",
    ):
        assert forbidden not in nav


def test_r215_does_not_remove_r214_mobile_keyboard_or_residual_proofs():
    nav = (SRC / "system" / "oneSystemNavigationR195.ts").read_text()
    for required in (
        'NAVIGATION_POLISH_RELEASE_R214 = "r214-submenu-navigation-polish"',
        "@media(max-width:760px)",
        "e.key==='Escape'",
        "card.id='r195ResidualCard'",
        "/api/system/r195/restoration?limit=24",
        "reconstituteOneSystemR199",
        "correlateOneSystemTruthStripR199",
        "enhanceOneSystemOperatorSurfaceR199",
        "enhanceMissionSurfaceR200",
    ):
        assert required in nav
