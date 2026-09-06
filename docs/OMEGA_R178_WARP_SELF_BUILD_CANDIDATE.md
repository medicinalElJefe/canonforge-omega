# OMEGA R178 — Warp Self-Build Candidate Fabric

R178 turns the exact live R177 actor fabric into a governed development input without granting it authority to rewrite OMEGA.

## Enacted convergence

```text
operator objective
  -> R177 bounded warp execution
  -> exact terminal accounting
  -> Merkle-rooted returned-not-admitted receipt
  -> R178 hash-bound candidate capsule
  -> existing /api/development/enqueue contract
  -> authenticated Sovereign host
  -> run_tests
  -> build_vite
  -> wrangler_dry_run
  -> verify_candidate
  -> separate release review / promotion authority
```

The cloud candidate path is deliberately not a hidden production-write path. A swarm receipt can cause a build candidate to exist; it cannot cause source, GitHub, CanonState, or a deployed Worker to change by itself.

## Source gate

`POST /api/swarm/build/candidate` does not trust a client-supplied receipt. The request supplies the live warp session (`warpId`, profile, purpose and coordinator refs), and R178 asks the deployed R176/R177 warp status path to reconstruct the current aggregate receipt from its Durable Object coordinators.

Candidate synthesis is rejected unless all of the following are true:

- aggregate state is `COMPLETE`;
- `integrityRevision == R177`;
- `completedCells == totalCells`;
- `failedCells == 0`;
- strict completion invariant is true;
- every shard is accounted;
- invariant delta is zero;
- invalid shard count is zero;
- receipt schema is `OMEGA_WARP_EXECUTION_RECEIPT_R176`;
- receipt carries `strictCompletionInvariant == true`;
- receipt authority remains `WARP_EXECUTION_RECEIPT_NOT_CANON`;
- Canon mutation, physical-dimension and performance-guarantee claims remain false.

## Candidate capsule

The returned `OMEGA_WARP_BUILD_CANDIDATE_R178` capsule contains:

- source warp identity;
- source result Merkle root;
- source receipt SHA-256;
- an independently canonicalized source-receipt SHA-256;
- objective + SHA-256;
- twelve software capability dimensions;
- additive-successor / no-flattening constraints;
- fixed allow-listed validation actions;
- explicit authority and mutation prohibitions;
- a canonical capsule SHA-256 that is reproduced by both JavaScript and Python.

The twelve candidate capability dimensions are software roles, not physical dimensions:

`SOFTWARE, TEST, UI, FEDERATION, SOVEREIGN, PROOF, DATA, RESEARCH, VISUAL, COMPUTE, RECOVERY, COORDINATION`.

## Sovereign bridge

R178 returns a concrete enqueue contract targeting the already-existing sovereign endpoint:

```text
POST /api/development/enqueue
kind = run_tests
payload.schema = OMEGA_SOVEREIGN_WARP_CANDIDATE_JOB_R178
```

The cloud does **not** submit this automatically. Remote sovereign ingress remains separately authenticated.

`SovereignBuildController.enqueue()` now recognizes the R178 payload schema and rejects it unless:

- the embedded capsule validates;
- the capsule hash matches;
- source warp and receipt identities match;
- the requested job matches its fixed sequence index;
- canonical mutation, deployment and promotion permissions are all false.

Once the first candidate job is verified by the authenticated PC agent, the controller advances the same immutable candidate identity through:

```text
run_tests -> build_vite -> wrangler_dry_run -> verify_candidate
```

Candidate jobs are prioritized ahead of ordinary queued convergence work while an already-leased/running job is respected. A duplicate capsule is deduplicated instead of creating a second candidate workflow.

## Instrument

`/warp/build` is the R178 live instrument. It can launch PULSE/FLOCK/ORGAN/WARP/FULL with an explicit provider budget, auto-advance the strict R177 session, create the candidate capsule only after a valid receipt returns, and expose the Sovereign enqueue contract. It never performs the protected enqueue automatically.

## Live proof

The R178 post-deploy workflow must:

1. wait for the actual public `R178` manifest;
2. execute a fresh exact 12/12 PULSE with zero failures;
3. synthesize an R178 candidate from that live session;
4. reproduce the source-receipt canonical hash in Python;
5. reproduce the full candidate capsule hash in Python;
6. verify all mutation/deployment/promotion boundaries;
7. verify the first Sovereign executable stage is `run_tests`.

R177's exact 576/576 and 1,728/1,728 live proofs remain the execution-scale foundation. R178 adds candidate continuity; it does not reinterpret those software actor counts as physical dimensionality or infinite compute.

## Next successor boundary

R179 may add a **patch proposal capsule** that identifies bounded source deltas and target files, but any actual source mutation must remain a distinct authenticated action with diff evidence, tests, rollback identity and separate promotion authority. R178 intentionally stops before that boundary.
