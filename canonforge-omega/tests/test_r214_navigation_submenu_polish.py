from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"


def test_r214_control_deck_is_layered_on_preserved_r193_r195_navigation():
    nav = (SRC / "system" / "oneSystemNavigationR195.ts").read_text()
    assert 'ONE_SYSTEM_NAVIGATION_RELEASE_R195 = "r195-drive-corpus-one-system"' in nav
    assert 'NAVIGATION_POLISH_RELEASE_R214 = "r214-submenu-navigation-polish"' in nav
    assert 'id="omegaR193Rail"' in nav
    assert 'data-r195-one-system="true"' in nav
    assert 'id="omegaR214ControlMenu"' in nav
    assert 'data-r214-section="advanced"' in nav
    assert '<details id="omegaR214ControlMenu"' in nav
    assert '<summary aria-label="Open advanced system controls">' in nav
    assert 'x-omega-navigation-polish' in nav


def test_r214_control_deck_reaches_current_operator_and_proof_surfaces():
    nav = (SRC / "system" / "oneSystemNavigationR195.ts").read_text()
    for href in (
        'href="/system"',
        'href="/truth"',
        'href="/instrument"',
        'href="/convergence"',
        'href="/evolution"',
        'href="/?app=Earth"',
        'href="/?app=Hybrid"',
        'href="/?app=Proof"',
    ):
        assert href in nav
    assert "aria-current','page'" in nav
    assert "menu.open=true" in nav
    assert "innerWidth>760" in nav
    assert "@media(max-width:760px)" in nav


def test_r214_does_not_create_new_runtime_or_execution_authority():
    nav = (SRC / "system" / "oneSystemNavigationR195.ts").read_text()
    entry = (SRC / "runtimeEntryR169.ts").read_text()
    wrangler = (ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml").read_text()

    assert 'main = "src/runtimeEntryR169.ts"' in wrangler
    assert 'return enhanceWholeSystemSurfaceR205(finalResponse)' in entry
    assert 'enhanceOneSystemNavigationR195' in entry
    assert 'enhanceEarthSarIntegratedRepairR198_1' in entry
    assert 'enhanceEarthSarVisualContextR198_2' in entry
    assert "new Response(html" in nav
    assert "handleOneSystemOperatorR199" not in nav
    assert "canonicalMutation" not in nav
    assert "promotionAuthorized" not in nav


def test_r214_markup_insertion_is_balanced_and_idempotent_by_construction():
    nav = (SRC / "system" / "oneSystemNavigationR195.ts").read_text()
    assert "!html.includes('id=\"omegaR214ControlMenu\"')" in nav
    assert 'const advanced = `<section class="r193Section" data-r214-section="advanced">' in nav
    assert 'html.replace(marker, `${advanced}${marker}`)' in nav
    assert '`${controlSubmenuMarkup(pathname)}</section>${marker}`' not in nav
    assert nav.count('id="omegaR214ControlMenu"') >= 2  # markup + idempotence guard/runtime selector


def test_r214_preserves_existing_system_and_residual_surfaces():
    nav = (SRC / "system" / "oneSystemNavigationR195.ts").read_text()
    for fragment in (
        'href="/system"',
        'id="r195ResidualCard"',
        '/api/system/r195/restoration?limit=24',
        'reconstituteOneSystemR199',
        'correlateOneSystemTruthStripR199',
        'enhanceOneSystemOperatorSurfaceR199',
        'enhanceMissionSurfaceR200',
    ):
        assert fragment in nav
