from __future__ import annotations

from pathlib import Path

import pytest

from omega_runtime.motion_time_r188 import (
    MOTION_PHASES_R188,
    MOTION_WAVE_COUNT_R188,
    MotionSequenceError,
    apply_motion_wave_r188,
    motion_wave_ordinals_r188,
    start_motion_state_r188,
)


ROOT = Path(__file__).resolve().parents[1]
TS = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "swarm" / "motionTimeR188.ts"
WRAPPER = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "swarm" / "motionCoordinatorR188.ts"
ENTRY = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "runtimeEntryR169.ts"


def _hash(seed: int) -> str:
    return f"{seed:064x}"[-64:]


def test_r188_wave_partition_covers_exactly_172_nodes_once():
    waves = [motion_wave_ordinals_r188(wave) for wave in range(MOTION_WAVE_COUNT_R188)]
    flat = [node for wave in waves for node in wave]
    assert len(waves) == 15
    assert len(flat) == 172
    assert flat == list(range(1, 173))
    assert all(len(wave) == 12 for wave in waves[:-1])
    assert waves[-1] == [169, 170, 171, 172]


def test_r188_every_phase_is_a_full_172_node_barrier_before_next_phase():
    state = start_motion_state_r188(
        intent="Advance every cloud through one exact logical motion tick.",
        logical_start_ms=1_000_000,
        logical_delta_ms=60_000,
        tick_budget=1,
        autonomous=True,
        observed_now_ms=10,
    )
    sequence_seed = 1
    for phase_index, phase in enumerate(MOTION_PHASES_R188):
        assert state["phaseIndex"] == phase_index
        for wave in range(MOTION_WAVE_COUNT_R188):
            ordinals = motion_wave_ordinals_r188(wave)
            receipts = [_hash(sequence_seed + i) for i in range(len(ordinals))]
            sequence_seed += len(ordinals)
            state = apply_motion_wave_r188(
                state,
                node_receipt_sha256=receipts,
                observed_now_ms=10 + sequence_seed,
            )
            if wave < MOTION_WAVE_COUNT_R188 - 1:
                assert state["phaseIndex"] == phase_index
                assert state["waveIndex"] == wave + 1
                assert state["logicalTimeMs"] == 1_000_000
        assert state["lastPhaseReceipt"]["phase"] == phase
        assert state["lastPhaseReceipt"]["complete172NodeBarrier"] is True
        if phase_index < len(MOTION_PHASES_R188) - 1:
            assert state["phaseIndex"] == phase_index + 1
            assert state["logicalTimeMs"] == 1_000_000

    assert state["status"] == "COMPLETE"
    assert state["completedTicks"] == 1
    assert state["currentTick"] == 1
    assert state["logicalTimeMs"] == 1_060_000
    assert state["lastTickReceipt"]["logicalDeltaMs"] == 60_000
    assert state["lastTickReceipt"]["physicalTimeAccelerationClaim"] is False
    assert len(state["lastTickReceipt"]["phaseReceiptSha256"]) == 12


def test_r188_scar_blocks_exact_point_and_retry_does_not_skip_it():
    state = start_motion_state_r188(intent="scar test", logical_start_ms=100, observed_now_ms=10)
    ordinals = motion_wave_ordinals_r188(0)
    receipts = [_hash(index + 1) for index in range(len(ordinals))]
    state = apply_motion_wave_r188(
        state,
        node_receipt_sha256=receipts,
        failed_nodes=[4],
        observed_now_ms=20,
    )
    assert state["status"] == "SCAR_BLOCKED"
    assert state["phaseIndex"] == 0
    assert state["waveIndex"] == 0
    assert state["scarLedger"][-1]["failedNodes"] == [4]
    memory_after_scar = state["memoryStateSha256"]

    with pytest.raises(MotionSequenceError):
        apply_motion_wave_r188(state, node_receipt_sha256=receipts, observed_now_ms=21)

    state = apply_motion_wave_r188(
        state,
        node_receipt_sha256=[_hash(100 + index) for index in range(len(ordinals))],
        failed_nodes=[],
        observed_now_ms=22,
        retry=True,
    )
    assert state["status"] == "ACTIVE"
    assert state["phaseIndex"] == 0
    assert state["waveIndex"] == 1
    assert state["memoryStateSha256"] == memory_after_scar


def test_r188_cloud_runtime_uses_persistent_coordinator_and_autonomous_alarm():
    source = TS.read_text(encoding="utf-8")
    wrapper = WRAPPER.read_text(encoding="utf-8")
    entry = ENTRY.read_text(encoding="utf-8")
    assert "OMEGA_SYNCHRONOUS_MOTION_TIME_R188" in source
    assert "MOTION_PHASES_R188" in source
    assert "complete172NodeBarrier" in source
    assert "physicalTimeAccelerationClaim: false" in source
    assert "R188_RETRY_REQUIRED_AFTER_SCAR" in source
    assert "advanceScheduledMotionR188" in wrapper
    assert "await super.alarm()" in wrapper
    assert "OmegaSwarmCoordinatorR188 as OmegaSwarmCoordinator" in entry
    assert 'url.pathname.startsWith("/api/swarm/motion/r188/")' in entry
