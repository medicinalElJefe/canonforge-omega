# OMEGA V6 — Full Convergence Runtime Architecture

This branch replaces seed/demo-first development with a single governed system path.

## Authority chain

`SourcePacket -> StateEnvelope -> Relation/Shell -> 011 / 01-1 -> Mode 188 -> Motion Relativity -> Forecast or Action -> Proof -> Ledger -> next StateEnvelope`

The canonical runtime state is singular. UI, renderers, AI, mobile clients, the Cloudflare Worker, and the Desktop/Hybrid Link are views/adapters. They may propose work; they do not independently become truth authorities.

## Truth boundary

Every state carries an evidence class: `OBSERVED`, `IMPORTED`, `DERIVED`, `FORECAST`, `SYMBOLIC`, or `USER_ASSERTED`. A transform cannot silently upgrade evidence class. A forecast cannot mutate canonical state without later observed/imported evidence and a new accepted transition.

## 20,736 representation

The canonical executable software lattice is `Domain × Phase × Regulation × Layer = 12^4 = 20,736`. The address codec is exact and round-trip tested across all 20,736 states. 144, 1728, 20,736 and larger counts are representation/state-space sizes unless independently evidenced otherwise; the runtime does not claim they are physical dimensions.

## Dewey / Mode 188 operators

The implemented state ratio is `S = C / (Λ + q + Λq)`. Default turn band is `[0.95, 1.05]`, matching the recovered control workbook. The gate emits `STAY`, `TURN`, or `ESCALATE`, with `ACCEPT`, `CONDITIONAL`, or `PRUNE` admission. `011` and `01-1` are represented explicitly as construct and prune scores, with an integrated Omega result and rejected alternatives retained in the proof record.

## 1+6 shell and simplex

The local detector consumes six neighbor amplitudes, computes opposite-pair axes `(a0-a3, a1-a4, a2-a5)`, then reduces magnitudes to barycentric lambdas. The canonical worked example `(2,5,3,1,4,0)` produces axes `(1,1,3)` and simplex `(0.2,0.2,0.6)`; this is covered by tests.

## Motion relativity

Observer transforms carry explicit observer ID, phase offset, scale, rotation and a declared time basis. The current reference implementation includes reversible phase transforms, outverse/inverse pairing via the opposite address, and an explicit local shell-axis rotation. These transforms do not mutate the underlying canonical record.

## Proof and replay

Accepted and rejected transitions append to a hash-chained JSONL proof ledger. Each record stores input/output digest, decision, evidence, rejected alternatives, timestamp and previous-record hash. Chain verification is executable.

## Sovereign PC / Hybrid Link boundary

The bridge protocol remains typed and allow-listed. Paths must be relative to an approved root. No arbitrary shell is introduced. Host execution requires explicit confirmation and must return proof. The historical Hybrid Link family remains donor material until each capability is wired under this authority path and re-tested.

## Public Cloudflare layer

`cloudflare/omega-v6-worker` is a public interface/gateway only. It serves the living state instrument and proxies `/api/*` to a configured sovereign origin. When the host is absent it returns an explicit unavailable state and does not fabricate runtime values. The Worker is deployable independently of the Python runtime, but it is not canonical state authority.

## Build acceptance

The branch includes an exhaustive 20,736 address round-trip test, AutoPing/opposite invariants, shell/simplex worked-example test, single-authority transition test, forecast truth-boundary test, observer round-trip test, bridge path/confirmation tests, and proof-ledger verification. Further donor ingestion must preserve these gates and expand the regression matrix rather than replacing them.
