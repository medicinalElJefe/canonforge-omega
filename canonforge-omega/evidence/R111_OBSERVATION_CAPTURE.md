# R111 — Governed Later Observation Capture

## Material delta
The existing `/calibration` workbench now exposes explicit later-observation capture for the same Unified Operational Core validation loop. The UI edits only the replay envelope (`observation` + `baseline_probability`) and submits the existing frozen `forecast_packet` to `/api/core/replay`.

## Truth / authority
- User-entered observations default to `USER_DEFINED_MODEL`.
- `authenticated_source=true` in the browser is a declaration, not independent authentication proof.
- The replay authority retains its existing gate: authenticated evidence requires `OBSERVED/MEASURED` plus authenticated-source state.
- Observation time remains subject to R107 future-leakage ordering.
- Historical forecasts are never rewritten.
- No canonical state, policy, operator weights, production rollout, native execution, or Hybrid authority is mutated.

## Capability disposition
- KEEP: R107 replay scorer and frozen-prediction contract.
- BIND: later-observation capture into the existing Calibration/Governance surface.
- PRUNE: duplicate observation engine or duplicate state path.
- QUARANTINE: UI authentication declarations from being treated as source authentication proof.

## Evidence classes affected
`USER_DEFINED_MODEL`, `OBSERVED/MEASURED`, `DERIVED_FROM_OBSERVED`, `NO_EVIDENCE`.

## Promotion condition
Exact-head full runtime tests and Cloudflare typecheck must pass before merge. Post-merge verification and authorized Cloudflare convergence proof remain required before claiming live promotion.
