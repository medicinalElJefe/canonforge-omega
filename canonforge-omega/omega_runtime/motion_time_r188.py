from __future__ import annotations

from copy import deepcopy
from time import time
from typing import Any, Dict, Iterable, List, Mapping

from .warp_candidate import canonical_sha256


MOTION_REVISION_R188 = "R188"
MOTION_SCHEMA_R188 = "OMEGA_SYNCHRONOUS_MOTION_TIME_R188"
MOTION_STATE_SCHEMA_R188 = "OMEGA_SYNCHRONOUS_MOTION_STATE_R188"
MOTION_WAVE_RECEIPT_SCHEMA_R188 = "OMEGA_MOTION_WAVE_RECEIPT_R188"
MOTION_PHASE_RECEIPT_SCHEMA_R188 = "OMEGA_MOTION_PHASE_RECEIPT_R188"
MOTION_TICK_RECEIPT_SCHEMA_R188 = "OMEGA_MOTION_TICK_RECEIPT_R188"
MOTION_NODE_COUNT_R188 = 172
MOTION_WAVE_SIZE_R188 = 12
MOTION_WAVE_COUNT_R188 = 15
MOTION_MAX_TICK_BUDGET_R188 = 12
MOTION_MAX_LOGICAL_DELTA_MS_R188 = 86_400_000

MOTION_PHASES_R188 = (
    "FRAME",
    "PARTITION",
    "TRANSFORM",
    "EXCHANGE",
    "INVARIANT_CARRY",
    "SCAR_CARRY",
    "RECONTEXTUALIZE",
    "FORECAST",
    "SYNTHESIZE",
    "EXECUTE",
    "OBSERVE",
    "PROVE",
)


class MotionSequenceError(ValueError):
    pass


def _hash64(value: Any) -> bool:
    return isinstance(value, str) and len(value) == 64 and all(ch in "0123456789abcdef" for ch in value.lower())


def motion_wave_ordinals_r188(wave: int) -> List[int]:
    start = int(wave) * MOTION_WAVE_SIZE_R188 + 1
    if wave < 0 or start > MOTION_NODE_COUNT_R188:
        return []
    end = min(MOTION_NODE_COUNT_R188, start + MOTION_WAVE_SIZE_R188 - 1)
    return list(range(start, end + 1))


def start_motion_state_r188(
    *,
    intent: str,
    logical_start_ms: int | None = None,
    logical_delta_ms: int = 1000,
    tick_budget: int = 1,
    autonomous: bool = True,
    observed_now_ms: int | None = None,
) -> Dict[str, Any]:
    objective = str(intent or "").strip()
    if not objective:
        raise MotionSequenceError("R188 intent is required")
    now_ms = int(observed_now_ms if observed_now_ms is not None else time() * 1000)
    logical = int(logical_start_ms if logical_start_ms is not None else now_ms)
    delta = max(1, min(MOTION_MAX_LOGICAL_DELTA_MS_R188, int(logical_delta_ms)))
    budget = max(1, min(MOTION_MAX_TICK_BUDGET_R188, int(tick_budget)))
    run_core = {
        "schema": MOTION_SCHEMA_R188,
        "revision": MOTION_REVISION_R188,
        "intent": objective,
        "logicalTimeMs": logical,
        "logicalDeltaMs": delta,
        "tickBudget": budget,
        "observedNow": now_ms,
    }
    initial_barrier = canonical_sha256(run_core)
    run_id = f"r188_{now_ms:x}_{initial_barrier[:12]}"
    return {
        "schema": MOTION_STATE_SCHEMA_R188,
        "revision": MOTION_REVISION_R188,
        "runId": run_id,
        "status": "ACTIVE",
        "intent": objective,
        "autonomous": bool(autonomous),
        "tickBudget": budget,
        "completedTicks": 0,
        "currentTick": 0,
        "logicalTimeMs": logical,
        "logicalDeltaMs": delta,
        "observedNowWallMs": now_ms,
        "previousObservedNowWallMs": now_ms,
        "phaseIndex": 0,
        "waveIndex": 0,
        "attempt": 0,
        "previousBarrierSha256": initial_barrier,
        "memoryStateSha256": canonical_sha256(f"{initial_barrier}|R188_INITIAL_MEMORY|{objective}"),
        "phaseWaveHashes": [],
        "tickPhaseHashes": [],
        "scarLedger": [],
        "nowLedger": [{"wallMs": now_ms, "logicalTimeMs": logical, "event": "START"}],
        "lastWaveReceipt": None,
        "lastPhaseReceipt": None,
        "lastTickReceipt": None,
        "canonicalMutation": False,
        "physicalTimeAccelerationClaim": False,
    }


def _validated_node_hashes(values: Iterable[Any], expected: int) -> List[str]:
    hashes = [str(value).lower() for value in values]
    if len(hashes) != expected or any(not _hash64(value) for value in hashes):
        raise MotionSequenceError("R188 requires one valid node receipt hash for every node in the exact wave")
    return hashes


def apply_motion_wave_r188(
    state: Mapping[str, Any],
    *,
    node_receipt_sha256: Iterable[Any],
    failed_nodes: Iterable[int] | None = None,
    observed_now_ms: int | None = None,
    retry: bool = False,
) -> Dict[str, Any]:
    value = deepcopy(dict(state or {}))
    if value.get("schema") != MOTION_STATE_SCHEMA_R188 or value.get("revision") != MOTION_REVISION_R188:
        raise MotionSequenceError("R188 motion state schema/revision is invalid")
    if value.get("status") == "COMPLETE":
        return value
    if value.get("status") == "PAUSED":
        raise MotionSequenceError("R188 motion is paused")
    if value.get("status") == "SCAR_BLOCKED":
        if not retry:
            raise MotionSequenceError("R188 scar-blocked state requires explicit retry")
        value["status"] = "ACTIVE"
        value["attempt"] = int(value.get("attempt") or 0) + 1

    phase_index = int(value.get("phaseIndex") or 0)
    wave_index = int(value.get("waveIndex") or 0)
    if phase_index < 0 or phase_index >= len(MOTION_PHASES_R188):
        raise MotionSequenceError("R188 phase index is invalid")
    ordinals = motion_wave_ordinals_r188(wave_index)
    if not ordinals:
        raise MotionSequenceError("R188 wave index is invalid")
    receipt_hashes = _validated_node_hashes(node_receipt_sha256, len(ordinals))
    failed = sorted({int(node) for node in (failed_nodes or [])})
    if any(node not in ordinals for node in failed):
        raise MotionSequenceError("R188 failed node is outside the exact current wave")

    now_ms = int(observed_now_ms if observed_now_ms is not None else time() * 1000)
    phase = MOTION_PHASES_R188[phase_index]
    wave_core = {
        "schema": MOTION_WAVE_RECEIPT_SCHEMA_R188,
        "revision": MOTION_REVISION_R188,
        "runId": value["runId"],
        "currentTick": int(value.get("currentTick") or 0),
        "logicalTimeMs": int(value["logicalTimeMs"]),
        "phaseIndex": phase_index,
        "phase": phase,
        "waveIndex": wave_index,
        "requestedNodes": len(ordinals),
        "successfulNodes": len(ordinals) - len(failed),
        "failedNodes": len(failed),
        "nodeOrdinals": ordinals,
        "nodeReceiptSha256": receipt_hashes,
        "predecessorBarrierSha256": value["previousBarrierSha256"],
        "memoryStateSha256": value["memoryStateSha256"],
        "attempt": int(value.get("attempt") or 0),
        "completedAtWallMs": now_ms,
        "canonicalMutation": False,
        "authority": "R188_MOTION_WAVE_RECEIPT_NOT_CANON",
    }
    wave_receipt = {**wave_core, "receiptSha256": canonical_sha256(wave_core)}
    value["lastWaveReceipt"] = wave_receipt
    previous_now = int(value.get("previousObservedNowWallMs") or now_ms)
    value["observedNowWallMs"] = now_ms
    value["previousObservedNowWallMs"] = now_ms
    value["nowLedger"] = [
        *list(value.get("nowLedger") or []),
        {
            "wallMs": now_ms,
            "previousWallMs": previous_now,
            "wallDeltaMs": now_ms - previous_now,
            "logicalTimeMs": value["logicalTimeMs"],
            "tick": value["currentTick"],
            "phase": phase,
            "wave": wave_index,
        },
    ][-48:]

    if failed:
        scar_core = {
            "tick": value["currentTick"],
            "phase": phase,
            "wave": wave_index,
            "attempt": value.get("attempt", 0),
            "failedNodes": failed,
            "predecessorBarrierSha256": value["previousBarrierSha256"],
            "waveReceiptSha256": wave_receipt["receiptSha256"],
            "observedNowWallMs": now_ms,
        }
        scar = {**scar_core, "scarSha256": canonical_sha256(scar_core)}
        value["scarLedger"] = [*list(value.get("scarLedger") or []), scar][-64:]
        value["memoryStateSha256"] = canonical_sha256(f"{value['memoryStateSha256']}|SCAR|{scar['scarSha256']}")
        value["status"] = "SCAR_BLOCKED"
        return value

    value["attempt"] = 0
    value["phaseWaveHashes"] = [*list(value.get("phaseWaveHashes") or []), wave_receipt["receiptSha256"]]
    if wave_index + 1 < MOTION_WAVE_COUNT_R188:
        value["waveIndex"] = wave_index + 1
        return value

    phase_core = {
        "schema": MOTION_PHASE_RECEIPT_SCHEMA_R188,
        "revision": MOTION_REVISION_R188,
        "runId": value["runId"],
        "currentTick": value["currentTick"],
        "logicalTimeMs": value["logicalTimeMs"],
        "phaseIndex": phase_index,
        "phase": phase,
        "waveReceiptSha256": list(value["phaseWaveHashes"]),
        "predecessorBarrierSha256": value["previousBarrierSha256"],
        "memoryBeforeSha256": value["memoryStateSha256"],
        "complete172NodeBarrier": True,
        "canonicalMutation": False,
        "authority": "R188_MOTION_PHASE_BARRIER_NOT_CANON",
    }
    phase_receipt = {**phase_core, "receiptSha256": canonical_sha256(phase_core)}
    value["lastPhaseReceipt"] = phase_receipt
    value["previousBarrierSha256"] = phase_receipt["receiptSha256"]
    value["memoryStateSha256"] = canonical_sha256(f"{value['memoryStateSha256']}|PHASE|{phase_receipt['receiptSha256']}")
    value["tickPhaseHashes"] = [*list(value.get("tickPhaseHashes") or []), phase_receipt["receiptSha256"]]
    value["phaseWaveHashes"] = []
    value["waveIndex"] = 0

    if phase_index + 1 < len(MOTION_PHASES_R188):
        value["phaseIndex"] = phase_index + 1
        return value

    tick_core = {
        "schema": MOTION_TICK_RECEIPT_SCHEMA_R188,
        "revision": MOTION_REVISION_R188,
        "runId": value["runId"],
        "completedTick": value["currentTick"],
        "logicalTimeBeforeMs": value["logicalTimeMs"],
        "logicalDeltaMs": value["logicalDeltaMs"],
        "logicalTimeAfterMs": int(value["logicalTimeMs"]) + int(value["logicalDeltaMs"]),
        "phaseReceiptSha256": list(value["tickPhaseHashes"]),
        "finalPhaseBarrierSha256": phase_receipt["receiptSha256"],
        "memoryStateSha256": value["memoryStateSha256"],
        "scarCount": len(value.get("scarLedger") or []),
        "canonicalMutation": False,
        "physicalTimeAccelerationClaim": False,
        "authority": "R188_LOGICAL_TIME_TICK_RECEIPT_NOT_CANON",
    }
    tick_receipt = {**tick_core, "receiptSha256": canonical_sha256(tick_core)}
    value["lastTickReceipt"] = tick_receipt
    value["completedTicks"] = int(value.get("completedTicks") or 0) + 1
    value["currentTick"] = int(value.get("currentTick") or 0) + 1
    value["logicalTimeMs"] = tick_core["logicalTimeAfterMs"]
    value["previousBarrierSha256"] = tick_receipt["receiptSha256"]
    value["memoryStateSha256"] = canonical_sha256(f"{value['memoryStateSha256']}|TICK|{tick_receipt['receiptSha256']}")
    value["tickPhaseHashes"] = []
    value["phaseIndex"] = 0
    value["waveIndex"] = 0
    value["status"] = "COMPLETE" if value["completedTicks"] >= int(value["tickBudget"]) else "ACTIVE"
    return value
