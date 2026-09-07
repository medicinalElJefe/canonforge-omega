from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
SRC = WORKER / "src"
R199 = (SRC / "system" / "oneSystemCorrelationR199.ts").read_text(encoding="utf-8")
NAV195 = (SRC / "system" / "oneSystemNavigationR195.ts").read_text(encoding="utf-8")
ENTRY = (SRC / "runtimeEntryR169.ts").read_text(encoding="utf-8")


def test_r199_restores_exact_twelve_function_operator_contract():
    labels = [
        "LAUNCH",
        "HOST INTAKE",
        "STATE MANIFOLD",
        "20,736 EXPAND",
        "RENDERER",
        "TRAVERSAL",
        "FORECAST",
        "PROOF",
        "AUDIO",
        "AI ASSIST",
        "RECOVERY",
        "PACKAGING",
    ]
    assert R199.count('id: "MENU-') == 12
    for label in labels:
        assert f'label: "{label}"' in R199


def test_r199_reasserts_one_authority_and_canonical_flow():
    for marker in [
        "ONE_HOSTSTATE_ONE_CANONSTATE_ONE_RENDER_AUTHORITY",
        "OPERATOR_TO_CONTROL_TO_RUNTIME_TO_STATE_TO_RENDER_TO_RECEIPT_TO_PROOF",
        "LIVE_FIELD_MEMBRANE_NOT_DECORATIVE_GRAPHICS",
        "NO_ORPHAN_FEATURE",
        "NO_SHADOW_STATE_AUTHORITY",
        "NO_SECONDARY_SEMANTIC_ENGINE",
        "NO_FEATURE_SPECIFIC_GLOBAL_NAVIGATION",
        "DISCOVERED_TO_AUTHORIZED_TO_AVAILABLE_TO_INVOKED_TO_RETURNED_TO_VERIFIED",
    ]:
        assert marker in R199


def test_r199_replaces_competing_global_chrome_instead_of_stacking_another_rail():
    assert "#omegaUniversalNavR192,#omegaR193Rail,#omegaR193Open,#omegaR193Command,#omegaR193Palette{display:none!important}" in R199
    assert 'id="omegaOneSystemR199"' in R199
    assert 'id="omegaR199Drawer"' in R199
    assert "body{padding-left:0!important" in R199
    assert "transform:translateX(-102%)" in R199
    assert "body.r199Open #omegaR199Drawer" in R199
    assert "position:fixed" in R199
    assert "width:min(390px,94vw)" in R199


def test_r199_keeps_domain_engines_upstream_and_does_not_reimplement_them():
    for marker in [
        "handleSwarmRequest",
        "handleSaiRequest",
        "handleDriveCorpusSystemR195",
        "handleComputeRequest",
        "handleValidationRequest",
        "handleFederatedOrganRequest",
        "handleEarthSarFusionR198",
    ]:
        assert marker in ENTRY
    assert "handleEarthSarFusionR198" not in R199
    assert "handleComputeRequest" not in R199
    assert "handleSaiRequest" not in R199


def test_r199_preserves_r195_release_identity_while_upgrading_its_role():
    assert 'ONE_SYSTEM_NAVIGATION_RELEASE_R195 = "r195-drive-corpus-one-system"' in NAV195
    assert 'from "./oneSystemCorrelationR199"' in NAV195
    assert "const preserved = new Response(html" in NAV195
    assert "return reconstituteOneSystemR199(preserved, pathname)" in NAV195
    assert 'headers.set("x-omega-one-system"' in NAV195
    assert 'headers.set("x-omega-one-system-correlation"' in NAV195
    assert "RESIDUAL RESTORATION / WEAKEST-LINK QUEUE" in NAV195


def test_r199_truthfully_exposes_unrestored_audio_instead_of_inventing_route():
    assert 'label: "AUDIO", href: "#"' in R199
    assert 'state: "RESTORE_REQUIRED"' in R199
    assert "MENU_09_AUDIO_HAS_ARCHIVE_AUTHORITY_BUT_NO_ADMITTED_CANONICAL_CLOUD_SURFACE" in R199
    assert "does not yet have an admitted canonical cloud execution surface" in R199


def test_r199_preserves_20736_as_atlas_resolution_not_physical_dimension():
    assert 'href: "/?app=Field&shell=20736"' in R199
    assert "Address-resolution expansion without claiming physical dimension" in R199
    assert "NO_PHYSICAL_DIMENSION_CLAIM_FROM_ATLAS_RESOLUTION" in R199


def test_r199_mobile_and_desktop_keep_primary_field_uncovered_when_closed():
    assert "body{padding-left:0!important" in R199
    assert "@media(max-width:760px)" in R199
    assert "--r199bar:44px" in R199
    assert "r199Open" in R199
    assert "opacity:0;pointer-events:none" in R199
