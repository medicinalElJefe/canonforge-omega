from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
SRC = WORKER / "src"
ENTRY = (SRC / "runtimeEntryR169.ts").read_text(encoding="utf-8")
ROUTE = (SRC / "system" / "hybridMissionRouteR203.ts").read_text(encoding="utf-8")
LEDGER = (SRC / "system" / "hybridMissionLedgerR203.ts").read_text(encoding="utf-8")
R202 = (SRC / "system" / "continuityPotentialR202.ts").read_text(encoding="utf-8")
R201 = (SRC / "system" / "omegaRuntimeR201.ts").read_text(encoding="utf-8")
R33 = (SRC / "omegaRuntime.ts").read_text(encoding="utf-8")
R181 = (SRC / "acceptance" / "liveAcceptanceR181.ts").read_text(encoding="utf-8")
WRANGLER = (WORKER / "wrangler.toml").read_text(encoding="utf-8")


def test_r203_preserves_canonical_hybrid_r201_and_r202_lineage():
    assert 'export { OmegaRuntime } from "./heartbeatTruth"' in ENTRY
    assert 'export { OmegaMissionLedgerR201 } from "./system/omegaRuntimeR201"' in ENTRY
    assert 'handleContinuityPotentialR202' in ENTRY
    assert 'export { OmegaHybridMissionLedgerR203 } from "./system/hybridMissionLedgerR203"' in ENTRY
    assert WRANGLER.count('name = "OMEGA_RUNTIME"') == 1
    assert WRANGLER.count('class_name = "OmegaRuntime"') == 1
    assert 'name = "OMEGA_MISSION_LEDGER_R201"' in WRANGLER
    assert 'class_name = "OmegaMissionLedgerR201"' in WRANGLER
    assert 'CONTINUITY_POTENTIAL_R202_ID = "r202-unified-continuity-potential"' in WRANGLER
    assert 'name = "OMEGA_HYBRID_MISSION_LEDGER_R203"' in WRANGLER
    assert 'class_name = "OmegaHybridMissionLedgerR203"' in WRANGLER
    assert '[exports.OmegaHybridMissionLedgerR203]' in WRANGLER
    assert '[[migrations]]' not in WRANGLER


def test_r203_uses_exact_canonical_hybrid_singleton_and_never_guesses_host_identity():
    assert 'const CANONICAL_HYBRID_SINGLETON = "OMEGA_RUNTIME"' in ROUTE
    assert 'durableStub(env?.OMEGA_RUNTIME, CANONICAL_HYBRID_SINGLETON)' in ROUTE
    assert 'namespace.get(namespace.idFromName(singleton))' in ROUTE
    assert 'randomUUID' not in ROUTE
    hybrid_stub = ROUTE[ROUTE.index('function hybridStub'):ROUTE.index('function r203Stub')]
    assert 'targetDeviceId' not in hybrid_stub
    assert 'deviceId' not in hybrid_stub


def test_r203_requires_verified_r201_anchor_before_any_hybrid_queue():
    for token in [
        'OMEGA_MISSION_LEDGER_R201',
        'R201_DURABLE_MISSION_ANCHOR_VERIFIED',
        'record?.receiptIntegrityVerified === true',
        'record.missionReceiptSha256.toLowerCase() === expectedReceipt.toLowerCase()',
        'r201EntrySha256',
    ]:
        assert token in ROUTE
    queue = ROUTE[ROUTE.index('async function queueHybrid'):ROUTE.index('async function executeClosedLoop')]
    assert queue.index('const anchor = await r201Anchor') < queue.index('stub.fetch(new Request("https://omega-runtime.internal/missions"')


def test_r203_closed_loop_consumes_r202_only_after_r200_r201_durable_proof():
    assert '"/api/mission/r202/execute"' in ROUTE
    assert 'R202_DURABLE_CONTINUITY_REQUIRED_BEFORE_HYBRID_EXECUTION' in ROUTE
    assert 'durable?.durableVerified === true' in ROUTE
    assert 'isSha(durable?.missionReceiptSha256)' in ROUTE
    assert 'R202_RECALIBRATE_CONTINUITY_POTENTIAL' in ROUTE
    assert '/api/mission/r202/execute' in R202
    assert 'R201_RECEIPT_VERIFY_AND_RECORD' in R202
    closed = ROUTE[ROUTE.index('async function executeClosedLoop'):ROUTE.index('async function sync')]
    assert closed.index('invokeCanonical') < closed.index('queueHybrid')


def test_r203_does_not_bypass_bridge_auth_confirmation_or_current_heartbeat():
    queue = ROUTE[ROUTE.index('async function queueHybrid'):ROUTE.index('async function executeClosedLoop')]
    assert 'request.headers.get("x-omega-bridge-secret")' in queue
    assert 'if (!bridgeSecret)' in queue
    assert 'payload.confirmedMission !== true' in queue
    assert '"x-omega-bridge-secret": bridgeSecret' in queue
    assert 'confirmedMission: true' in queue
    assert 'bridgeCredentialPersisted: false' in queue
    assert 'hybrid.onlineCount < 1' in queue
    assert 'row?.id === targetDeviceId && row?.online === true && row?.revoked !== true' in queue
    assert 'authorized(request)' in R33
    assert 't - Number(row.lastSeen || 0) < 30000' in R33


def test_r203_preserves_r33_failure_hold_and_never_auto_retries():
    assert 'HOLD_REPAIR_REQUIRED' in ROUTE
    assert 'blindRetryAuthorized: false' in ROUTE
    assert 'R203 DOES NOT AUTO-RETRY FAILED HOST PROOF' in ROUTE
    assert 'blindRetryQueued: false' in ROUTE
    assert '/retry' not in ROUTE
    assert 'status: complete ? "COMPLETE" : "HOLD_REPAIR_REQUIRED"' in R33
    assert 'no blind retry was queued' in R33


def test_r203_hashes_terminal_host_return_without_claiming_physical_or_canon_verification():
    for token in [
        'async function hostProofHash',
        'R203_HOST_RETURN_EVIDENCE_HASHED_NOT_CANON',
        'R203_HOST_RETURN_PACKET_SHA256_RECORDED_NOT_PHYSICAL_VERIFICATION',
        'hostProofSha256',
        'hostResultFingerprint',
    ]:
        assert token in ROUTE
    assert 'OMEGA_HYBRID_RETURN_PACKET_R32' in R33
    assert 'promotionAuthorized: false' in ROUTE
    assert 'not physical correctness, CanonState admission or promotion authority' in ROUTE


def test_r203_evidence_ledger_is_bounded_hash_chained_and_sanitized():
    for token in [
        'LEDGER_LIMIT = 96',
        'anchorSha256',
        'headSha256',
        'prevEntrySha256',
        'entrySha256',
        'fingerprint',
        'R203_PREV_LINK_MISMATCH',
        'R203_ENTRY_SHA256_MISMATCH',
        'R203_HEAD_SHA256_MISMATCH',
        'OMEGA_HYBRID_MISSION_CHAIN_VERIFICATION_R203',
    ]:
        assert token in LEDGER
    assert 'ledger.entries = ledger.entries.slice(-LEDGER_LIMIT)' in LEDGER
    assert 'No bridge credential, raw device identifier, mission draft, local path payload, host log, step proof body, output-path body, or file content is exposed.' in LEDGER
    public = LEDGER[LEDGER.index('function publicEntry'):LEDGER.index('async function verifyLedger')]
    for forbidden in ['bridgeSecret', 'objective:', 'draft:', 'log:', 'stepProofs:', 'outputPaths:']:
        assert forbidden not in public


def test_r203_routes_are_additive_above_r202_r201_r200_without_removing_predecessors():
    assert 'handleHybridMissionR203' in ENTRY
    assert 'handleContinuityPotentialR202' in ENTRY
    assert 'handleDurableMissionR201' in ENTRY
    assert 'handleMissionKernelR200' in ENTRY
    assert ENTRY.index('const hybridMissionContinuity = await handleHybridMissionR203') < ENTRY.index('const continuityPotential = await handleContinuityPotentialR202')
    assert ENTRY.index('const continuityPotential = await handleContinuityPotentialR202') < ENTRY.index('const durableMission = await handleDurableMissionR201')
    assert ENTRY.index('const durableMission = await handleDurableMissionR201') < ENTRY.index('const missionKernel = await handleMissionKernelR200')
    for path in [
        '/api/mission/r203/manifest',
        '/api/mission/r203/prepare-hybrid',
        '/api/mission/r203/execute-hybrid',
        '/api/mission/r203/execute-closed-loop',
        '/api/mission/r203/sync',
        '/api/mission/r203/status',
        '/api/mission/r203/history',
        '/api/mission/r203/verify',
    ]:
        assert path in ROUTE
    assert '/mission-ledger/mission/' in R201
    assert '/api/system/r202/potential' in R202


def test_r181_manifest_repair_closes_failed_r201_live_proof_schema_gap_additively():
    manifest = R181[R181.index('if (request.method === "GET"'):R181.index('if (request.method !== "POST"')]
    assert 'hardBoundaries' in manifest
    assert manifest.count('canonicalMutation: false') >= 2
    assert manifest.count('promotionAuthorized: false') >= 2


def test_r203_correlation_history_never_becomes_host_or_canon_authority():
    assert 'CORRELATED_EVIDENCE_HISTORY_NOT_HOSTSTATE_NOT_CANONSTATE' in LEDGER
    assert 'EVIDENCE_CHAIN_NOT_HOSTSTATE_NOT_CANONSTATE' in LEDGER
    assert 'canonicalMutation: false' in LEDGER
    assert 'hostStateMutation: false' in LEDGER
    assert 'promotionAuthorized: false' in LEDGER
    assert 'R201_ANCHORED_R202_AWARE_HYBRID_CORRELATION_NOT_HOSTSTATE_NOT_CANONSTATE' in ROUTE
    assert 'hostStateMutationAuthority: "R33_CANONICAL_HYBRID_RUNTIME_ONLY"' in ROUTE
