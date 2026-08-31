# OMEGA Genesis cloud status

This record intentionally lives under `release/`, which is excluded from the canonical source manifest and reproducible release payload.

## Canonical deployment model

OMEGA Cloud is the canonical always-on host.

- Canonical state, proof ledger and append-only journal live in persistent cloud storage.
- The web cockpit and REST API run from the cloud host.
- Browser access uses an authenticated signed HttpOnly session.
- The canonical heartbeat is available through an authenticated WebSocket.
- Desktop and mobile systems are optional authorized nodes; no desktop is required for canonical state survival.
- Hybrid Link remains a bounded node/IO mechanism, not the owner of canonical state.
- Cloud backups are generated independently of the desktop runtime.
- Cloudflare Worker remains an optional edge adapter and is not required for the provider-neutral OMEGA Cloud runtime.

## Full cloud verification

OMEGA Cloud Full Verification run: `33343790941`

PASS:
- Python compile and complete Genesis test suite
- browser and edge JavaScript syntax
- committed canonical release manifest
- exact manifest regeneration
- OCI/Docker image build
- Docker Compose topology
- authenticated canonical cloud boot
- proof and journal replay verification
- authenticated WebSocket canonical heartbeat
- persistent-volume application restart with unchanged canonical digest
- cloud backup creation
- deterministic release rebuilt twice byte-identically
- artifact publication

Cloud release:
- manifest-governed source files: 85
- packaged files including manifest/checksum ledger: 87
- release SHA-256: `a07e236816c9d80915524223f10aafce713222ff64ecb816bb20023b6fddfa80`
- manifest SHA-256: `885a4324b7c9cd74ca05407792e67caaa010dddc084f0c7c918c77af12f64334`
- checksum ledger SHA-256: `3abc6c5ce8c817223c104bb5b4dfa114e8865e0fb1bf2da1e7f4faf91ef72df0`

## Clean branch verification

Final branch-only verification trigger: actual `omega-genesis-v1-full` tree, with the temporary CI pull request closed and its base branch reset to `main`.

## Internet hosting boundary

The own-cloud runtime is fully implemented and boot-tested. A permanent public Internet URL still requires authorization to a real external cloud account/VM or an authenticated AppDeploy connection. No public URL is fabricated in this record.

The previous Cloudflare deployment path remains separately blocked when `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` are absent; that does not prevent the provider-neutral OMEGA Cloud stack from operating on another authorized cloud host.
