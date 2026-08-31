# Reciprocal V6 ↔ Genesis convergence manifest G2

This generation rebuilds the stale reciprocal-convergence candidate on the current verified Genesis head.

## Material change

- Adds a machine-readable Genesis capability/mode/gate genome at `/api/convergence/manifest`.
- Adds live V6 peer observation at `/_omega/convergence`.
- Keeps those surfaces separate so V6 can consume the manifest without creating a recursive V6 → Genesis → V6 convergence request loop.
- Preserves `OmegaGenesisState` and all existing Durable Object authority unchanged.
- Registers CAP-029 as a LIVE_CORE capability.
- Makes capability-count acceptance tests derive from the capability registry instead of a stale hard-coded number.

## Authority boundary

The manifest is sanitized software capability metadata. It contains no private corpus, Drive identifiers, account metadata, secrets or tokens. Peer reachability is observation only. Genesis cannot promote itself into V6 or mutate V6 canonical state.

## Promotion boundary

This branch is a bounded candidate based on the current canonical Genesis lineage. It must pass the trusted candidate gate, full Genesis verification, governed self-build and live deployment verification before it can become canonical.
