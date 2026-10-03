# OMEGA Recursive Resolution Calculus

This is the governed successor layer to **Intrinsic Skin Compute**. It does not
replace the existing kernel. It extends the same addressed-state model with:

- bounded dynamic branching,
- physical-veto-first resolution,
- bidirectional reachability,
- exact branch scars,
- reusable lemmas,
- theorem/lens promotion,
- and cross-resolution commutation audits.

The guiding rule is:

> Many lenses may inspect one canonical state, but no lens may override
> measured evidence or an established physical veto.

## 1. Canonical addressed state

OMEGA continues to use:

`OmegaAddr = (address, skin, frame, time/evolution, orientation, history_path)`

with skins:

`12 -> 144 -> 1728 -> 20736 -> 248832`

These are **address/resolution lenses**, not literal physical dimensions.

A resolved state is still a `NodeState`; the new layer adds explicit branch,
transition, reachability and proof contracts around those states.

## 2. Evidence authority

Physical authority is ordered:

1. `MEASURED`
2. `DERIVED_STANDARD`
3. `DERIVED_LENS`
4. `HYPOTHESIS`

A weaker layer may organize, rank, render, or generate hypotheses from stronger
layers. It may not silently overwrite them.

## 3. Physical veto before Canon score

A branch may carry the familiar lens terms:

`CΩ, Φ, q, Λ`

and, where explicitly declared:

`S = (CΩ * Φ) / (q + Λ + ε)`

But scoring happens only **after** physical and Canon admissibility.

Execution order:

```
OBSERVE
-> ADDRESS
-> FRAME
-> NORMALIZE
-> CONSTRAIN
-> BRANCH
-> PHYSICAL_VETO
-> CANON_VETO
-> FORWARD_MODEL
-> COMPARE
-> RESIDUAL
-> SCORE
-> HEAVY_PRUNE
-> FUTURE_MANIFOLD
-> INFORMATION_GAIN
-> OBSERVE_AGAIN
```

If an established physical constraint fails, the branch becomes
`REJECTED_PHYSICAL`. A high lens score cannot revive it.

## 4. Bidirectional reachability

For an unknown state between known constraints:

`A_k = R_plus(k) intersect R_minus(k) intersect C_k`

where:

- `R_plus` is the forward-reachable set,
- `R_minus` is the backward-reachable set,
- `C_k` is the set satisfying physical and boundary constraints.

The runtime classifies the result as:

- `RESOLVED` — one admissible match,
- `BOUNDED` — multiple admissible matches,
- `INCONSISTENT` — no match under the current model/data.

This is the exact computational meaning of an "inevitable pathway": the
surviving intersection of independent constraints, not a narrative guess.

## 5. Transition records

A `TransitionRecord` binds:

- source address,
- target address,
- time delta,
- state/geometry/motion deltas,
- transform metadata,
- physical checks,
- provenance,
- residuals.

Every transition has a stable hash-derived identity. This supports replay,
deduplication, ledger scars, and exact path reconstruction.

## 6. Lemmas

A `Lemma` is a reusable validated contract:

`input_contract -> output_contract`

with:

- proof class,
- evidence authority,
- assumptions,
- validation status,
- source-lemma lineage.

Composition is permitted only when the output contract of one lemma satisfies
the input contract of the next.

If:

`L1: A -> B`

and:

`L2: B -> C`

then:

`L2 o L1: A -> C`

may be constructed.

The composed lemma inherits the **weakest** proof class and **weakest**
authority in the chain. This prevents compounding from silently increasing
truth authority.

## 7. Proof classes

Cross-scale correspondences are classified as one of:

- `PHYSICAL_INVARIANT`
- `STRUCTURAL_ANALOGY`
- `REPRESENTATIONAL_COINCIDENCE`
- `UNRESOLVED_HYPOTHESIS`

Shared notation, normalized shape, or visual similarity is never enough to
promote a relationship to physical invariant.

## 8. Larger lenses by composition

A larger lens is not trusted merely because it has more addresses.

To promote a coarse or compounded model, compare:

`project(evolve_fine(x))`

against:

`evolve_coarse(project(x))`

using:

`projection_commutation_residual(...)`

A small residual means the coarse lens preserves the tested dynamics within
the declared tolerance. A large residual means the projection discarded
dynamically important information.

This gives OMEGA an executable test for whether recursive resolution actually
preserves the localized mathematics.

## 9. Promotion ladder

Promotion levels are:

`EDGE -> LEMMA -> THEOREM -> LENS`

All levels retain the original Canon requirements:

- replay,
- invariants,
- cross-skin proof,
- provenance,
- rollback.

Higher levels add stronger gates:

### LEMMA
- replication,
- out-of-sample evidence.

### THEOREM
- replication,
- out-of-sample evidence,
- compatible composition.

### LENS
- all theorem requirements,
- projection/evolution commutation,
- bounded residual.

No larger lens is allowed to gain authority merely through aggregation.

## 10. Information gain

OMEGA may choose the next observation by expected entropy reduction when a
real probability model exists.

If a likelihood model does not exist, the runtime must use an explicitly
non-probabilistic discrimination score instead of manufacturing probabilities.

## 11. Integration with OMEGA

Existing systems should integrate this layer incrementally:

- Earth/weather engines: reachable atmospheric and radiative state manifolds.
- Motion/traversal engines: state-transition and path reconstruction.
- Color/spectral engines: Doppler/radiative constraints plus observer frame.
- Atomic/chemistry engines: selection-rule and reaction-path pruning.
- CLOUD-01/self-editing: proof-guided candidate branches and decline scars.
- CanonState: persistent branch lineage, residuals, proof class and promotion status.
- Renderers: visualize canonical branch state; never manufacture state authority.

The intended architecture is:

```
FACT
-> STATE
-> EDGE
-> PATH
-> LEMMA
-> THEOREM
-> LENS
```

Each promotion carries forward provenance, assumptions, residuals, rejected
branches and rollback identity.

## 12. Truth boundary

This runtime does **not** claim that every unknown is mathematically
recoverable, that the OMEGA lens variables are universal physical laws, or
that higher address counts are new physical dimensions.

It does provide a rigorous structure for determining:

- what is entailed,
- what is bounded,
- what is inconsistent,
- what remains unresolved,
- and what observation would discriminate the surviving branches.
