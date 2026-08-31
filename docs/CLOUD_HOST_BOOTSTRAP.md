# One-time canonical cloud host bootstrap

This is the remaining infrastructure bridge between OMEGA's verified OCI images and an always-on production machine.

The bootstrap is intentionally provider-neutral. It does not create a cloud account, VM, DNS record, billing resource, or secret outside the host. Those are external account boundaries.

## Prepared host requirements

Use a persistent Linux VM with:

- a public IP;
- Docker Engine;
- Docker Compose v2;
- Git;
- Python 3;
- systemd;
- inbound TCP 80/443 allowed.

Clone the active Genesis branch to a stable path, for example:

```bash
sudo git clone --branch omega-genesis-v1-full https://github.com/medicinalElJefe/canonforge-omega.git /opt/omega
cd /opt/omega
sudo python3 scripts/cloud_host_bootstrap.py --domain omega.example.com
```

Replace `omega.example.com` with the real DNS name pointed at the VM.

## What the bootstrap actually does

1. refuses a dirty tracked repository or wrong branch;
2. fast-forwards to the current remote Genesis branch;
3. verifies Docker and Compose;
4. generates `.env.cloud` with fresh cryptographic secrets if none exists;
5. refuses to overwrite existing cloud secrets or silently switch the configured domain;
6. creates a **minimal watcher environment** containing only the gateway token plus internal deployment paths;
7. executes one governed promotion/deploy/recovery cycle;
8. writes a host bootstrap ledger under `/var/lib/omega-deploy/bootstrap.json`;
9. installs and enables the continuous systemd watcher.

The generated cloud admin token is shown once by `scripts/cloud_bootstrap.py`; it should be stored securely. It is not copied into the watcher environment.

## After bootstrap

The production host becomes pull-driven:

`self-build -> governed promotion ledger -> host watcher -> immutable deploy -> live proof/replay/provenance -> promote/rollback -> continuous health recovery`

No GitHub self-hosted runner is required for this path.

The application containers do not receive the Docker socket. Docker mutation remains a host-supervisor authority.

## Boundaries that remain external

The bootstrap cannot create the VM or DNS record by itself without an authorized infrastructure provider/account. If the GHCR package is not publicly pullable, the host must also be authenticated to GHCR with read-only package access before the first cycle.

A successful host bootstrap proves that the local cloud stack was deployed and passed its loopback health/proof gate. It still does not prove public DNS/TLS reachability until the public HTTPS endpoint is checked from outside the host.
