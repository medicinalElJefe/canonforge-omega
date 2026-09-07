from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
SRC = WORKER / "src"
ENTRY = (SRC / "runtimeEntryR169.ts").read_text(encoding="utf-8")
ROUTE = (SRC / "system" / "hybridMissionRouteR202.ts").read_text(encoding="utf-8")
LEDGER = (SRC / "system" / "hybridMissionLedgerR202.ts").read_text(encoding="utf-8")
R201 = (SRC / "system" / "omegaRuntimeR201.ts").read_text(encoding="utf-8")
R33 = (SRC / "omegaRuntime.ts").read_text(encoding="utf-8")
R181 = (SRC / "acceptance" / "liveAcceptanceR181.ts").read_text(encoding="utf-8")
WRANGLER = (WORKER / "wrangler.toml").read_text(encoding="utf-8")


def test_r202_preserves_canonical_hybrid_and_r201_bindings():
    assert 'export { OmegaRuntime } from "./heartbeatTruth"' in ENTRY
    assert 'export { OmegaRuntime as OmegaMissionLedgerR201 } from "./system/omegaRuntimeR201"' in ENTRY
    assert 'export { OmegaHybridMissionLedgerR202 } from "./system/hybridMissionLedgerR202"' in ENTRY
    assert WRANGLER.count('name = "OMEGA_RUNTIME"') == 1
    assert WRANGLER.count('class_name = "OmegaRuntime"') == 1
    assert 'name = "OMEGA_MISSION_LEDGER_R201"' in WRANGLER
    assert 'class_name = "OmegaMissionLedgerR201"' in WRANGLER
    assert 'name = "OMEGA_HYBRID_MISSION_LEDGER_R202"' in WRANGLER
    assert 'class_name = "OmegaHybridMissionLedgerR202"' in WRANGLER
    assert '[exports.OmegaHybridMissionLedgerR202]' in WRANGLER
    assert 'storage = "sqlite"' in WRANGLER
    assert '[[migrations]]' not in WRANGLER


def test_r202_uses_exact_canonical_hybrid_singleton_not_guessed_host_identity():
    assert 'const CANONICAL_HYBRID_SINGLETON = "OMEGA_RUNTIME"' in ROUTE
    assert 'durableStub(env?.OMEGA_RUNTIME, CANONICAL_HYBRID_SINGLETON)' in ROUTE
    assert 'idFromName(singleton)' in ROUTE
    assert 'randomUUID' not in ROUTE
    assert 'targetDeviceId)' not in ROUTE[ROUTE.index('function hybridStub'):ROUTE.index('function r202Stub')]


def test_r202_requires_verified_r201_anchor_before_hybrid_queue():
    for token in [
        'OMEGA_MISSION_LEDGER_R201',
        'R201_DURABLE_MISSION_ANCHOR_VERIFIED',
        'record?.receiptIntegrityVerified === true',
        'record.missionReceiptSha256.toLowerCase() === expectedReceipt.toLowerCase()',
        'r201EntrySha256',
    ]:
        assert token in ROUTE
    execute = ROUTE[ROUTE.index('async function execute'):ROUTE.index('async function sync')]
    assert execute.index('const anchor = await r201Anchor') < execute.index('stub.fetch(new Request("https://omega-runtime.internal/missions"')


def test_r202_does_not_bypass_existing_bridge_auth_or_confirmation():
    execute = ROUTE[ROUTE.index('async function execute'):ROUTE.index('async function sync')]
    assert 'request.headers.get("x-omega-bridge-secret")' in execute
    assert 'if (!bridgeSecret)' in execute
    assert 'payload.confirmedMission !== true' in execute
    assert '"x-omega-bridge-secret": bridgeSecret' in execute
    assert 'confirmedMission: true' in execute
    assert 'bridgeCredentialPersisted: false' in execute
    assert 'authorized(request)' in R33
    assert 'if (!await this.authorized(request)) return json({ ok: false, code: "DEVICE_PROOF_REQUIRED" }' in R33


def test_r202_requires_current_host_heartbeat_and_selected_online_device():
    assert 'hybrid.onlineCount < 1' in ROUTE
    assert 'row?.id === targetDeviceId && row?.online === true && row?.revoked !== true' in ROUTE
    assert 'DEVICE_PROOF_REQUIRED' in ROUTE
    assert 't - Number(row.lastSeen || 0) < 30000' in R33


def test_r202_preserves_r33_failure_hold_and_has_no_blind_retry():
    assert 'HOLD_REPAIR_REQUIRED' in ROUTE
    assert 'blindRetryAuthorized: false' in ROUTE
    assert 'R202 DOES NOT AUTO-RETRY FAILED HOST PROOF' in ROUTE
    assert 'blindRetryQueued: false' in ROUTE
    assert '/retry' not in ROUTE
    assert 'status: complete ? "COMPLETE" : "HOLD_REPAIR_REQUIRED"' in R33
    assert 'no blind retry was queued' in R33


def test_r202_hashes_terminal_host_return_without_promoting_it_to_physical_truth():
    for token in [
        'async function hostProofHash',
        'R202_HOST_RETURN_EVIDENCE_HASHED_NOT_CANON',
        'R202_HOST_RETURN_PACKET_SHA256_RECORDED_NOT_PHYSICAL_VERIFICATION',
        'hostProofSha256',
        'hostResultFingerprint',
    ]:
        assert token in ROUTE
    assert 'OMEGA_HYBRID_RETURN_PACKET_R32' in R33
    assert 'promotionAuthorized: false' in ROUTE


def test_r202_evidence_ledger_is_bounded_hash_chained_and_sanitized():
    for token in [
        'LEDGER_LIMIT = 96',
        'anchorSha256',
        'headSha256',
        'prevEntrySha256',
        'entrySha256',
        'R202_PREV_LINK_MISMATCH',
        'R202_ENTRY_SHA256_MISMATCH',
        'R202_HEAD_SHA256_MISMATCH',
        'R202_HYBRID_CONTINUITY_HASH_CHAIN_VERIFIED',
    ]:
        assert token in LEDGER
    assert 'ledger.entries = ledger.entries.slice(-LEDGER_LIMIT)' in LEDGER
    assert 'No bridge credential, raw device identifier, mission draft, local path payload, host log, step proof body, or file content is exposed.' in LEDGER
    public = LEDGER[LEDGER.index('function publicEntry'):LEDGER.index('async function verifyLedger')]
    for forbidden in ['bridgeSecret', 'objective:', 'draft:', 'log:', 'stepProofs:', 'outputPaths:']:
        assert forbidden not in public


def test_r202_routes_are_additive_above_r201_r200_without_removing_old_routes():
    assert 'handleHybridMissionR202' in ENTRY
    assert 'handleDurableMissionR201' in ENTRY
    assert 'handleMissionKernelR200' in ENTRY
    assert ENTRY.index('const hybridMission = await handleHybridMissionR202') < ENTRY.index('const durableMission = await handleDurableMissionR201')
    assert ENTRY.index('const durableMission = await handleDurableMissionR201') < ENTRY.index('const missionKernel = await handleMissionKernelR200')
    for path in [
        '/api/mission/r202/manifest',
        '/api/mission/r202/prepare-hybrid',
        '/api/mission/r202/execute-hybrid',
        '/api/mission/r202/sync',
        '/api/mission/r202/status',
        '/api/mission/r202/history',
        '/api/mission/r202/verify',
    ]:
        assert path in ROUTE
    assert '/mission-ledger/mission/' in R201


def test_r181_manifest_exposes_same_non_authority_boundary_top_level_for_live_r201_proof():
    manifest = R181[R181.index('if (request.method === "GET"'):R181.index('if (request.method !== "POST"')]
    assert 'hardBoundaries' in manifest
    assert manifest.count('canonicalMutation: false') >= 2
    assert manifest.count('promotionAuthorized: false') >= 2


def test_r202_correlation_history_never_becomes_host_or_canon_authority():
    assert 'CORRELATED_EVIDENCE_HISTORY_NOT_HOSTSTATE_NOT_CANONSTATE' in LEDGER
    assert 'EVIDENCE_CHAIN_NOT_HOSTSTATE_NOT_CANONSTATE' in LEDGER
    assert 'canonicalMutation: false' in LEDGER
    assert 'hostStateMutation: false' in LEDGER
    assert 'promotionAuthorized: false' in LEDGER
    assert 'R201_ANCHORED_HYBRID_CORRELATION_NOT_HOSTSTATE_NOT_CANONSTATE' in ROUTE
