# Release-aware canonical cloud deployment — generation 1

Objective: ensure a successful governed canonical Self-Build can deterministically trigger Cloudflare deployment evaluation even when its final ledger commit intentionally uses `[skip ci]`.

The candidate does not weaken or edit the protected evolution policy, trusted comparator, Self-Builder, verifier, or candidate gate. It adds a separate deployment-event authority gate, tests rejection of failed/noncanonical/untrusted events, and makes the Cloudflare workflow react to successful canonical Self-Build completion while checking out the latest `omega-genesis-v1-full` head.

Truth boundary: workflow authorization is not evidence that Cloudflare publication occurred. Production truth remains the existing post-deploy live health, canonical-state, proof-chain, replay, and rollback checks.

Reversibility: reverting this candidate restores the previous push/path-filter deployment behavior without changing canonical state formats or protected governance policy.
