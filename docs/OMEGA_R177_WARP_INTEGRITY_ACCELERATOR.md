# OMEGA R177 — Warp Integrity Accelerator

R177 is an additive integrity repair and acceleration layer over the deployed R176 Warp Computation Fabric.

## Why R177 exists

The first production WARP proof launched four persistent 144-cell coordinator missions for an intended 576-cell BUILD run. The live edge returned a Merkle-rooted receipt after the child coordinators reported only 312 accounted cells (72 + 72 + 72 + 96), with zero failures. The receipt correctly remained non-canonical, and the proof workflow rejected it because `completed + failed != total`.

That live failure identified two concrete software defects rather than a theoretical limitation:

1. explicit `/tick` acceleration and Durable Object alarms could overlap while advancing one mission, allowing stale mission snapshots to overwrite counters after batches had already been removed from `pending`;
2. both the child coordinator and R176 aggregate trusted a terminal status more than exact accounting.

R177 repairs those defects without flattening or replacing the R176 topology.

## Enacted repair

### Serialized mission advancement

Each `OmegaSwarmCoordinator` now serializes concurrent process requests for the same mission in memory. Alarm continuation and explicit tick acceleration can still coexist, but they cannot concurrently mutate one mission snapshot inside a live coordinator instance.

### Persistent inflight journal

Before a batch is dispatched, its selected cells are moved from `pending` to persistent `inflight` state and the mission is saved. A restarted process reuses the same stable task IDs from that inflight journal. Counters are advanced only after the batch returns, then `inflight` is cleared and saved.

### Retry-idempotent cell receipts

`OmegaSwarmCell` keeps a bounded result cache keyed by the stable task ID `${mission.id}:${cell.order}`. A repeated task ID returns the previously stored result/receipt instead of incrementing the cell task counters again. This is a retry-safe observable-result contract, not a claim that external infrastructure provides a universal exactly-once execution primitive.

### Strict terminal accounting

A coordinator cannot become terminal merely because `pending` is empty. Terminal completion requires:

```text
pending == 0
inflight == 0
completed + failed == total
```

If work disappears from accounting, the mission becomes `INVARIANT_VIOLATION` with `INCOMPLETE_TERMINAL_REJECTED`; it does not emit successful proof state.

### Strict warp receipt admission boundary

The R176 aggregate remains schema-compatible but carries `integrityRevision: R177`. A warp receipt exists only when every child shard both reports a terminal state and satisfies exact accounting. Any terminal-but-under-accounted shard forces `INVARIANT_VIOLATION`, HTTP 409 on the warp status/tick surface, and no warp receipt.

## Preserved architecture

R177 preserves:

- PULSE = 12 cells
- FLOCK = 24 cells
- ORGAN = 144 cells
- WARP = 576 cells across four coordinator shards
- FULL = 1,728 cells across twelve coordinator shards
- 20,736 execution lanes
- existing `OmegaSwarmCoordinator` and `OmegaSwarmCell` Durable Object classes
- the existing 24-cell coordinator batch size
- the current 288-cell structural dispatch ceiling across twelve shards per explicit wave
- Genesis, Optical, Workers AI, deterministic and reference-computation executor routes
- returned-not-admitted authority and `canonicalMutation: false`

No new Durable Object migration is required.

## Live proof gates

R177 is not considered proved by source tests alone. Production must pass two fresh post-deploy runs:

1. **WARP proof:** 576 total, 576 completed, 0 failed, four shards, strict completion invariant true, valid Merkle-rooted receipt.
2. **FULL proof:** 1,728 total, 1,728 completed, 0 failed, twelve shards, strict completion invariant true, valid Merkle-rooted receipt.

Only after both exact runs pass may the system use this fabric as a trusted execution substrate for a later self-build candidate layer. Neither run mutates CanonState.

## Truth boundary

“Warp” is an OMEGA software orchestration term for sharded bounded computation over persistent actors and service-bound organs. It is not a faster-than-light, infinite-compute, physical-dimension, or performance-guarantee claim. The 12 → 144 → 1,728 → 20,736 hierarchy is software address/execution resolution.
