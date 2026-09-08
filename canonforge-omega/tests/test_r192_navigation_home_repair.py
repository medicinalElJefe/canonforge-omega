from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
SRC = WORKER / "src"


def test_r192_preserves_r169_entrypoint_and_wraps_only_public_html():
    wrangler = (WORKER / "wrangler.toml").read_text()
    entry = (SRC / "runtimeEntryR169.ts").read_text()
    assert 'main = "src/runtimeEntryR169.ts"' in wrangler
    assert 'import { enhanceUniversalNavigationR192 } from "./universalNavigationR192"' in entry
    assert "async function publicFetch" in entry
    assert "const response = await runtimeFetch(request, env, ctx)" in entry
    assert "enhanceUniversalNavigationR192(response, new URL(request.url).pathname)" in entry
    assert "export default { fetch: publicFetch }" in entry


def test_universal_navigation_reaches_every_primary_human_surface():
    nav = (SRC / "universalNavigationR192.ts").read_text()
    for route in (
        '"/"',
        '"/fabric"',
        '"/instrument"',
        '"/clouds"',
        '"/sai"',
        '"/compute"',
        '"/validate"',
        '"/truth"',
        '"/convergence"',
    ):
        assert route in nav
    assert 'return `<a role="menuitem" class="${active.trim()}" href="${href}"${current}>' in nav
    for secondary in ('"/core"', '"/capabilities"', '"/evolution"', '"/federation"', '"/system"'):
        assert f'menuLink(pathname, {secondary}' in nav


def test_home_no_longer_starts_behind_the_full_screen_launcher():
    nav = (SRC / "universalNavigationR192.ts").read_text()
    launch = (SRC / "launchHdNavigation.ts").read_text()
    assert "document.body.classList.add('omegaLaunchOpen')" in launch  # inherited launcher remains available
    assert "html.replace('<div id=\"omegaLaunch\">', '<div id=\"omegaLaunch\" class=\"hidden\">')" in nav
    assert "launch?.classList.add('hidden')" in nav
    assert "document.body.classList.remove('omegaLaunchOpen')" in nav
    assert "sessionStorage.setItem('omega_launch_seen','1')" in nav


def test_r169_primary_routes_remain_present_under_r192():
    dispatcher = (SRC / "runtimeEntryR169.ts").read_text()
    required_fragments = (
        'url.pathname === "/truth"',
        'url.pathname === "/compute"',
        'url.pathname === "/sai"',
        'url.pathname === "/validate"',
        'url.pathname === "/federation"',
        'url.pathname === "/clouds"',
        'handleUniversalSurfaceFabricR191',
        'handleWholeInstrumentR189',
        'handleWholeSystemAcceptanceR190',
    )
    for fragment in required_fragments:
        assert fragment in dispatcher
