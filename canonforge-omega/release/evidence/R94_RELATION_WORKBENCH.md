# R94 Relation Workbench + Graph Projection

R94 binds a non-mutating relation workbench beneath the existing V6 capability/state dispatcher while preserving `src/heartbeatTruth.ts` as the canonical Worker entrypoint.

Material user-visible change: `/relations` evaluates typed relation declarations using the R93 contract and renders browser-local graph projections. Edge type, evidence class, confidence, provenance, domain/scale, transfer operator, measured invariant, cross-scale state and causal admissibility remain visible in the proof packet.

Truth boundary: browser-local draft edges do not mutate V6 or Genesis canonical state. Cross-domain/cross-scale causal declarations require both an explicit transfer operator and measured invariant. Symbolic edges and symbolic evidence cannot establish empirical causal proof. Even an admissible causal declaration remains not independently verified.

Governance: R87 semantic identity, R88 heartbeat truth, R89 Genesis service binding, R91 capability router, R92 state workbench and R93 relation contract remain intact. No verifier workflow or protected authority path is modified.