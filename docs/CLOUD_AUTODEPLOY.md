# OMEGA pull-based autonomous cloud deployment

OMEGA now has a host-side deployment path that does not require the production VM to be a GitHub Actions self-hosted runner.

## Authority chain

The host never deploys `genesis-latest` directly.

The governed self-build workflow:

1. compiles/tests/verifies OMEGA;
2. regenerates the canonical build ledger;
3. proves deterministic release reproducibility;
4. builds and publishes the container;
5. resolves the container to an immutable OCI digest;
6. writes `cloud/omega-cloud/promotion.json` only after the build decision is `PROMOTE`.

The host watcher reads that small governed promotion ledger over HTTPS. The ledger contains an immutable image digest plus source, trigger, manifest, release, and workflow identities. The watcher validates the ledger and exact expected GHCR repository before it invokes the existing immutable deploy transaction.

The mutable `genesis-latest` tag is therefore a convenience pointer only. It is not deployment authority.

## Host watcher

`scripts/cloud_watch.py --watch` polls every five minutes by default.

For a newly promoted immutable digest it executes `scripts/cloud_deploy.py`, which:

- pulls the digest-pinned image;
- updates the OMEGA, selfbuilder, and backup services to that exact image;
- preserves the canonical data volume;
- queries the loopback health endpoint;
- requires runtime OK, proof valid, replay valid, canonical state identity, and provenance validation;
- records promotion only after those checks pass;
- restores the previous immutable image on failure.

A failed candidate is quarantined for 30 minutes before it may be attempted again. A currently active digest is skipped.

Host state is kept under `/var/lib/omega-deploy` by default.

## One-time host bootstrap boundary

The repository includes `cloud/omega-cloud/systemd/omega-cloud-watch.service` as the service definition for a Linux VM whose checkout is installed at `/opt/omega`.

The host still requires one real infrastructure bootstrap:

- Linux host/VM with Docker + Compose;
- repository checkout at `/opt/omega`;
- `cloud/omega-cloud/.env.cloud` containing generated OMEGA secrets;
- systemd unit installed/enabled;
- network/DNS pointing the selected domain to the host;
- GHCR read access only if the package is not publicly pullable.

The main OMEGA application containers are never given the Docker socket. Deployment authority stays at the host supervisor boundary.

## Important deployment repair

The Compose stack binds the runtime health port only to `127.0.0.1:8127`, enabling the governed host health probe without exposing that port publicly. Caddy remains the public HTTPS ingress.

The immutable deploy override pins all OMEGA-code services—`omega`, `selfbuilder`, and `backup`—to the same candidate digest. This avoids a mixed-generation cloud stack.
