# OMEGA governed continuous evolution

Continuous self-build is not continuous improvement. Rebuilding unchanged source only proves reproducibility.

OMEGA separates four loops:

1. Observe — runtime health, proof/replay, self-build evidence, capability registry, and admitted provenance.
2. Diagnose — compile a weighted backlog of unmet objectives and external evidence boundaries.
3. Develop candidates — an authorized coding agent implements the highest-value objective only on a candidate/source-change boundary.
4. Prove and promote — a candidate must improve the quality vector without regressing protected dimensions, then still pass the normal compile/test/release/container/live-deployment gates.

The quality vector includes manifest integrity, provenance integrity, LIVE_CORE capability count, total capability count, achieved evolution objectives, and weighted objective progress/gap.

A candidate is quarantined if any protected dimension regresses. A source candidate must show at least one measurable strict improvement. The evolution comparison never substitutes for the normal build, deterministic release, immutable deployment, proof/replay, provenance, or rollback gates.

## Cloud loop

The cloud Compose stack runs an evolver service every 15 minutes. It writes:

- /data/evolution/status.json
- /data/evolution/backlog.json
- /data/evolution/journal.jsonl

External or target-specific proof is admitted only by explicit evidence records under /data/evolution/evidence/<key>.json. Missing external evidence is a boundary, never success.

## Repository loop

The hourly OMEGA Continuous Evolution Audit workflow runs the regression suite and emits a fresh source-level quality vector/backlog artifact even before a permanent cloud host exists.

## Source mutation boundary

Running production containers do not receive Git credentials, repository write credentials, or the Docker socket. Canonical source mutation remains candidate_only.

An authorized coding agent can use the backlog to create a candidate change. The candidate must then pass strict no-regression comparison and all existing proof gates before it can become a promoted cloud image.

Continuous development therefore means:

observe -> find gap -> propose -> implement candidate -> test -> compare -> quarantine/promote -> deploy -> observe again

not uncontrolled self-rewriting.
