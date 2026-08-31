# Cloud-resident autonomous build loop

OMEGA has two build loops.

## Inner loop — running OMEGA Cloud

The cloud stack includes a dedicated \`selfbuilder\` service. While the cloud stack is running it repeats a bounded verification/rebuild cycle every 10 minutes by default:

1. compile the Python runtime;
2. run the full pytest suite;
3. verify the canonical manifest and capability contract;
4. build the deterministic release;
5. rebuild it and require an identical SHA-256;
6. query the live OMEGA Cloud health endpoint and require proof + replay PASS;
7. archive a content-addressed verified release under \`/data/self-build/releases/\`;
8. atomically publish \`/data/self-build/status.json\`;
9. append the result to \`/data/self-build/journal.jsonl\`.

A failed gate produces \`QUARANTINE\`. The daemon continues running and tries again on the next cycle.

The live API exposes the latest result at \`/api/self-build/status\`.

This loop rebuilds and verifies the **current deployed generation**. It does not silently rewrite core source code.

## Outer loop — repository/cloud-image promotion

The GitHub governed self-build remains responsible for the stronger build boundary:

- source checkout;
- complete verification;
- canonical ledger repair;
- Worker validation;
- cloud-container build;
- immutable OCI publication;
- promotion of the \`genesis-latest\` image only after every mandatory gate passes.

Human/AI engineering can continue proposing source improvements. Once committed, the outer loop builds the next cloud image; after deployment, the inner loop continuously checks that generation.

## Security boundary

The running cloud service has no permission to mutate arbitrary repository source. Core source evolution remains \`proposal_only\`. This keeps the verifier independent of the code being judged and prevents a compromised runtime from silently redefining its own acceptance criteria.
