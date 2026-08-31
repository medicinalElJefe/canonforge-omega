# OMEGA Cloud

OMEGA Cloud is the canonical always-on host for Genesis. Desktop and mobile devices are clients or explicitly paired nodes; they are not required for canonical state survival.

## Authority model

- Canonical state, proof ledger and append-only journal live in the persistent `omega_data` volume.
- The web cockpit and REST API are served by the same Genesis runtime.
- Browser access uses a signed HttpOnly session cookie created from the operator token.
- The live canonical heartbeat is proxied as `/stream` over the same HTTPS origin and validates the session cookie.
- Caddy terminates HTTPS and forwards only to the internal runtime network.
- Automatic snapshots are written every six hours to the persistent backup volume.
- `/workspace` is cloud-hosted working storage for governed workbook, corpus and Hybrid operations.
- A PC Hybrid Link may later pair as a compute/IO node, but loss of that PC does not remove cloud state authority.

## First deployment on a cloud VM

Requirements: Docker Engine + Docker Compose v2, a DNS A/AAAA record for the chosen domain, and TCP 80/443 open.

```bash
python scripts/cloud_bootstrap.py --domain omega.example.com
cd cloud/omega-cloud
docker compose up -d --build
```

Open the configured HTTPS URL and enter the generated OMEGA Cloud operator token.

## Persistence and recovery

The application image is replaceable. Canonical data is not stored in the container layer.

```text
omega_data     canonical packet, journal, proof and runtime state
omega_backups  timestamped compressed snapshots
workspace/     governed cloud working files
caddy_data     TLS certificates
```

To inspect service health:

```bash
docker compose ps
docker compose logs -f omega
```

To create an immediate backup:

```bash
docker compose run --rm backup python scripts/cloud_backup.py --data /data --out /backups
```

Restore operations must be performed while the `omega` service is stopped so the append-only journal and compatibility snapshot cannot race the restore.

## Security boundary

Never commit `.env.cloud`. The generated operator token, gateway token and session secret are cloud credentials. The example file contains placeholders only.

The cloud runtime refuses to start in `OMEGA_CLOUD_MODE=1` when cloud authentication is missing.

## AppDeploy target

AppDeploy can also host this cloud role when its ChatGPT connector is authenticated. Its deployment instructions must be loaded before translating Genesis into AppDeploy-native database/storage/auth primitives. Until that connector is authorized, this OCI stack is the provider-neutral canonical cloud implementation.
