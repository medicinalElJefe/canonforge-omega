# Governed adaptive learning

This Genesis subsystem is a new governed reconstruction informed by the Drive execution report v31r1__INTEGRATION_REPORT.txt. That report supports that an earlier v7 family had an app/core/adaptive_learning.py layer described as persistent memory, predictor, RL adapter, and boundary-coherence logic. It also explicitly says v7 was a first unified pass and that several donor packages remained architectural references.

Genesis therefore does not copy or overstate those older claims. It restores the useful contract under the current cloud constitution.

## Runtime contract

omega_genesis.learning.LearningMemory records bounded outcome events against the currently observed canonical state identity. The learning journal is append-only and hash chained.

Each event carries:

- canonical state id and SHA-256 digest;
- a bounded context key;
- an action label;
- reward in [-1, 1];
- evidence class;
- previous-event hash and event hash;
- canonical_mutation = false.

The learner cannot commit, rewrite, roll back, or replace OMEGA canonical state.

## Deterministic prediction

Recommendations are reconstructed from the verified event journal. Actions are ranked by empirical reward with a count-weighted confidence term and deterministic tie breaking.

A max_seq view provides historical replay without deleting newer learning records. Corrupted memory fails verification and refuses further append operations.

## API

- GET /api/learning/status
- GET /api/learning/predict?state_id=<id>&context=<key>&max_seq=<optional>
- POST /api/learning/observe

The POST endpoint binds the event to the server's actual current canonical state, rather than accepting a caller-supplied state identity.

## Boundary

This is adaptive recommendation memory, not an independent authority and not proof of general intelligence. OMEGA's canonical runtime, Mode 188/admission logic, proof chain, deployment gates, and rollback authority remain above it.
