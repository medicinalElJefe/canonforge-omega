# OMEGA governed self-build

OMEGA's self-build loop is stronger than ordinary CI and narrower than unrestricted self-modification.

## Automatic build authority

On the canonical Genesis branch, the self-builder can:

1. compile the Python runtime;
2. run the complete pytest acceptance suite;
3. regenerate omega.manifest.json and SHA256SUMS.txt;
4. verify the regenerated canonical release ledger;
5. build the deterministic release twice and require byte identity;
6. validate the Cloudflare edge Worker;
7. build the canonical OMEGA Cloud container image;
8. commit only repaired manifest/checksum ledgers when source changed;
9. upload the verified release and build report;
10. publish immutable OCI images to GitHub Container Registry;
11. move the genesis-latest image tag only after every mandatory gate passes.

A scheduled run rebuilds the system even when no human commit occurs.

## Source mutation boundary

The builder cannot silently alter core source code. config/self_build_policy.json fixes source mutation to proposal_only and limits automatic repository writes to:

- omega.manifest.json
- SHA256SUMS.txt
- release/**

This prevents a failed or compromised build from rewriting the runtime that judges the build.

## Promotion rule

All mandatory gates must be PASS or, for build-ledger regeneration, REPAIRED. Any missing or failed gate produces QUARANTINE. A quarantined build is not eligible for the moving cloud image tag.

## Cloud authority

The canonical authority remains OMEGA Cloud. Desktop and mobile runtimes are optional authorized nodes; their absence does not invalidate cloud state or prevent cloud self-build.
