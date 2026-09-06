# OMEGA R175 — Sovereign Independent Solver-Family Validation

R175 closes the gap between OMEGA's reduced-order optical screening and an authenticated native full-wave Maxwell solve without confusing numerical validation with measurement or Canon authority.

## Execution chain

`operator intent -> Genesis proposal -> Optical R115 reduced-order screen -> STAY gate -> OMEGA_FULLWAVE_QUEUE_v1 -> exact SHA-256 challenge -> governed cross_runtime_validate lease -> authenticated Sovereign PC -> NumPy + grcwa RCWA -> native result + receipt -> persisted evidence -> hash/identity/convergence gates -> L4 independent solver-family validation`

The R174 federation remains the upstream organism. R175 is additive and does not replace the existing canonical runtime, swarm, R170 computation, R172 validation, R173 parity, or R174 federation surfaces.

## Validation levels

- L0: schema / supplied structure
- L1: invariant or internal consistency
- L2: independent formulation within the same runtime family
- L3: same mathematical model executed independently in Cloudflare and on the authenticated Sovereign PC
- L4: independent solver-family numerical validation; R175 currently requires native `grcwa` RCWA
- L5: external observation / measurement

A passing R175 receipt is L4. It is not fabrication validation, measured optical performance, measured material dispersion, or L5 evidence.

## No-fallback law

`omega_runtime.rcwa_solver` has no scalar/TMM/fake RCWA fallback. If NumPy or `grcwa` is unavailable, the authenticated host advertises that limitation and the job blocks. If the solve fails, does not converge, violates its energy tolerance, or returns inconsistent hashes, L4 is rejected.

## Required proof identity

An L4 PASS requires all of the following to be true simultaneously:

1. Persisted governed job kind is `cross_runtime_validate`.
2. Persisted job state is `VERIFIED`.
3. Challenge schema is `OMEGA_INDEPENDENT_SOLVER_CHALLENGE_R175`.
4. Canonical full-wave queue hashes exactly to the persisted `queue_job_sha256`.
5. Returned evidence belongs to the same leased authenticated agent.
6. A positive heartbeat sequence is recorded at execution time.
7. Native result schema is `OMEGA_RESULT_v1`.
8. Solver is `rcwa` and solver family is `MAXWELL_RCWA`.
9. Solver version identifies `grcwa`.
10. Native input identity matches the exact queue hash.
11. Native result and receipt SHA-256 values recompute exactly.
12. Coarse/fine RCWA convergence passes.
13. Energy-balance tolerance passes.
14. Observable bounds remain physically sane within the declared numerical tolerance.
15. Result explicitly denies Canon mutation and external-measurement claims.

## Public surfaces

- `/validate/independent`
- `/api/validate/independent/manifest`
- `/api/validate/independent/prepare`
- `/api/validate/independent/compare`

The operator lab can invoke the R174 optical chain, prepare the exact Tier-2 packet, enqueue the governed Sovereign job, observe returned execution state, and attempt L4 admission from persisted evidence.

## Dependency contract

R175 keeps the heavy solver isolated as an optional Python dependency group:

`python -m pip install -e '.[rcwa]'`

The CI proof workflow installs that group and executes a real transparent-medium `grcwa` convergence test. This proves that the branch can execute the external RCWA implementation rather than merely importing an interface or displaying a simulated result.

## Dimensional boundary

OMEGA scales such as 12, 144, 1,728, 20,736 and deeper atlas resolutions remain software address, routing, representation and execution-resolution levels. R175 does not reinterpret them as literal physical dimensions.
