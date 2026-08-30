# OMEGA Genesis architecture

## Governing equation

The software is organized around the operational abstraction:

`OMEGA = State + Intelligence + Memory + Relation + Computation + Action + Observation + Proof`

These are not independent competing programs. They are stages and capabilities around one canonical packet stream.

## Authority topology

```text
external sources / operator / corpus / plugins
                    │
                    ▼
             Observation adapters
                    │  evidence class + provenance
                    ▼
             Canonical proposal
                    │
       ┌────────────┴────────────┐
       ▼                         ▼
 Mode/Calculus stack         Frozen prior
       │                         │
       └────────────┬────────────┘
                    ▼
           Mode 188 / proof gate
                    │
           ACCEPT / TURN / PRUNE
                    │
                    ▼
          Canonical State Runtime
                    │
          append-only proof receipt
                    │
       ┌────────────┼─────────────┐
       ▼            ▼             ▼
    renderer     forecast       plugins
   (derived)     (forecast)   (bounded views)
```

## Kernel invariants

1. `CanonicalPacket` is the only canonical state object.
2. The runtime is the only code path that persists a canonical mutation.
3. Evidence may be preserved or downgraded by transforms; it is not silently promoted.
4. A render frame must carry the canonical state digest and a deterministic projection fingerprint.
5. Phase interpolation occurs once; observer/render modes consume the result.
6. Forecast prior is frozen before later observations are used and records `future_observation_used=false`.
7. Rejected transitions receive proof receipts too.
8. Plugins propose; they do not commit.
9. Unknown donors are classified before execution.
10. Missing external evidence yields HOLD/NO_EVIDENCE.

## Calculus layering

The build keeps formula families distinct so their semantics do not collapse into one opaque score:

- **Mode 188 ratio**: `CΩ / (Λ + q + Λq)`.
- **DEWEY-BAL burden compression**: `1 - clamp(Λ)` for the accepted B058 regression contract.
- **RSC**: capacity/load/margin accounting over CΩ, Φ, Λ, q, S, evidence and scar.
- **Deep Mother**: preservation / recoverability / future-plasticity weighting.
- **High Father**: structure / evidence / boundary weighting.
- **Deep Thought**: conservative harmonic cross-check across coherence factors.
- **Motion Relativity**: phase, velocity, acceleration, jerk and quantized heading as a view of one executed corridor.
- **Water / Liquid**: derived conductance lens; not a material measurement.

The mode engine exposes these results side-by-side instead of pretending they are interchangeable.

## Plugin contract

Plugins declare:

- id, name, version, API version, entry
- permissions
- capabilities
- optional mutation requests

Denied mutation classes include direct canonical commit, evidence promotion, proof rewrite, arbitrary shell and arbitrary external network authority. A plugin that needs a state change must return a proposal to the runtime.

## Hybrid Link

Hybrid Link remains an authorized local host adapter. A job is a typed plan constrained to an approved root. No arbitrary shell is part of the protocol. Every plan receives a deterministic fingerprint so the result can be returned with proof.


## Canonical replay journal

Every committed canonical packet is appended to `state_history.jsonl` with its packet digest. Startup treats a valid journal head as recovery authority and rewrites the compatibility snapshot if the snapshot lags. Replay verification recomputes every packet digest, enforces monotonic sequence and parent linkage, checks the current head, verifies the proof receipt chain, and confirms every COMMIT receipt references journaled states. A non-empty invalid journal stops recovery rather than silently reseeding over evidence.

## Hybrid Link execution boundary

Hybrid Link is executable on the sovereign local host, but only through typed operations inside `OMEGA_HYBRID_ROOTS`. The current operations are `READ_FILE`, `WRITE_OUTPUT`, `HASH_TREE`, `INDEX_CORPUS`, `RUN_VERIFICATION`, and `TRAIN_LOCAL_BOUNDED`. Reads/writes are bounded, path escape is rejected before execution, outputs are fingerprinted, and there is no arbitrary-shell opcode. The public cloud runtime can validate the interface but refuses host filesystem execution.

## Workbook roundtrip boundary

Excel workbooks are handled on an authorized local host. Genesis fingerprints semantic workbook content before and after a save roundtrip and fails if the semantics drift. Private workbook content is not embedded in the public Worker.
