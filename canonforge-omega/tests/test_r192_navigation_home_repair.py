from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
SRC = WORKER / "src"


def test_r192_is_the_worker_entrypoint_without_replacing_r169_dispatcher():
    wrangler = (WORKER / "wrangler.toml").read_text()
    wrapper = (SRC / "runtimeEntryR192.ts").read_text()
    assert 'main = "src/runtimeEntryR192.ts"' in wrangler
    assert 'import runtime from "./runtimeEntryR169"' in wrapper
    assert 'enhanceUniversalNavigationR192' in wrapper
    for export_name in (
        "OmegaRuntime",
        "OmegaSwarmCell",
        "OmegaSwarmCoordinator",
        "OmegaSwarmBranch",
        "OmegaSwarmOrgan",
        "OmegaSwarmOrganismCoordinator",
        "OmegaSwarmAutonomicCoordinator",
    ):
        assert export_name in wrapper


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
    for secondary in ('href="/core"', 'href="/capabilities"', 'href="/evolution"', 'href="/federation"'):
        assert secondary in nav


def test_home_no_longer_starts_behind_the_full_screen_launcher():
    nav = (SRC / "universalNavigationR192.ts").read_text()
    launch = (SRC / "launchHdNavigation.ts").read_text()
    assert "document.body.classList.add('omegaLaunchOpen')" in launch  # inherited behavior remains preserved
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
