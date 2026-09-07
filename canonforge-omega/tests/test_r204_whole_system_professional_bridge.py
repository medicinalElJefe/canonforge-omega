from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
SRC = WORKER / "src"
ENTRY = (SRC / "runtimeEntryR169.ts").read_text(encoding="utf-8")
CONTROL = (SRC / "system" / "wholeSystemControlR204.ts").read_text(encoding="utf-8")
SURFACE = (SRC / "wholeSystemSurfaceR204.ts").read_text(encoding="utf-8")
R199 = (SRC / "system" / "oneSystemOperatorR199.ts").read_text(encoding="utf-8")
R200 = (SRC / "system" / "missionKernelR200.ts").read_text(encoding="utf-8")
R201 = (SRC / "system" / "durableMissionRouteR201.ts").read_text(encoding="utf-8")
R203 = (SRC / "system" / "hybridMissionRouteR203.ts").read_text(encoding="utf-8")
R184 = (SRC / "swarm" / "improvementDiscoveryR184.ts").read_text(encoding="utf-8")
R187 = (SRC / "swarm" / "sourcePatchR187.ts").read_text(encoding="utf-8")
WRANGLER = (WORKER / "wrangler.toml").read_text(encoding="utf-8")


def test_r204_is_additive_above_r203_r202_r201_r200():
    for token in [
        'handleWholeSystemControlR204',
        'handleHybridMissionR203',
        'handleContinuityPotentialR202',
        'handleDurableMissionR201',
        'handleMissionKernelR200',
    ]:
        assert token in ENTRY
    assert ENTRY.index('const wholeSystemR204 = await handleWholeSystemControlR204') < ENTRY.index('const hybridMissionContinuity = await handleHybridMissionR203')
    assert ENTRY.index('const hybridMissionContinuity = await handleHybridMissionR203') < ENTRY.index('const continuityPotential = await handleContinuityPotentialR202')
    assert ENTRY.index('const continuityPotential = await handleContinuityPotentialR202') < ENTRY.index('const durableMission = await handleDurableMissionR201')
    assert ENTRY.index('const durableMission = await handleDurableMissionR201') < ENTRY.index('const missionKernel = await handleMissionKernelR200')
    assert 'WHOLE_SYSTEM_R204_ID = "r204-whole-system-professional-control"' in WRANGLER
    assert 'name = "OMEGA_RUNTIME"' in WRANGLER
    assert 'name = "OMEGA_MISSION_LEDGER_R201"' in WRANGLER
    assert 'name = "OMEGA_HYBRID_MISSION_LEDGER_R203"' in WRANGLER


def test_r204_is_final_html_surface_but_never_api_mutation_authority():
    assert 'enhanceWholeSystemSurfaceR204' in ENTRY
    assert 'return enhanceWholeSystemSurfaceR204(finalResponse)' in ENTRY
    assert 'if (!type.includes("text/html")) return response' in SURFACE
    assert 'x-omega-whole-system-surface' in SURFACE
    assert 'canonicalMutation: false' in CONTROL
    assert 'promotionAuthorized: false' in CONTROL
    assert 'R204_LINEAGE_WRAPPER_R203_REMAINS_NATIVE_EXECUTION_AUTHORITY' in CONTROL


def test_r204_professional_surface_has_one_compact_control_drawer_and_responsive_rules():
    for token in [
        'OMEGA WHOLE SYSTEM',
        'SYSTEM</button>',
        'AI / SAI BRIDGE',
        'BUILD</button>',
        'CURRENT VERIFIED STATE',
        'RECEIPT-BOUND INTELLIGENCE',
        'BOUNDED SELF-DEVELOPMENT',
        '@media(max-width:760px)',
        '@media(max-width:430px)',
        '@media(prefers-reduced-motion:reduce)',
        ':focus-visible',
    ]:
        assert token in SURFACE
    assert 'rainbow' not in SURFACE.lower()
    assert 'linear-gradient(145deg' in SURFACE
    assert 'overflow:auto' in SURFACE


def test_r199_fast_mission_snapshot_repairs_r201_required_path_without_claiming_host_state():
    assert 'type SnapshotProfile = "mission" | "full"' in R199
    assert 'FAST_INTERNAL_ONLY_CORE_PROOF_SNAPSHOT_FOR_R200_R201_MISSIONS' in R199
    assert 'FULL_OPERATOR_SNAPSHOT_INCLUDING_CONVERGENCE_RECOVERY_AND_EARTH_SOURCE_HEALTH' in R199
    assert 'snapshot(request, env, ctx, canonicalFetch, "mission")' in R199
    assert 'missionSnapshotDoesNotClaimHostState: profile === "mission"' in R199
    assert 'NOT_PROBED_IN_FAST_MISSION_PROFILE' in R199
    mission_block = R199[R199.index('function snapshotProbes'):R199.index('async function snapshot')]
    core_block = mission_block[mission_block.index('const core = ['):mission_block.index('if (profile === "mission")')]
    for excluded in ['CONVERGENCE', 'RECOVERY', 'EARTH_SOURCES']:
        assert excluded not in core_block
    assert 'correlated-snapshot' in R200
    assert 'proof-state' in R200
    assert '/api/mission/r200/execute' in R201


def test_r204_health_covers_ai_sai_hybrid_continuity_and_self_build_truth():
    for path in [
        '/api/intelligence/r179/manifest',
        '/api/sai/manifest',
        '/api/sai/status',
        '/api/hybrid/status',
        '/api/mission/r201/verify',
        '/api/system/r202/manifest',
        '/api/mission/r203/manifest',
        '/api/swarm/improvement/r184/manifest',
        '/api/swarm/patch/r187/manifest',
    ]:
        assert path in CONTROL
    for layer in [
        'CLOUD_AI', 'SAI_MULTI_AGENT', 'SAI_B059', 'HYBRID_PC', 'R201_DURABILITY',
        'R202_CONTINUITY', 'R203_HYBRID_CONTINUITY', 'SELF_BUILD_DISCOVERY', 'SELF_BUILD_PATCH',
    ]:
        assert f'"{layer}"' in CONTROL
    assert 'CLOUD_SYSTEM_READY_HOST_OPTIONAL_OFFLINE' in CONTROL
    assert 'pcOnline = Boolean' in CONTROL
    assert 'heartbeatCurrent && authenticated' in CONTROL


def test_r204_prepare_bridge_runs_real_sai_and_grounded_fusion_and_hash_binds_lineage():
    prepare = CONTROL[CONTROL.index('async function prepareBridge'):CONTROL.index('function explicitHybridPlan')]
    assert '"/api/sai/infer"' in prepare
    assert '"/api/intelligence/r179/fuse"' in prepare
    assert 'use_sai: true' in prepare
    for token in [
        'saiReceiptSha256', 'fusionReceiptSha256', 'b059ReceiptSha256',
        'SAI_AI_BRIDGE_PREPARATION_NOT_HOST_EXECUTION_NOT_CANON',
        'executionAuthorized: false',
    ]:
        assert token in prepare
    assert 'const receiptSha256 = await sha(core)' in prepare


def test_r204_bridge_requires_integrity_confirmation_secret_and_explicit_host_ops():
    execute = CONTROL[CONTROL.index('async function executeBridge'):CONTROL.index('export async function handleWholeSystemControlR204')]
    for token in [
        'R204_PREPARE_RECEIPT_INTEGRITY_FAILED',
        'R204_EXPLICIT_BRIDGE_EXECUTION_CONFIRMATION_REQUIRED',
        'request.headers.get("x-omega-bridge-secret")',
        'DEVICE_PROOF_REQUIRED',
        'R204_EXPLICIT_ALLOW_LISTED_HOST_OPERATIONS_REQUIRED',
        'R204_UNSUPPORTED_HOST_OPERATION',
    ]:
        assert token in CONTROL
    assert '"x-omega-bridge-secret": bridgeSecret' in execute
    assert 'bridgeCredentialPersisted: false' in execute
    assert 'bridgeSecret:' not in execute


def test_r204_materializes_only_explicit_r33_allow_listed_steps_and_sai_is_required_in_durable_lineage():
    plan = CONTROL[CONTROL.index('function explicitHybridPlan'):CONTROL.index('async function executeBridge')]
    assert 'HYBRID_OPS_R204' in plan
    assert 'requested.filter' in plan
    assert 'steps = allowedOps.map' in plan
    assert 'OMEGA_GOVERNED_ACTION_DRAFT_R204' in plan
    execute = CONTROL[CONTROL.index('async function executeBridge'):CONTROL.index('export async function handleWholeSystemControlR204')]
    assert 'operations: [{ operation: "sai.query", prompt: packet.intent, required: true }]' in execute
    assert 'R204_SAI_RECEIPT=' in execute
    assert 'R204_FUSION_RECEIPT=' in execute
    assert 'R204_BRIDGE_PREPARE_RECEIPT=' in execute
    assert '"/api/mission/r203/execute-closed-loop"' in execute
    assert 'draft: hostPlan.draft' in execute
    assert 'hostPlanSha256' in execute


def test_r203_remains_only_native_queue_authority_and_r204_does_not_touch_durable_objects_directly():
    assert 'canonicalHybridBinding: "OMEGA_RUNTIME"' in R203
    assert 'R33_CANONICAL_HYBRID_RUNTIME_ONLY' in R203
    assert 'env?.OMEGA_RUNTIME' not in CONTROL
    assert 'env?.OMEGA_MISSION_LEDGER_R201' not in CONTROL
    assert 'env?.OMEGA_HYBRID_MISSION_LEDGER_R203' not in CONTROL
    assert 'idFromName' not in CONTROL


def test_self_build_remains_automatic_only_inside_bounded_discovery_and_draft_laws():
    assert 'automaticCanonicalPromotion: false' in R184
    assert 'githubMutationAuthorized: false' in R184
    assert 'deploymentAuthorized: false' in R184
    assert 'gitCommitAuthorized: false' in R187
    assert 'gitPushAuthorized: false' in R187
    assert 'deploymentAuthorized: false' in R187
    assert 'promotionAuthorized: false' in R187
    assert 'automaticGitMutation: false' in CONTROL
    assert 'automaticCanonicalPromotion: false' in CONTROL
    assert 'Discover, rank and draft bounded successors automatically' in CONTROL


def test_r204_routes_are_public_and_distinct_from_r179_and_r203_surfaces():
    for route in [
        '/api/system/r204/manifest',
        '/api/system/r204/health',
        '/api/intelligence/r204/bridge/prepare',
        '/api/intelligence/r204/bridge/execute',
    ]:
        assert route in CONTROL
    assert 'path.startsWith("/api/system/r204") || path.startsWith("/api/intelligence/r204")' in CONTROL
    assert '/api/intelligence/r179/' in ENTRY
    assert '/api/mission/r203' in R203


def test_earth_only_visual_context_is_preserved_before_final_r204_surface():
    earth = ENTRY[ENTRY.index('const earthApp'):ENTRY.index('return enhanceWholeSystemSurfaceR204')]
    assert 'enhanceEarthSarIntegratedRepairR198_1' in earth
    assert 'enhanceEarthSarVisualContextR198_2' in earth
    assert 'if (earthApp)' in earth
    assert 'else {' in earth
