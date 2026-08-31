# OMEGA Genesis

## OMEGA Cloud is canonical

The primary Genesis deployment is an **always-on cloud host**. Canonical state, proof history, replay journal, web cockpit, API and live heartbeat persist in cloud storage and continue operating when no desktop or phone is connected. Desktop Hybrid Link is an optional compute/IO node, not the owner of canonical state.

The provider-neutral cloud stack is under `cloud/omega-cloud/`. It runs Genesis behind HTTPS with signed operator sessions, a persistent data volume, an authenticated WebSocket heartbeat and automatic backups. See `docs/CLOUD.md`.

OMEGA Genesis is a clean-generation rebuild of the OMEGA / CanonForge system around one enforceable rule:

> **ONE FIELD · ONE CANONICAL PACKET · ONE PROOF CHAIN · MANY MODES / VIEWS / ADAPTERS**

It preserves useful OMEGA concepts while removing the architectural failure mode that accumulated across older builds: duplicate state authorities, shadow controls, decorative render paths, ambiguous evidence classes, and donor code that could bypass governance.

## What is implemented

- **20,736-state reversible address lattice**: 12 domains × 12 phases × 12 regulation states × 12 knowledge lenses.
- **Canonical packet authority** with SHA-256 identity, parent linkage, an append-only state journal, restart recovery and an append-only proof ledger.
- **Mode 188** STAY / TURN / ESCALATE admissibility using the accepted compatibility ratio.
- **DEWEY-BAL** burden-compression regression contract, including the exact 11499 → `MODE188+` → 11687 acceptance path and HOLD-on-mismatch rule.
- **Relational Skin Calculus (RSC)** plus Deep Mother, High Father and Deep Thought computational lenses.
- **One phase transform** using shortest-arc interpolation; renderers consume it and do not re-phase it.
- **State-bound projection packet** with a deterministic projection fingerprint.
- **Frozen-prior forecast** carrying `future_observation_used=false`.
- **Earth traversal math** using WGS84 coordinates, mean Earth radius 6,371,008.8 m, π/36 heading quantization and `F(r)=πr⁴` scale mapping.
- **Bounded plugin runtime** with declared permissions/capabilities and explicit denial of `canonical.commit`, `evidence.promote`, `proof.rewrite`, arbitrary shell and arbitrary network authority.
- **Corpus classifier/indexer** using KEEP / MERGE / DONOR / QUARANTINE and content hashes.
- **Governed Hybrid Link executor** with approved-root containment, typed operations, bounded reads/writes, corpus indexing, release verification and deterministic run fingerprints; arbitrary shell execution is not part of the protocol.
- **12-surface responsive cockpit** derived from the authoritative one-system menu ledger, with each master surface independently navigable.
- **36-mode governed registry + all-mode orchestrator** so every registered lens evaluates the same immutable packet while mutation authority remains singular.
- **Live plugin registry + bounded execution API** for declared read/query/render/proposal capabilities.
- **18 capability contracts and 12 acceptance-gate definitions** recovered from the workbook design.
- **Excel semantic roundtrip adapter** for `.xlsx`/`.xlsm`, including formulas, cell types, number formats, merged ranges and semantic fingerprints.
- **Deterministic release manifest + reproducible ZIP builder** with SHA-256 verification.
- **Browser sonification, geodesic traversal and cockpit diagnostics** as state-bound derived interfaces.
- **OpenPyXL 3.1+** is the only required Python package beyond the standard library, used for the workbook bridge.

## Start the canonical cloud

For a prepared persistent Linux VM, the governed host bootstrap is now the preferred production path:

```bash
sudo git clone --branch omega-genesis-v1-full https://github.com/medicinalElJefe/canonforge-omega.git /opt/omega
cd /opt/omega
sudo python3 scripts/cloud_host_bootstrap.py --domain omega.example.com
```

It generates the cloud secrets, deploys the current governed immutable promotion, verifies live proof/replay/provenance on loopback, records host deployment state, and enables the continuous promotion/recovery watcher. See `docs/CLOUD_HOST_BOOTSTRAP.md`.

For development-only direct Compose startup:

```bash
python scripts/cloud_bootstrap.py --domain omega.example.com
cd cloud/omega-cloud
docker compose up -d --build
```

Point the selected domain to the cloud VM, open the HTTPS URL, and enter the generated operator token. Public DNS/TLS reachability remains a separate live acceptance gate; local bootstrap success alone does not claim public deployment.

## Start an optional local/node runtime


```bash
python -m omega_genesis.server
```

Open `http://127.0.0.1:8127`.

The local loopback interface is accepted automatically. Local operation is a node/development mode; cloud is the canonical always-on deployment. For non-loopback API ingress, set `OMEGA_GATEWAY_TOKEN` and pass the same value in `X-Omega-Gateway-Token`.

## Corpus indexing

Point the indexer at a local Google Drive for Desktop OMEGA subtree or any approved project copy:

```bash
python -m omega_genesis.corpus "J:/OMEGA" --out runtime-data/corpus.json
```

The indexer hashes files and classifies them. It does **not** execute unknown archives or donor code.

## Evidence model

`OBSERVED`, `IMPORTED`, `DERIVED`, `FORECAST`, `INFERRED`, `ASSUMED`, `SYMBOLIC`, and `USER_ASSERTED` are distinct. Modes and renderers can consume evidence but cannot silently promote it. External adapters must establish the provenance required for stronger evidence classes.

## Repository layout

```text
omega_genesis/
  schema.py          canonical packet and evidence model
  calculus.py        Mode 188, Dewey, RSC and motion math
  modes.py           36-mode governed stack and mutation policy
  runtime.py         sole canonical mutation authority
  proof.py           append-only hash-chain receipts
  journal.py         append-only canonical packet replay history
  orchestrator.py    all-mode evaluation against one packet
  release.py         manifest/tree hashing and verification
  projection.py      state-bound render packet
  forecast.py        frozen-prior forecast
  corpus.py          provenance-aware corpus classification/index
  plugins.py         bounded plugin SDK/runtime + capability leases
  adapters/
    earth.py         WGS84 / ground traversal math
    hybrid.py        governed Desktop/Hybrid Link validation + execution
    workbook.py      verified Excel semantic inspection/roundtrip
  server.py          local API + web application
web/                  responsive 12-surface operator cockpit
config/               resolver and source-governance contracts
tests/                executable regression/acceptance tests
docs/                 architecture, review, migration and acceptance
```

## Truth boundary

The 144 / 1,728 / 20,736 / 145,152 / 61,917,364,224 values are software representation or design-capacity spaces unless independent evidence establishes a physical interpretation. Render output is a view, not measurement authority. Forecasts remain forecasts. Missing real-world evidence produces HOLD / NO_EVIDENCE rather than synthetic substitution.


## Windows one-click host setup

Run `INSTALL_OMEGA_WINDOWS.bat`. It creates an isolated `.omega-venv`, installs the declared Python dependency, verifies the repository manifest, and launches Genesis. Python 3.11+ is required. The installer does not disable Windows security controls or execute arbitrary shell jobs through Hybrid Link.

To authorize Hybrid Link/workbook access outside the repository, set `OMEGA_HYBRID_ROOTS` to a semicolon-separated list of approved directories before launch. Non-loopback API ingress additionally requires `OMEGA_GATEWAY_TOKEN`.

## Release build

`python scripts/build_manifest.py` regenerates the file manifest and `SHA256SUMS.txt`. After verification, `python scripts/build_release.py` produces a reproducible release ZIP plus a separate `.sha256` file in `release/`.
