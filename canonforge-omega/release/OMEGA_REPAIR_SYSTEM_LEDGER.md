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

**PR:** https://github.com/medicinalElJefe/canonforge-omega/pull/252

**Public runtime under governed repair:** https://omegav6.jeffdeweyeljefe.workers.dev/

### Incident

Physical R220/R222 work proved native `grcwa` could run, but Hybrid bootstrap/source contracts and older Windows entrypoints could diverge. Historical launchers could own their own localhost runtime/agent chain, making a successful repair non-reproducible and allowing RCWA or later capabilities to appear to require another OMEGA session.

### Permanent system invariant

For one approved root there is exactly one canonical localhost runtime on `127.0.0.1:8127`, one sovereign outbound agent, one authenticated Hybrid session and one bounded local execution-authority lease. RCWA, SAI, test, build and validation work dispatch through that existing agent. Capability actions do not bootstrap a second runtime. Historical user-facing launch/install names delegate into the stable `START_OMEGA_SOVEREIGN` gateway or fail closed.

### System implementation

- `config/repair_system_contract.json` makes the repair lifecycle machine-readable.
- `scripts/START_OMEGA_SOVEREIGN.ps1` and `.cmd` are stable system entrypoints.
- `scripts/START_OMEGA_R222_FULL_HYBRID.ps1` remains the current release implementation behind the stable gateway.
- `scripts/LAUNCH_OMEGA_V6_WINDOWS.ps1`, `START_OMEGA_R220_FULL_HYBRID.cmd`, `START_OMEGA_R222_FULL_HYBRID.cmd`, and the Windows installer are compatibility/dependency surfaces rather than independent runtime owners.
- R175 independent RCWA validation continues to queue `cross_runtime_validate` through `/api/development/enqueue`; it does not invoke any launcher.
- Cloud Hybrid remains bound to the established `OMEGA_RUNTIME` Durable Object identity and outbound PC polling model.

### Regression and process proof

- `tests/test_r222_hybrid_bootstrap_single_instance.py`
- `tests/test_repair_system_contract.py`
- `.github/workflows/omega-v6-repair-system-contract.yml` (added with this repair-system conversion)
- existing R220/R222 Windows and post-Hybrid continuity workflows remain cumulative proof inputs.

### Authority boundary

This repair does not grant Canon mutation, GitHub mutation, deployment or promotion authority. Link proof remains distinct from execution authority. Physical-PC proof remains distinct from hosted Windows CI. Production admission remains owned by the exact-head release-forward controller and cumulative R211/R205/R204/R181/R201/R185 truth gates.

### Admission boundary

R222 remains `CANDIDATE` until the final repair-system head is source/TypeScript/Windows/RCWA/Hybrid verified, reconciled against the then-current canonical head, governed-merged, deployed by release-forward as the exact canonical SHA, and accepted live without a production-writer replacement or rollback. The physical PC must then demonstrate one launch, one runtime, one agent, current authenticated heartbeat, local execution authority, same-session RCWA return, continued development, and no second console/runtime ownership.
