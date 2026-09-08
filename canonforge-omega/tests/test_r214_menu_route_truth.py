from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"
MENU = SRC / "menuTruthR214.ts"
WORKSPACE = SRC / "universalWorkspaceR193.ts"
RUNTIME = SRC / "runtimeEntryR169.ts"

WORKSPACE_HREFS = (
    "/?app=Field",
    "/?app=Calculus&mode=dewey-calculus",
    "/?app=Memory",
    "/?app=Simulate",
    "/?app=Earth",
    "/?app=Assistant",
    "/?app=Hybrid",
    "/?app=Proof",
)

SYSTEM_HREFS = (
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
)


def read(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def test_r214_declares_every_r193_workspace_and_system_menu_target():
    menu = read(MENU)
    workspace = read(WORKSPACE)
    for href in WORKSPACE_HREFS + SYSTEM_HREFS:
        assert href in workspace, f"R193 visible navigation target disappeared: {href}"
        assert f'href: "{href}"' in menu, f"R214 route truth missing visible target: {href}"
    assert "itemCount: MENU_TRUTH_ITEMS_R214.length" in menu


def test_r214_does_not_promote_declared_navigation_to_available_without_response():
    s = read(MENU)
    for token in (
        'availability: "UNPROBED_UNTIL_ROUTE_RESPONSE"',
        'availability: routeResponded ? "ROUTE_RESPONDED" : "ROUTE_UNAVAILABLE"',
        "response.status >= 200 && response.status < 400",
        'code: "UNDECLARED_MENU_TARGET"',
        'code: "CROSS_ORIGIN_MENU_TARGET_REJECTED"',
        "HTTP route response proves navigability only",
    ):
        assert token in s, token


def test_r214_menu_click_is_verified_before_navigation_and_failure_is_visible():
    s = read(MENU)
    for token in (
        "e.preventDefault()",
        "const ok=await probe(a)",
        "if(ok)location.href=a.href;else notice(a)",
        "OMEGA ROUTE UNAVAILABLE",
        'data-omega-route-state="UNAVAILABLE"',
    ):
        assert token in s, token


def test_r214_menu_truth_is_additive_under_r169_and_non_mutating():
    runtime = read(RUNTIME)
    menu = read(MENU)
    assert 'handleMenuTruthR214, enhanceMenuTruthR214' in runtime
    assert "handleMenuTruthR214(request, env, ctx, runtimeFetch)" in runtime
    assert "return enhanceMenuTruthR214(wholeSystem)" in runtime
    assert "canonicalMutation: false" in menu
    assert "promotionAuthorized: false" in menu
    assert "wrangler deploy" not in menu.lower()
