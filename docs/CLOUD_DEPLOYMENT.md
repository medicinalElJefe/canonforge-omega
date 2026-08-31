# OMEGA Cloud immutable deployment and rollback

This layer extends the verified self-build pipeline with a bounded production-deployment transaction.

## Contract

A production candidate is accepted only as a digest-pinned OCI reference:

`registry/image@sha256:<64 hex>`

Mutable tags such as `genesis-latest` are never used as the production authority. The promotion workflow resolves the successful self-build source tag to its immutable OCI digest before any deployment job can run.

## Deployment transaction

On an authorized canonical cloud host, `scripts/cloud_deploy.py` performs:

1. read the previously promoted immutable image from the host deployment ledger;
2. pull the candidate digest;
3. launch the candidate for the `omega` and `selfbuilder` services with Docker Compose and `--no-build`;
4. query `/api/health` repeatedly;
5. require runtime `OK`, proof `valid`, replay `valid`, a canonical digest, and a valid state id;
6. atomically record the candidate as active only after those checks pass;
7. append the result to a deployment journal.

If the candidate does not pass live health/proof/replay validation, the deployer attempts to restore the previous digest-pinned image. A successful restoration is recorded as `ROLLBACK`; otherwise the deployment is `QUARANTINE`.

The deployer never rewrites OMEGA canonical state to make a candidate pass. It changes only the container generation hosting the state and observes the existing proof/replay contract.

## Automation boundary

`.github/workflows/cloud-promote-deploy.yml` starts only after a successful `OMEGA Governed Self-Build` or an explicit manual dispatch. It resolves the published source-SHA image to an OCI digest on a GitHub-hosted runner.

Actual production mutation is disabled unless repository variable `OMEGA_AUTODEPLOY_ENABLED=1` is configured. The deployment job additionally requires an authorized self-hosted runner carrying labels:

- `self-hosted`
- `linux`
- `omega-cloud`

That runner is the explicit infrastructure boundary. Until it exists and is authorized, the workflow reports the boundary and makes no production-deployment claim.

Recommended production variables/secrets:

- `OMEGA_AUTODEPLOY_ENABLED=1`
- `OMEGA_DEPLOY_HEALTH_URL` — canonical host health URL, preferably loopback or protected internal ingress
- `OMEGA_DEPLOY_STATE_DIR` — persistent host path such as `/var/lib/omega-deploy`
- `OMEGA_GATEWAY_TOKEN` — secret accepted by the canonical runtime health endpoint

## Truth boundary

Passing repository tests proves the deployment logic and invariants. It does **not** prove a production deployment occurred. Production evidence exists only when the authorized host runner executes the deployment transaction and the live proof/replay health gate passes.
