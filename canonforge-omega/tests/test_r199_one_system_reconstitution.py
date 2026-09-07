from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
SRC = WORKER / "src"
R199 = (SRC / "system" / "oneSystemCorrelationR199.ts").read_text(encoding="utf-8")
TRUTH = (SRC / "system" / "oneSystemTruthStripR199.ts").read_text(encoding="utf-8")
OPERATOR = (SRC / "system" / "oneSystemOperatorR199.ts").read_text(encoding="utf-8")
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


def test_r199_preserves_r195_release_identity_recovery_then_final_projection():
    assert 'ONE_SYSTEM_NAVIGATION_RELEASE_R195 = "r195-drive-corpus-one-system"' in NAV195
    assert 'from "./oneSystemCorrelationR199"' in NAV195
    assert 'from "./oneSystemTruthStripR199"' in NAV195
    assert "const preserved = new Response(html" in NAV195
    assert "const reconstituted = await reconstituteOneSystemR199(preserved, pathname)" in NAV195
    assert "return correlateOneSystemTruthStripR199(reconstituted)" in NAV195
    assert 'headers.set("x-omega-one-system"' in NAV195
    assert 'headers.set("x-omega-one-system-correlation"' in NAV195
    assert "RESIDUAL RESTORATION / WEAKEST-LINK QUEUE" in NAV195


def test_r199_truth_strip_uses_existing_shared_convergence_packet_for_v6_genesis_hybrid():
    assert "/api/convergence/edge" in TRUTH
    assert "topology?.v6?.edge" in TRUTH
    assert "topology?.sovereign_pc" in TRUTH
    assert "pc.pc_online" in TRUTH
    assert "pc.heartbeat_current" in TRUTH
    assert "reciprocal_manifest_ready" in TRUTH
    assert "authority_contract_ready" in TRUTH
    assert "/api/system/r195/restoration?limit=1" in TRUTH
    assert "PC ONLINE · authenticated heartbeat current" in TRUTH
    assert "PC UNPROVEN · no current authenticated heartbeat" in TRUTH


def test_r199_operator_is_a_real_control_plane_not_only_navigation():
    assert 'ONE_SYSTEM_OPERATOR_SCHEMA_R199 = "OMEGA_ONE_SYSTEM_OPERATOR_R199"' in OPERATOR
    assert OPERATOR.count('id: "MENU-') == 12
    for route in [
        "/api/system/r199/manifest",
        "/api/system/r199/snapshot",
        "/api/system/r199/operate",
    ]:
        assert route in OPERATOR
    for action in [
        "specialist_execute",
        "earth_search",
        "corpus_analyze",
        "prepare_build_candidate",
    ]:
        assert action in OPERATOR
    assert 'handleOneSystemOperatorR199' in ENTRY
    assert "const oneSystemOperator = await handleOneSystemOperatorR199(request, env, ctx, runtimeFetch)" in ENTRY


def test_r199_operator_routes_to_existing_authorities_and_returns_receipts():
    for path in [
        "/api/system/r195/execute",
        "/api/earth/sar/r198/search",
        "/api/system/r195/analyze",
        "/api/swarm/build/candidate",
        "/api/convergence/edge",
        "/api/omega/state",
        "/api/system/r195/restoration?limit=24",
    ]:
        assert path in OPERATOR
    assert "OMEGA_ONE_SYSTEM_OPERATOR_RECEIPT_R199" in OPERATOR
    assert "receiptSha256" in OPERATOR
    assert "canonicalMutation: false" in OPERATOR
    assert "promotionAuthorized: false" in OPERATOR
    assert "CANDIDATE_NOT_CANON" in OPERATOR


def test_r199_operator_snapshot_correlates_runtime_instead_of_separate_ui_truths():
    for probe in [
        '"STATE", "/api/omega/state"',
        '"CONVERGENCE", "/api/convergence/edge"',
        '"ONE_SYSTEM", "/api/system/r195/status"',
        '"WORKSPACE", "/api/workspace/r193/manifest"',
        '"FABRIC", "/api/fabric/r191/manifest"',
        '"SAI_AI", "/api/intelligence/r179/manifest"',
        '"SWARM", "/api/clouds/r185/manifest"',
        '"BUILD", "/api/swarm/build/manifest"',
        '"RECOVERY", "/api/system/r195/restoration?limit=1"',
        '"EARTH_SOURCES", "/api/earth/sar/r198/sources"',
    ]:
        assert probe in OPERATOR
    assert "pcOnline: Boolean(pc.pc_online)" in OPERATOR
    assert "heartbeatCurrent: Boolean(pc.heartbeat_current)" in OPERATOR


def test_r199_truthfully_exposes_unrestored_audio_instead_of_inventing_route():
    assert 'label: "AUDIO", href: "#"' in R199
    assert 'state: "RESTORE_REQUIRED"' in R199
    assert "MENU_09_AUDIO_HAS_ARCHIVE_AUTHORITY_BUT_NO_ADMITTED_CANONICAL_CLOUD_SURFACE" in R199
    assert "does not yet have an admitted canonical cloud execution surface" in R199
    assert "R199_AUDIO_RESTORE_REQUIRED" in OPERATOR


def test_r199_preserves_20736_as_atlas_resolution_not_physical_dimension():
    assert 'href: "/?app=Field&shell=20736"' in R199
    assert "Address-resolution expansion without claiming physical dimension" in R199
    assert "NO_PHYSICAL_DIMENSION_CLAIM_FROM_ATLAS_RESOLUTION" in R199
    assert "atlas20736IsAddressResolutionNotPhysicalDimension: true" in OPERATOR


def test_r199_mobile_and_desktop_keep_primary_field_uncovered_when_closed():
    assert "body{padding-left:0!important" in R199
    assert "@media(max-width:760px)" in R199
    assert "--r199bar:44px" in R199
    assert "r199Open" in R199
    assert "opacity:0;pointer-events:none" in R199
