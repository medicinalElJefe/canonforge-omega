from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
SRC = WORKER / "src"
ENTRY = (SRC / "runtimeEntryR169.ts").read_text(encoding="utf-8")
CONTROL = (SRC / "system" / "wholeSystemControlR205.ts").read_text(encoding="utf-8")
SURFACE = (SRC / "wholeSystemSurfaceR205.ts").read_text(encoding="utf-8")
R199 = (SRC / "system" / "oneSystemOperatorR199.ts").read_text(encoding="utf-8")
R200 = (SRC / "system" / "missionKernelR200.ts").read_text(encoding="utf-8")
R201 = (SRC / "system" / "durableMissionRouteR201.ts").read_text(encoding="utf-8")
R203 = (SRC / "system" / "hybridMissionRouteR203.ts").read_text(encoding="utf-8")
R204_ALIAS = (SRC / "convergenceRuntimeAliasR204.ts").read_text(encoding="utf-8")
R204_RUNTIME = (SRC / "omegaRuntimeR204.ts").read_text(encoding="utf-8")
R184 = (SRC / "swarm" / "improvementDiscoveryR184.ts").read_text(encoding="utf-8")
R187 = (SRC / "swarm" / "sourcePatchR187.ts").read_text(encoding="utf-8")
WRANGLER = (WORKER / "wrangler.toml").read_text(encoding="utf-8")


def test_r205_is_additive_above_r203_and_preserves_r204_runtime_alias():
    for token in [
        'handleWholeSystemControlR205',
        'handleHybridMissionR203',
        'handleContinuityPotentialR202',
        'handleDurableMissionR201',
        'handleMissionKernelR200',
    ]:
        assert token in ENTRY
    assert ENTRY.index('const wholeSystemR205 = await handleWholeSystemControlR205') < ENTRY.index('const hybridMissionContinuity = await handleHybridMissionR203')
    assert '"./convergence" = "./src/convergenceRuntimeAliasR204.ts"' in WRANGLER
    assert 'HYBRID_RETURN_ADMISSION_R204_ID = "r204-verified-hybrid-return-admission"' in WRANGLER
    assert 'WHOLE_SYSTEM_R205_ID = "r205-whole-system-professional-control"' in WRANGLER
    assert 'export { OmegaRuntime } from "./omegaRuntimeR204"' in R204_ALIAS
    assert 'newDurableNamespaceCreated: false' in R204_ALIAS


def test_r205_does_not_change_durable_namespace_identity():
    assert WRANGLER.count('name = "OMEGA_RUNTIME"') == 1
    assert WRANGLER.count('class_name = "OmegaRuntime"') == 1
    assert 'name = "OMEGA_MISSION_LEDGER_R201"' in WRANGLER
    assert 'name = "OMEGA_HYBRID_MISSION_LEDGER_R203"' in WRANGLER
    assert 'OMEGA_HYBRID_MISSION_LEDGER_R205' not in WRANGLER
    assert '[exports.OmegaRuntime]' in WRANGLER
    assert 'R202 and R205 add no Durable Object' in WRANGLER


def test_r205_is_final_html_surface_and_never_changes_api_responses():
    assert 'enhanceWholeSystemSurfaceR205' in ENTRY
    assert 'return enhanceWholeSystemSurfaceR205(finalResponse)' in ENTRY
    assert 'if (!type.includes("text/html")) return response' in SURFACE
    assert 'x-omega-whole-system-surface' in SURFACE
    assert 'r205-professional-whole-system-surface' in SURFACE
    assert 'canonicalMutation: false' in CONTROL
    assert 'promotionAuthorized: false' in CONTROL


def test_professional_surface_is_compact_responsive_accessible_and_non_overlapping():
    for token in [
        'OMEGA WHOLE SYSTEM',
        'AI / SAI BRIDGE',
        'BOUNDED SELF-DEVELOPMENT',
        'CURRENT VERIFIED STATE',
        '@media(max-width:760px)',
        '@media(max-width:430px)',
        '@media(prefers-reduced-motion:reduce)',
        ':focus-visible',
        'bottom:max(58px',
        'overflow:auto',
    ]:
        assert token in SURFACE
    assert 'rainbow' not in SURFACE.lower()
    assert 'top:76px' in SURFACE
    assert 'backdrop-filter:blur' in SURFACE


def test_r199_fast_mission_snapshot_removes_heavy_probes_from_r200_r201_required_path():
    assert 'type SnapshotProfile = "mission" | "full"' in R199
    assert 'FAST_INTERNAL_ONLY_CORE_PROOF_SNAPSHOT_FOR_R200_R201_MISSIONS' in R199
    assert 'snapshot(request, env, ctx, canonicalFetch, "mission")' in R199
    assert 'missionSnapshotDoesNotClaimHostState: profile === "mission"' in R199
    assert 'NOT_PROBED_IN_FAST_MISSION_PROFILE' in R199
    block = R199[R199.index('function snapshotProbes'):R199.index('async function snapshot')]
    core = block[block.index('const core = ['):block.index('if (profile === "mission")')]
    for excluded in ['CONVERGENCE', 'SWARM', 'RECOVERY', 'EARTH_SOURCES']:
        assert excluded not in core
    for required in ['STATE', 'ONE_SYSTEM', 'WORKSPACE', 'FABRIC', 'SAI_AI', 'BUILD']:
        assert required in core
    assert 'correlated-snapshot' in R200 and 'proof-state' in R200
    assert '/api/mission/r200/execute' in R201


def test_r205_health_covers_every_critical_ai_sai_hybrid_and_self_build_layer():
    for path in [
        '/api/acceptance/r190/manifest',
        '/api/intelligence/r179/manifest',
        '/api/sai/manifest',
        '/api/sai/status',
        '/api/hybrid/status',
        '/api/mission/r201/verify',
        '/api/system/r202/manifest',
        '/api/mission/r203/manifest',
        '/api/system/r204/manifest',
        '/api/swarm/improvement/r184/manifest',
        '/api/swarm/patch/r187/manifest',
    ]:
        assert path in CONTROL
    for layer in [
        'PROOF', 'CLOUD_AI', 'SAI_MULTI_AGENT', 'SAI_B059', 'HYBRID_PC',
        'R201_DURABILITY', 'R202_CONTINUITY', 'R203_HYBRID_CONTINUITY',
        'R204_RETURN_ADMISSION', 'SELF_BUILD_DISCOVERY', 'SELF_BUILD_PATCH',
    ]:
        assert f'"{layer}"' in CONTROL
    assert 'CLOUD_SYSTEM_READY_HOST_OPTIONAL_OFFLINE' in CONTROL
    assert 'verifiedReturnAdmissionReady' in CONTROL


def test_pc_online_requires_current_authenticated_heartbeat_not_presence_or_ui_state():
    assert 'const heartbeatCurrent = Boolean' in CONTROL
    assert 'const authenticated = Boolean' in CONTROL
    assert '&& heartbeatCurrent && authenticated' in CONTROL
    assert 'nativeExecutionMayBeClaimed: pcOnline' in CONTROL
    assert 'pcOnlineRequiresCurrentAuthenticatedHeartbeat: true' in CONTROL


def test_bridge_prepare_runs_provider_multi_agent_sai_and_grounded_fusion_then_hashes_lineage():
    prepare = CONTROL[CONTROL.index('async function prepareBridge'):CONTROL.index('function explicitHybridPlan')]
    assert '"/api/sai/infer"' in prepare
    assert '"/api/intelligence/r179/fuse"' in prepare
    assert 'use_sai: true' in prepare
    for token in ['saiReceiptSha256', 'fusionReceiptSha256', 'b059ReceiptSha256', 'saiGrounded', 'executionAuthorized: false']:
        assert token in prepare
    assert 'receiptSha256: await sha(core)' in prepare


def test_bridge_requires_valid_prepare_receipt_confirmation_secret_and_explicit_operations():
    execute = CONTROL[CONTROL.index('async function executeBridge'):CONTROL.index('export async function handleWholeSystemControlR205')]
    for token in [
        'R205_VALID_PREPARE_PACKET_REQUIRED',
        'R205_PREPARE_RECEIPT_INTEGRITY_FAILED',
        'R205_EXPLICIT_BRIDGE_EXECUTION_CONFIRMATION_REQUIRED',
        'request.headers.get("x-omega-bridge-secret")',
        'DEVICE_PROOF_REQUIRED',
        'R205_EXPLICIT_ALLOW_LISTED_HOST_OPERATIONS_REQUIRED',
    ]:
        assert token in CONTROL
    assert '"x-omega-bridge-secret": bridgeSecret' in execute
    assert 'bridgeCredentialPersisted: false' in execute
    assert 'bridgeSecret:' not in execute


def test_contextual_hybrid_operations_require_structured_r33_steps():
    plan = CONTROL[CONTROL.index('function explicitHybridPlan'):CONTROL.index('async function executeBridge')]
    assert 'DIRECT_PATH_OPS_R205' in plan
    assert 'R205_STRUCTURED_STEPS_REQUIRED_FOR_CONTEXTUAL_OPERATIONS' in plan
    assert 'R205_STRUCTURED_HOST_PLAN_ACCEPTED_FOR_R33_R204_VALIDATION' in plan
    assert 'R205_UNSUPPORTED_STRUCTURED_HOST_OPERATION' in plan
    assert 'steps: normalized' in plan
    assert 'steps = allowedOps.map' in plan
    assert 'OMEGA_GOVERNED_ACTION_DRAFT_R205' in plan
    assert 'Advanced R33 steps JSON' in SURFACE
    assert 'R33 performs plan validation and R204 verifies the return' in SURFACE


def test_sai_receipts_are_carried_into_r200_r201_and_r203_execution_lineage():
    execute = CONTROL[CONTROL.index('async function executeBridge'):CONTROL.index('export async function handleWholeSystemControlR205')]
    assert 'R205_SAI_RECEIPT=' in execute
    assert 'R205_FUSION_RECEIPT=' in execute
    assert 'R205_BRIDGE_PREPARE_RECEIPT=' in execute
    assert 'operations: [{ operation: "sai.query", prompt: packet.intent, required: true }]' in execute
    assert '"/api/mission/r203/execute-closed-loop"' in execute
    assert 'draft: hostPlan.draft' in execute
    assert 'hostPlanSha256' in execute


def test_r203_still_queues_and_r204_still_verifies_host_return():
    assert 'canonicalHybridBinding: "OMEGA_RUNTIME"' in R203
    assert 'R33_CANONICAL_HYBRID_RUNTIME_ONLY' in R203
    assert 'VERIFIED_SUCCESS_ONLY_MISSION_COMPLETION' in R204_ALIAS
    assert 'RETURN_VERIFIED' in R204_RUNTIME or 'returnVerification' in R204_RUNTIME
    assert 'R205_LINEAGE_WRAPPER_R203_QUEUES_AND_R204_VERIFIES_HOST_RETURN' in CONTROL
    assert 'env?.OMEGA_RUNTIME' not in CONTROL
    assert 'idFromName' not in CONTROL


def test_self_build_remains_continuous_but_bounded_and_non_promoting():
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


def test_r205_routes_are_distinct_from_canonical_r204_manifest():
    for route in [
        '/api/system/r205/manifest',
        '/api/system/r205/health',
        '/api/intelligence/r205/bridge/prepare',
        '/api/intelligence/r205/bridge/execute',
    ]:
        assert route in CONTROL
    assert 'path.startsWith("/api/system/r205") || path.startsWith("/api/intelligence/r205")' in CONTROL
    assert 'path === "/api/system/r204/manifest"' in R204_ALIAS


def test_earth_specific_visual_layers_remain_earth_only_before_r205_surface():
    earth = ENTRY[ENTRY.index('const earthApp'):ENTRY.index('return enhanceWholeSystemSurfaceR205')]
    assert 'enhanceEarthSarIntegratedRepairR198_1' in earth
    assert 'enhanceEarthSarVisualContextR198_2' in earth
    assert 'if (earthApp)' in earth
    assert 'else {' in earth
