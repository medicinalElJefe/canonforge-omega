from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
SRC = WORKER / "src"
ENTRY = (SRC / "runtimeEntryR169.ts").read_text(encoding="utf-8")
RUNTIME = (SRC / "system" / "omegaRuntimeR201.ts").read_text(encoding="utf-8")
ROUTE = (SRC / "system" / "durableMissionRouteR201.ts").read_text(encoding="utf-8")
WRANGLER = (WORKER / "wrangler.toml").read_text(encoding="utf-8")


def test_r201_is_a_dedicated_evidence_only_durable_object_not_a_runtime_subclass():
    assert 'from "../omegaRuntime"' not in RUNTIME
    assert "extends BaseOmegaRuntime" not in RUNTIME
    assert "super.fetch" not in RUNTIME
    assert "export class OmegaMissionLedgerR201" in RUNTIME
    assert "DEDICATED_EVIDENCE_ONLY_DURABLE_OBJECT_NO_GENERAL_RUNTIME_METHODS" in RUNTIME
    assert "appendAuditEvent" in RUNTIME
    assert "this.event(" not in RUNTIME
    assert 'export { OmegaRuntime } from "./heartbeatTruth"' in ENTRY
    assert 'export { OmegaMissionLedgerR201 } from "./system/omegaRuntimeR201"' in ENTRY
    assert WRANGLER.count('name = "OMEGA_RUNTIME"') == 1
    assert WRANGLER.count('class_name = "OmegaRuntime"') == 1
    assert '[exports.OmegaRuntime]' in WRANGLER


def test_r201_sits_above_r200_without_changing_r200_contract():
    assert 'handleDurableMissionR201' in ENTRY
    assert 'handleMissionKernelR200' in ENTRY
    assert ENTRY.index('const durableMission = await handleDurableMissionR201') < ENTRY.index('const missionKernel = await handleMissionKernelR200')
    assert '/api/mission/r200/execute' in ROUTE
    assert 'schema !== "OMEGA_CANONICAL_MISSION_R200"' in ROUTE
    assert 'R200_MISSION_RECEIPT_SHA256_VERIFIED' in RUNTIME


def test_r201_execute_record_verify_is_one_closed_durable_loop():
    for token in [
        'R200_CANONICAL_MISSION_EXECUTION',
        'R200_MISSION_RECEIPT_SHA256_VERIFICATION',
        'R201_DURABLE_HASH_CHAIN_RECORD',
        'R201_CONTINUITY_VERIFICATION',
        'RETURN_MISSION_PLUS_DURABLE_RECEIPT',
    ]:
        assert token in ROUTE
    assert 'EXECUTED_RECORDED_CHAIN_VERIFIED' in ROUTE
    assert 'MISSION_EXECUTED_DURABILITY_FAILED' in ROUTE
    assert 'durableRecorded: true' in ROUTE
    assert 'durableVerified' in ROUTE


def test_r201_hash_chain_carries_history_and_detects_tampering():
    for token in [
        'anchorSha256', 'headSha256', 'prevEntrySha256', 'entrySha256',
        'R201_PREV_LINK_MISMATCH', 'R201_ENTRY_SHA256_MISMATCH', 'R201_HEAD_SHA256_MISMATCH',
    ]:
        assert token in RUNTIME
    assert 'delete core.entrySha256' in RUNTIME
    assert 'const recomputed = await sha(core)' in RUNTIME
    assert 'LEDGER_LIMIT = 96' in RUNTIME
    assert 'ledger.entries = ledger.entries.slice(-LEDGER_LIMIT)' in RUNTIME


def test_r201_is_idempotent_and_rejects_unverified_r200_packets():
    assert 'R201_MISSION_RECEIPT_REJECTED' in RUNTIME
    assert 'IDEMPOTENT_EXISTING_RECORD' in RUNTIME
    assert 'e.missionReceiptSha256 === integrity.given' in RUNTIME
    assert 'receiptIntegrityVerified: true' in RUNTIME


def test_r201_public_history_is_sanitized_and_direct_record_is_not_public():
    assert '/api/mission/r201/history' in ROUTE
    assert '/mission-ledger/public-history' in ROUTE
    assert 'Mission intent, specialist payloads, downstream evidence bodies' in RUNTIME
    public_entry = RUNTIME[RUNTIME.index('function publicEntry'):RUNTIME.index('export class OmegaMissionLedgerR201')]
    assert 'intent:' not in public_entry
    assert 'taskReceipts:' not in public_entry
    assert '/api/mission/r201/record' not in ROUTE
    assert 'directRecordRouteExposed: false' in ROUTE


def test_r201_never_promotes_history_to_host_or_canon_authority():
    for source in [RUNTIME, ROUTE]:
        assert 'DURABLE_EVIDENCE_HISTORY_NOT_HOSTSTATE_NOT_CANONSTATE' in source
        assert 'canonicalMutation: false' in source
        assert 'hostStateMutation: false' in source
        assert 'promotionAuthorized: false' in source
    assert 'pc_online' not in RUNTIME
    assert 'nativeExecutionClaimed' not in RUNTIME
    assert 'Pair this browser' not in RUNTIME
    assert 'HYBRID_OPS' not in RUNTIME
    assert 'The historical OMEGA_RUNTIME/OmegaRuntime binding is unchanged' in ROUTE


def test_r201_routes_and_release_preserve_dedicated_evidence_only_sqlite_class():
    for path in [
        '/api/mission/r201/manifest', '/api/mission/r201/execute', '/api/mission/r201/summary',
        '/api/mission/r201/history', '/api/mission/r201/verify',
    ]:
        assert path in ROUTE
    assert 'DURABLE_MISSION_LEDGER_R201_ID = "r201-durable-mission-evidence-ledger"' in WRANGLER
    assert 'name = "OMEGA_MISSION_LEDGER_R201"' in WRANGLER
    assert 'class_name = "OmegaMissionLedgerR201"' in WRANGLER
    assert '[exports.OmegaMissionLedgerR201]' in WRANGLER
    assert '[exports.OmegaRuntime]' in WRANGLER
    assert 'storage = "sqlite"' in WRANGLER
    assert '[[migrations]]' not in WRANGLER


def test_r201_uses_dedicated_evidence_binding_and_named_instance_not_pc_state_runtime():
    assert 'omega-r201-durable-mission-evidence-ledger-v1' in ROUTE
    assert 'env?.OMEGA_MISSION_LEDGER_R201' in ROUTE
    assert 'idFromName(DURABLE_MISSION_SINGLETON_R201)' in ROUTE
    assert 'env?.OMEGA_RUNTIME' not in ROUTE
    assert 'hostStateMutation: false' in ROUTE
    assert 'Pair this browser' not in ROUTE


def test_r201_unknown_internal_routes_cannot_fall_through_to_general_runtime_behavior():
    assert 'R201_EVIDENCE_LEDGER_ROUTE_NOT_FOUND' in RUNTIME
    assert 'return super.fetch(request)' not in RUNTIME
    assert 'if ((path === "/status" || path === "/snapshot")' not in RUNTIME
    assert 'AUDIT_KEY = "missionLedgerAuditR201"' in RUNTIME
    assert 'AUDIT_LIMIT = 128' in RUNTIME
