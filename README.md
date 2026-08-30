# OMEGA Genesis

OMEGA Genesis is a clean-generation rebuild of the OMEGA / CanonForge system around one enforceable rule:

> **ONE FIELD · ONE CANONICAL PACKET · ONE PROOF CHAIN · MANY MODES / VIEWS / ADAPTERS**

It preserves useful OMEGA concepts while removing the architectural failure mode that accumulated across older builds: duplicate state authorities, shadow controls, decorative render paths, ambiguous evidence classes, and donor code that could bypass governance.

## What is implemented

- **20,736-state reversible address lattice**: 12 domains × 12 phases × 12 regulation states × 12 knowledge lenses.
- **Canonical packet authority** with SHA-256 identity, parent linkage and an append-only proof ledger.
- **Mode 188** STAY / TURN / ESCALATE admissibility using the accepted compatibility ratio.
- **DEWEY-BAL** burden-compression regression contract, including the exact 11499 → `MODE188+` → 11687 acceptance path and HOLD-on-mismatch rule.
- **Relational Skin Calculus (RSC)** plus Deep Mother, High Father and Deep Thought computational lenses.
- **One phase transform** using shortest-arc interpolation; renderers consume it and do not re-phase it.
- **State-bound projection packet** with a deterministic projection fingerprint.
- **Frozen-prior forecast** carrying `future_observation_used=false`.
- **Earth traversal math** using WGS84 coordinates, mean Earth radius 6,371,008.8 m, π/36 heading quantization and `F(r)=πr⁴` scale mapping.
- **Bounded plugin runtime** with declared permissions/capabilities and explicit denial of `canonical.commit`, `evidence.promote`, `proof.rewrite`, arbitrary shell and arbitrary network authority.
- **Corpus classifier/indexer** using KEEP / MERGE / DONOR / QUARANTINE and content hashes.
- **Governed Hybrid Link plan validator** with approved-root containment and typed operations only.
- **12-surface responsive cockpit** derived from the authoritative one-system menu ledger.
- **35-mode governed registry** so “all modes active” means all lenses are available while mutation authority remains singular.
- **Live plugin registry + bounded execution API** for declared read/query/render/proposal capabilities.
- **18 capability contracts and 12 acceptance-gate definitions** recovered from the workbook design.
- **Zero required third-party runtime dependencies** for the core local server.

## Start locally

```bash
python -m omega_genesis.server
```

Open `http://127.0.0.1:8127`.

The local loopback interface is accepted automatically. For non-loopback API ingress, set `OMEGA_GATEWAY_TOKEN` and pass the same value in `X-Omega-Gateway-Token`.

## Corpus indexing

Point the indexer at a local Google Drive for Desktop OMEGA subtree or any approved project copy:

```bash
python -m omega_genesis.corpus "J:/OMEGA" --out runtime-data/corpus.json
```

The indexer hashes files and classifies them. It does **not** execute unknown archives or donor code.

## Evidence model

`OBSERVED`, `IMPORTED`, `DERIVED`, `FORECAST`, `INFERRED`, `ASSUMED`, `SYMBOLIC`, and `USER_ASSERTED` are distinct. Modes and renderers can consume evidence but cannot silently promote it. External adapters must establish the provenance required for stronger evidence classes.

## Truth boundary

The 144 / 1,728 / 20,736 / 145,152 / 61,917,364,224 values are software representation or design-capacity spaces unless independent evidence establishes a physical interpretation. Render output is a view, not measurement authority. Forecasts remain forecasts. Missing real-world evidence produces HOLD / NO_EVIDENCE rather than synthetic substitution.
