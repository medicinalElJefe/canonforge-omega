from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
COORDINATOR = WORKER / "src" / "swarm" / "swarmCoordinatorR169.ts"
CELL = WORKER / "src" / "swarm" / "swarmCellR169.ts"
WARP = WORKER / "src" / "swarm" / "warpComputationR176.ts"
WRANGLER = WORKER / "wrangler.toml"


def text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r177_serializes_overlapping_alarm_and_explicit_tick_processing():
    source = text(COORDINATOR)
    assert 'private processLocks = new Map<string, Promise<AnyObj | null>>()' in source
    assert 'const existing = this.processLocks.get(id); if (existing) return existing;' in source
    assert 'this.processLocks.set(id, run)' in source
    assert 'private async processUnlocked(id: string)' in source


def test_r177_persists_an_inflight_batch_before_dispatch_and_reuses_it_on_retry():
    source = text(COORDINATOR)
    assert 'm.inflight = Array.isArray(m.inflight) ? m.inflight : []' in source
    assert 'm.inflight = m.pending.splice(0, batchSize)' in source
    assert 'await this.save(m);' in source
    assert 'const batch = [...m.inflight]' in source
    assert 'm.inflight = []' in source
    assert 'inflight: []' in source


def test_r177_terminal_state_requires_exact_cell_accounting():
    source = text(COORDINATOR)
    assert 'const accounted = m.completed + m.failed' in source
    assert 'accounted !== m.total' in source
    assert 'm.status = "INVARIANT_VIOLATION"' in source
    assert 'm.proofState = "INCOMPLETE_TERMINAL_REJECTED"' in source
    assert 'strictTerminalAccounting: true' in source
    assert 'valid: true' in source


def test_r177_cells_return_cached_receipts_for_repeated_stable_task_ids():
    source = text(CELL)
    assert 'task-result:${taskId}' in source
    assert 'task_result_ids' in source
    assert 'deduplicated: true' in source
    assert 'await this.rememberTask(taskId, 200, payload)' in source
    assert 'await this.rememberTask(taskId, 500, payload)' in source
    assert 'SWARM_INTEGRITY_R177 = "R177"' in source


def test_r177_warp_receipt_is_impossible_when_a_terminal_shard_is_under_accounted():
    source = text(WARP)
    assert 'OMEGA_WARP_COMPLETION_INVARIANT_R177' in source
    assert 'row.terminalStateReported && !row.invariantValid' in source
    assert 'const terminal = missions.length > 0 && accounting.every(row => row.terminalStateReported && row.invariantValid)' in source
    assert 'strictCompletionInvariant: true' in source
    assert 'receiptCore = terminal ?' in source
    assert 'state = invalidShards.length ? "INVARIANT_VIOLATION"' in source
    assert 'result.state === "INVARIANT_VIOLATION" ? 409' in source


def test_r177_manifest_exposes_real_integrity_capabilities_without_inventing_throughput():
    source = text(WARP)
    assert 'integrityRevision: WARP_INTEGRITY_REVISION_R177' in source
    assert 'serializedMissionProcessing: true' in source
    assert 'inflightJournal: true' in source
    assert 'idempotentCellTaskReplay: true' in source
    assert 'strictTerminalAccounting: true' in source
    assert 'observedThroughputClaim: false' in source
    assert 'FULL: { cells: 1728' in source
    assert 'WARP: { cells: 576' in source


def test_r177_repair_reuses_existing_durable_object_classes_without_new_migration():
    wrangler = text(WRANGLER)
    assert 'name = "OMEGA_SWARM_COORDINATOR"' in wrangler
    assert 'class_name = "OmegaSwarmCoordinator"' in wrangler
    assert 'name = "OMEGA_SWARM_CELL"' in wrangler
    assert 'class_name = "OmegaSwarmCell"' in wrangler
    assert '[[migrations]]' not in wrangler
