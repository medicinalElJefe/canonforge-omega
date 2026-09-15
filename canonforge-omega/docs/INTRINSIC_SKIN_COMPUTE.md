# OMEGA Intrinsic Skin Compute

Canonical computational coordinate:

`OmegaAddr = (address, skin, frame, time/evolution, orientation, history_path)`

Supported atlas lenses: `12 -> 144 -> 1728 -> 20736 -> 248832`.

These are computational resolution/address lenses. They are not asserted to be literal physical dimensions.

## Runtime contract

A persistent core basis is projected into a skin-specific state through a registered projector. Relations, geometry, motion and history remain explicit. Cross-skin translation is registered rather than guessed. Compression may lose information; coarse-to-fine expansion must not fabricate certainty.

Three edge families define the woven compute graph:

1. relation edges: address <-> address;
2. skin edges: resolution <-> resolution;
3. time/evolution edges: state(t) -> state(t+dt).

## Adaptive resolution

`STAY`: current skin resolves the task.

`ESCALATE`: residual or cross-skin contradiction exceeds tolerance and a finer skin exists.

`TURN`: unresolved contradiction remains at the configured ceiling; change model/frame/operator rather than pretending additional resolution exists.

`PRUNE`: finer resolution provides insufficient marginal gain.

## Learning governance

OBSERVE -> ADDRESS -> PROJECT -> RELATE -> GEOMETRY -> MOTION -> PREDICT -> COMPARE -> RESIDUAL -> CROSS-SKIN TEST -> STAY/TURN/ESCALATE/PRUNE -> LEARN CANDIDATE -> REPLAY -> FALSIFY -> PROVE -> PROMOTE -> LEDGER.

Candidate learning cannot directly rewrite Canon. `CanonGate` requires replay, invariant, cross-skin, provenance and rollback checks before PROMOTE.

## Integration rule

Existing OMEGA engines may adopt `OmegaAddr` and `NodeState` incrementally. Do not replace domain metrics with arbitrary Euclidean distance: register the metric, projector and translator appropriate to the data domain. Missing or unresolved variables remain unknown rather than being synthesized as facts.
