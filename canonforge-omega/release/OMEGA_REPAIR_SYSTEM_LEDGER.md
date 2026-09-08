# OMEGA Repair System Ledger

This ledger is additive to `OMEGA_V6_ADVANCEMENT_LEDGER.md`. It records repairs at the invariant/process level so an incident fix cannot disappear as a one-off patch. A repair is not complete merely because this file contains an entry.

## Contract

Every repair must record the incident, permanent invariant, canonical implementation path, legacy migration/delegation, regression tests, CI proof, authority boundary, release admission state, exact source identity, and unresolved qualification. `CANDIDATE` does not mean deployed or live.

---

## R222-SINGLE-OWNER-HYBRID-REPAIR

**Date:** 2026-09-07 (America/Phoenix)

**Status:** `CANDIDATE`

**Canonical base when PR #252 was opened:** `4d4f14954f739d33a99a8015efe5b13249447912`

**Candidate branch:** `r222-hybrid-bootstrap-single-instance-repair`

**Candidate head at repair-system registration:** `b0ed9471082491a3df3caf06bfe08c8d37040cab`

**Repair-system CI head that exposed successor compatibility defects:** `7dd22ec944d8400a57c89135c610ec4b1aec8ba6`

**Successor-migration implementation head before this ledger update:** `95c559ad142d6b777af3eca8327a3250e20a062d`

**PR:** https://github.com/medicinalElJefe/canonforge-omega/pull/252

**Public runtime under governed repair:** https://omegav6.jeffdeweyeljefe.workers.dev/

### Incident

Physical R220/R222 work proved native `grcwa` could run, but Hybrid bootstrap/source contracts and older Windows entrypoints could diverge. Historical launchers could own their own localhost runtime/agent chain, making a successful repair non-reproducible and allowing RCWA or later capabilities to appear to require another OMEGA session.

The first system-level R222 CI pass then exposed a second-order process defect: predecessor R206/R207/R220 checks encoded implementation details directly in historical launchers. Once those launchers were correctly converted to delegates, those tests attempted to force the obsolete duplicated topology back into existence. That is now treated as a repair-system defect, not a reason to recreate parallel owners.

### Permanent system invariant

For one approved root there is exactly one canonical localhost runtime on `127.0.0.1:8127`, one sovereign outbound agent, one authenticated Hybrid session and one bounded local execution-authority lease. RCWA, SAI, test, build and validation work dispatch through that existing agent. Capability actions do not bootstrap a second runtime. Historical user-facing launch/install names delegate into the stable `START_OMEGA_SOVEREIGN` gateway or fail closed.

Successor proof law is now part of the invariant: historical R206/R207/R220 gates follow the stable ownership gateway to the current implementation and verify preserved behavior there. They may not require duplicated legacy implementation merely to satisfy an old string assertion.

### System implementation

- `config/repair_system_contract.json` makes the repair lifecycle and predecessor-inheritance rule machine-readable.
- `scripts/START_OMEGA_SOVEREIGN.ps1` and `.cmd` are stable system entrypoints.
- `scripts/START_OMEGA_R222_FULL_HYBRID.ps1` remains the current release implementation behind the stable gateway.
- `scripts/LAUNCH_OMEGA_V6_WINDOWS.ps1`, `START_OMEGA_R220_FULL_HYBRID.cmd`, `START_OMEGA_R222_FULL_HYBRID.cmd`, and the Windows installer are compatibility/dependency surfaces rather than independent runtime owners.
- R175 independent RCWA validation continues to queue `cross_runtime_validate` through `/api/development/enqueue`; it does not invoke any launcher.
- Cloud Hybrid remains bound to the established `OMEGA_RUNTIME` Durable Object identity and outbound PC polling model.
- R206/R207 regression tests now resolve the stable gateway/current implementation before checking port ownership, root binding, heartbeat truth, verified venv use and startup continuity.
- The historical R220 downloadable workflow now proves that the R220 name delegates into the stable single-owner repair system while native `grcwa` remains mandatory. Authenticated host execution/return/next-stage proof stays in the cumulative post-Hybrid Windows workflow instead of being faked by a second launcher implementation.
- The R222 Worker strict-TypeScript defect at `omegaRuntimeR222.ts` was corrected by explicitly typing the allow-list filter parameter; this changes no allowed kind, authority boundary or runtime semantics.

### Failure evidence retained

The failed head `7dd22ec944d8400a57c89135c610ec4b1aec8ba6` remains part of the repair history:

- Repair-system contract gate **passed**: https://github.com/medicinalElJefe/canonforge-omega/actions/runs/34190743056
- R220 post-Hybrid run was overall red because strict TypeScript failed, while its real Windows post-link execution job was green: https://github.com/medicinalElJefe/canonforge-omega/actions/runs/34190743001
- Exact TypeScript failure was `src/omegaRuntimeR222.ts(376,91): TS7006 Parameter 'kind' implicitly has an 'any' type`; the Python portion of that source/package job had already passed 14 tests.
- R207 Windows proof installed and proved native `grcwa`, then failed seven stale R206/R207 assertions that expected ownership logic to remain duplicated inside `LAUNCH_OMEGA_V6_WINDOWS.ps1`: https://github.com/medicinalElJefe/canonforge-omega/actions/runs/34190743023
- R220 downloadable proof installed and proved native `grcwa`, entered the new R222 single-owner path, then failed because the old workflow had pre-staged an obsolete local topology and received a truthful 404 at the new signed-enrollment stage: https://github.com/medicinalElJefe/canonforge-omega/actions/runs/34190743038

These failures are not erased or reclassified as success. The system was changed so the repaired architecture is what future proofs exercise.

### Regression and process proof

- `tests/test_r206_sovereign_windows_boot_continuity.py`
- `tests/test_r207_windows_verified_venv_launch.py`
- `tests/test_r222_hybrid_bootstrap_single_instance.py`
- `tests/test_repair_system_contract.py`
- `.github/workflows/omega-v6-repair-system-contract.yml`
- `.github/workflows/omega-v6-r207-windows-sovereign-proof.yml`
- `.github/workflows/omega-v6-r220-downloadable-hybrid-setup-proof.yml`
- `.github/workflows/omega-v6-r220-post-hybrid-development-continuity.yml`

### Authority boundary

This repair does not grant Canon mutation, GitHub mutation, deployment or promotion authority. Link proof remains distinct from execution authority. Physical-PC proof remains distinct from hosted Windows CI. Production admission remains owned by the exact-head release-forward controller and cumulative R211/R205/R204/R181/R201/R185 truth gates.

### Admission boundary

R222 remains `CANDIDATE` until the final repair-system head is source/TypeScript/Windows/RCWA/Hybrid verified, reconciled against the then-current canonical head, governed-merged, deployed by release-forward as the exact canonical SHA, and accepted live without a production-writer replacement or rollback. The physical PC must then demonstrate one launch, one runtime, one agent, current authenticated heartbeat, local execution authority, same-session RCWA return, continued development, and no second console/runtime ownership.
