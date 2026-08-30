# Acceptance gates

OMEGA Genesis maps the authoritative workbook's 12 gates into executable or deploy-time checks.

| Gate | Requirement | Current repository implementation |
|---|---|---|
| Install/package root | Deterministic install/runtime path | `OMEGA_DATA` for state + reproducible `scripts/build_release.py` package + Windows venv installer |
| Health endpoint | Runtime must answer | `/api/health` |
| Canonical identity | No shadow state | One `OmegaRuntime` state owner + digest |
| 188 admission | Invalid transitions rejected and logged | `mode188_gate` + `OmegaRuntime.propose` |
| Replay drift | Proof/state history reproducible | Append-only canonical state journal + parent/sequence/digest verification + proof→state cross-check + restart recovery |
| Render truth | Every frame references state identity | `projection.project()` digest + fingerprint |
| Menu coverage | Capabilities map to menus | 18 capabilities mapped across 12 surfaces |
| Host evidence labels | Claims carry source class | `EvidenceClass` + adapter boundary rules |
| Excel roundtrip | Workbook/control bridge checksum | `.xlsx/.xlsm` semantic fingerprint before/after save; formulas/types/number formats/merged ranges retained |
| Package checksum | Release files verified | Manifest regeneration + SHA256SUMS + verifier + reproducible ZIP builder |
| Panel layout | Primary field never covered | responsive fixed workspace + mobile drawer |
| Donor quarantine | No unclassified donor merged | corpus classifier defaults to `QUARANTINE` |

A repository test PASS means the code-level contracts pass. The Windows installer script is present but is not claimed as validated on a Windows host until run there. GPU acceleration, external observation services, remote PC screen/control and a permanent cloud deployment are separate target-specific gates and are not implied by a core PASS.
