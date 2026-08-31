# R85 — OmegaRuntime Durable Object recovery

R85 repairs the production hold discovered after R84.

## Evidence chain

The live Cloudflare deployment rejected a candidate that omitted the existing `OmegaRuntime` Durable Object. The exact public historical behavior was then recovered from the `medicinalElJefe/OMEGAv6` lineage:

- R32 commit `d7cbbfe166baf04a42dc7a50d13776ac33ef742b` introduced the enacted Durable Object.
- R33 commit `ca0660a128f8df88375a9f8e27931c94208c159b` extended it into living durable thread memory.
- Binding: `OMEGA_RUNTIME`.
- Class: `OmegaRuntime`.
- SQLite migration tag: `r32-enacted-runtime`.

## Recovered behavior

The current V6 candidate restores the state keys and bounded routes for pairing, device registration, authenticated heartbeat, job leasing, proof returns, missions, events, and durable thread memory. Native execution remains proof-gated. A device is only reported online when its authenticated heartbeat is current.

R33 semantics are retained: successful host proof completes the current mission; failed host proof moves it to `HOLD_REPAIR_REQUIRED` and does not create a blind retry. Thread retention remains bounded to the last 48 durable turns.

## Non-regression rule

The V6 compatibility evaluator now verifies more than the class export. It requires the recovered behavior markers, binding identity, and migration identity before production deployment can proceed.

This is a targeted capability recovery, not a wholesale donor merge. The obsolete historical public Worker wrapper is not restored; current V6 routing, convergence, visual runtime, and sovereign gateway boundaries remain authoritative.
