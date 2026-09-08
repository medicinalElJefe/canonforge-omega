# OMEGA Repair System Ledger

This ledger is additive to `OMEGA_V6_ADVANCEMENT_LEDGER.md`. It records repairs at the invariant/process level so an incident fix cannot disappear as a one-off patch. A repair is not complete merely because this file contains an entry.

## Contract

Every repair must record the incident, permanent invariant, canonical implementation path, legacy migration/delegation, regression tests, CI proof, authority boundary, release admission state, exact source identity, and unresolved qualification. `CANDIDATE` does not mean deployed or live.

Archive, plugin, mode, evidence and package inheritance is additionally governed by `config/system_inheritance_contract.json`. Donor material is input to reconstruction, not authority by filename, age or size. A mode is not implemented merely because presentation changes. Plugin availability is not execution. Repair/package artifacts are not canonical source. Measured claims remain source-bound and derived fields remain labeled derived.

---

## R222-SINGLE-OWNER-HYBRID-REPAIR

**Date:** 2026-09-08 (America/Phoenix)

**Status:** `CANDIDATE`

**Canonical base when PR #252 was opened:** `4d4f14954f739d33a99a8015efe5b13249447912`

**Current canonical reconciled into candidate:** R221 `6a4c4f3f8a3f951f3780411e9b2d2d7f75c1550d`

**R221 → R222 reconciliation PR:** https://github.com/medicinalElJefe/canonforge-omega/pull/255

**Two-parent reconciliation commit:** `a43ea0f610d8912131ed3a8e9bd24d50a03641b3`

**Candidate branch:** `r222-hybrid-bootstrap-single-instance-repair`

**Candidate head before this ledger update:** `7d7fbdfee67fe0f21051662291548fa3a07cef0a`

**Main PR:** https://github.com/medicinalElJefe/canonforge-omega/pull/252

**Public runtime under governed repair:** https://omegav6.jeffdeweyeljefe.workers.dev/

### Incident

Physical R220/R222 work proved native `grcwa` could run, but Hybrid bootstrap/source contracts and older Windows entrypoints could diverge. Historical launchers could own their own localhost runtime/agent chain, making a successful repair non-reproducible and allowing RCWA or later capabilities to appear to require another OMEGA session.

The first system-level R222 CI pass then exposed a second-order process defect: predecessor R206/R207/R220 checks encoded implementation details directly in historical launchers. Once those launchers were correctly converted to delegates, those tests attempted to force the obsolete duplicated topology back into existence. That is a repair-system defect, not a reason to recreate parallel owners.

After R221 was merged to canonical, R222 was explicitly reconciled onto that newer canonical parent instead of being promoted from a stale base. The reconciled full-suite failures then exposed a third defect: R208/R209 truth scripts were still present and correct, but the first stable-gateway refactor had removed their invocation from the launch chain. That was a real functional regression. It was repaired in the stable gateway rather than hidden by weakening the tests.

### Permanent system invariant

For one approved root there is exactly one canonical localhost runtime on `127.0.0.1:8127`, one sovereign outbound agent, one authenticated Hybrid session and one bounded local execution-authority lease. RCWA, SAI, training, test, build and validation work dispatch through that existing agent. Capability actions do not bootstrap a second runtime. Historical user-facing launch/install names delegate into the stable `START_OMEGA_SOVEREIGN` gateway or fail closed.

Successor proof law is part of the invariant: historical R173/R206/R207/R208/R209/R220 gates follow stable/current contracts and verify preserved semantics rather than requiring obsolete implementation copies. Runtime ownership deduplication must preserve additive proof/acceptance surfaces.

The inheritance law is now also explicit: archives and donor builds require expansion/diff/conflict routing before reuse; package/repair layers cannot become source authority; dependency repair requires a fresh import/probe; plugins progress through discovered/authorized/available/invoked/returned/verified states; and a mode requires declared operational inputs/operator/outputs/evidence/authority/failure behavior rather than cosmetic-only changes.

### System implementation

- `config/repair_system_contract.json` makes the repair lifecycle and predecessor-inheritance rule machine-readable.
- `config/system_inheritance_contract.json` classifies canonical source, proof evidence, archive donors, package/repair artifacts, external data and plugin providers and defines their admissible authority.
- `scripts/START_OMEGA_SOVEREIGN.ps1` and `.cmd` are stable system entrypoints.
- `scripts/START_OMEGA_R222_FULL_HYBRID.ps1` remains the current release implementation behind the stable gateway.
- `scripts/LAUNCH_OMEGA_V6_WINDOWS.ps1`, `START_OMEGA_R220_FULL_HYBRID.cmd`, `START_OMEGA_R222_FULL_HYBRID.cmd`, and the Windows installer are compatibility/dependency surfaces rather than independent runtime owners.
- The stable gateway now invokes `PROVE_OMEGA_V6_R209_WINDOWS.ps1` after successful runtime/link startup unless acceptance proof is explicitly skipped. R209 remains additive to R208 and R210 retention and runs against the existing single-owner runtime.
- R175 independent RCWA validation continues to queue `cross_runtime_validate` through `/api/development/enqueue`; it does not invoke any launcher.
- R221 controller-owned local training → native RCWA → next-stage continuity is preserved in the reconciled lineage.
- Cloud Hybrid remains bound to the established `OMEGA_RUNTIME` Durable Object identity and outbound PC polling model.
- R173 now tests its cross-runtime execution/proof semantics without pinning a later sovereign agent to the obsolete R179 runtime-version label.
- R206/R207/R208/R209 tests resolve the stable gateway/current implementation before checking port ownership, root binding, heartbeat truth, verified venv use, proof wiring and startup continuity.
- The R220 downloadable workflow proves that the historical R220 name delegates into the stable single-owner repair system while native `grcwa` remains mandatory. Authenticated host execution/return/next-stage proof stays in the cumulative post-Hybrid Windows workflow instead of being faked by a second launcher implementation.
- The earlier R222 Worker strict-TypeScript defect at `omegaRuntimeR222.ts` was corrected by explicitly typing the allow-list filter parameter; this changed no allowed kind, authority boundary or runtime semantics.
- `.github/workflows/omega-v6-repair-system-contract.yml` now executes the repair contract, system inheritance contract and R173/R206/R207/R208/R209/R222 successor matrix together.

### Archive / plugin / mode corpus review incorporated

The wider archive review was used as donor evidence, not blindly promoted into runtime authority. Relevant recovered artifacts include the OMEGA 61.9B build charts, the One-System full-software menu ledger, the Atlas/motion workbooks, historical source manifests, and the Now-Anchor/Mode188 engineering workbook. Across those donors, recurring engineering requirements were consistent enough to encode as process invariants:

- one field / one packet / one continuity law;
- one stable entrypoint;
- EvidenceGate behavior that forbids fabricated terrain/LiDAR-style measured claims;
- dependency repair followed by import/probe verification;
- patch chains with rollback/fail-closed proof;
- proof ledgers as evidence, not runtime authority;
- modes that perform their declared transformation/operation rather than merely changing colors;
- archive donors and nested/meta archives requiring validation before admission.

These archive-derived rules are now represented in `OMEGA_SYSTEM_INHERITANCE_CONTRACT_V1`; the individual donor workbooks remain donors unless separately reconciled and proven.

### Failure evidence retained

The failed head `7dd22ec944d8400a57c89135c610ec4b1aec8ba6` remains part of the repair history:

- Repair-system contract gate **passed**: https://github.com/medicinalElJefe/canonforge-omega/actions/runs/34190743056
- R220 post-Hybrid run was overall red because strict TypeScript failed, while its real Windows post-link execution job was green: https://github.com/medicinalElJefe/canonforge-omega/actions/runs/34190743001
- Exact TypeScript failure was `src/omegaRuntimeR222.ts(376,91): TS7006 Parameter 'kind' implicitly has an 'any' type`; the Python portion of that source/package job had already passed 14 tests.
- R207 Windows proof installed and proved native `grcwa`, then failed seven stale R206/R207 assertions that expected ownership logic to remain duplicated inside `LAUNCH_OMEGA_V6_WINDOWS.ps1`: https://github.com/medicinalElJefe/canonforge-omega/actions/runs/34190743023
- R220 downloadable proof installed and proved native `grcwa`, entered the new R222 single-owner path, then failed because the old workflow had pre-staged an obsolete local topology and received a truthful 404 at the new signed-enrollment stage: https://github.com/medicinalElJefe/canonforge-omega/actions/runs/34190743038

The reconciled exact head `a43ea0f610d8912131ed3a8e9bd24d50a03641b3` then produced a mixed but useful matrix:

**Green:**
- repair-system contract: https://github.com/medicinalElJefe/canonforge-omega/actions/runs/34191651732
- R204 live verified-return: https://github.com/medicinalElJefe/canonforge-omega/actions/runs/34191651731
- R190 whole-system capability truth: https://github.com/medicinalElJefe/canonforge-omega/actions/runs/34191651650
- R216 surface binding integrity: https://github.com/medicinalElJefe/canonforge-omega/actions/runs/34191651695
- R220 post-Hybrid development continuity: https://github.com/medicinalElJefe/canonforge-omega/actions/runs/34191651648
- R221 governed training/native-RCWA continuity: https://github.com/medicinalElJefe/canonforge-omega/actions/runs/34191651678
- R220 downloadable Hybrid setup: https://github.com/medicinalElJefe/canonforge-omega/actions/runs/34191651770

**Red and retained:**
- R180 full non-regression suite: https://github.com/medicinalElJefe/canonforge-omega/actions/runs/34191651773
- R208 source/boundary proof: https://github.com/medicinalElJefe/canonforge-omega/actions/runs/34191651895
- R209 source/boundary proof: https://github.com/medicinalElJefe/canonforge-omega/actions/runs/34191651831
- general verify: https://github.com/medicinalElJefe/canonforge-omega/actions/runs/34191651878
- R204 verified-return source proof: https://github.com/medicinalElJefe/canonforge-omega/actions/runs/34191651826
- release-forward exact-head production: https://github.com/medicinalElJefe/canonforge-omega/actions/runs/34191651651
- R207 Windows loopback proof: https://github.com/medicinalElJefe/canonforge-omega/actions/runs/34191651684

The R180/general-suite failures reduced to three successor assertions: stale R173 runtime-version pinning, obsolete R208 launcher ownership assumptions, and missing R209 wiring in the first stable gateway. The first two were migrated to successor-safe semantics. The third exposed real lost functionality and was restored at the stable gateway. These failures are not erased or reclassified as success.

### Regression and process proof

- `tests/test_cross_runtime_parity_r173.py`
- `tests/test_r206_sovereign_windows_boot_continuity.py`
- `tests/test_r207_windows_verified_venv_launch.py`
- `tests/test_r208_physical_sovereign_acceptance.py`
- `tests/test_r209_sovereign_convergence_diagnostics.py`
- `tests/test_r222_hybrid_bootstrap_single_instance.py`
- `tests/test_repair_system_contract.py`
- `tests/test_system_inheritance_contract.py`
- `.github/workflows/omega-v6-repair-system-contract.yml`
- `.github/workflows/omega-v6-r207-windows-sovereign-proof.yml`
- `.github/workflows/omega-v6-r220-downloadable-hybrid-setup-proof.yml`
- `.github/workflows/omega-v6-r220-post-hybrid-development-continuity.yml`

### Authority boundary

This repair does not grant Canon mutation, GitHub mutation, deployment or promotion authority. Link proof remains distinct from execution authority. Physical-PC proof remains distinct from hosted Windows CI. R208/R209 diagnostic execution does not create acceptance; only their actual truth receipts can report it. Archive donors, plugins, modes, repair/package artifacts and proof evidence remain in their declared source classes. Production admission remains owned by the exact-head release-forward controller and cumulative R211/R205/R204/R181/R201/R185 truth gates.

### Admission boundary

R222 remains `CANDIDATE` until the final repair/inheritance-system head is source/TypeScript/Windows/RCWA/Hybrid/verified-return verified, reconciled against the then-current canonical head, governed-merged, deployed by release-forward as the exact canonical SHA, and accepted live without a production-writer replacement or rollback. The physical PC must then demonstrate one launch, one runtime, one agent, current authenticated heartbeat, local execution authority, same-session RCWA return, continued development, preserved R208/R209 proof surfaces, and no second console/runtime ownership.

---

## R222-CI-DEPENDENCY-AND-SEMANTIC-REGRESSION-REPAIR

**Date:** 2026-09-08 (America/Phoenix)

**Status:** `CANDIDATE`

**Candidate head before durable registration:** `7d7fbdfee67fe0f21051662291548fa3a07cef0a`

**Semantic ownership-test repair commit:** `dc627da718fdc3e7b72a2482fc72ed3294e947b2`

**Repair-contract registration commit:** `7b478ce4c8ba063bad12846abe1c3a774073266a`

**Process-enforcement test commit:** `7d7fbdfee67fe0f21051662291548fa3a07cef0a`

**Main PR:** https://github.com/medicinalElJefe/canonforge-omega/pull/252

### Incident

Two repair-process defects were exposed by the cumulative R222 matrix. First, jobs described as full-system/full-runtime regression initially installed only a narrow test environment and then attempted to import the actual runtime; that made missing declared runtime dependencies look like product regressions. The workflows were corrected to install OMEGA's declared editable development/runtime dependency set before the full suite.

Second, after the actual successor route behavior was correct, one R222 regression still asserted the literal prose fragment `does not replace the app`. The implementation docstring wrapped that sentence across a newline, so R180, general verify, R204 source proof, repair-system proof and release-forward candidate validation all became red even though `api/runtime_r222.py` imported the existing `api.app.app`, created no new FastAPI application, and moved only the named catch-all `ui` mount behind the newly added successor API routes.

### Permanent system invariant

A workflow may claim full-system or full-runtime regression only after installing OMEGA's declared runtime/development dependencies. Successor regressions must assert executable behavior, ownership, authority, schemas or other stable contracts. Comments, prose formatting, release labels, visual wording and obsolete implementation text cannot be the sole proof of a runtime invariant.

For R222 specifically, local successor routing proof now requires that `runtime_r222.py` imports the existing `app` from `api.app`, does not instantiate `FastAPI`, defines the successor enrollment/contract routes, identifies only the named `ui` `Mount`, and reorders that mount using the existing router. R207 Windows integration remains the executable reachability proof.

### Implementation and enforcement

- `.github/workflows/omega-v6-r180-convergence-gate.yml` installs `.[dev]` before its focused and full regression suites.
- `.github/workflows/omega-v6-repair-system-contract.yml` installs `.[dev]` before the repair/successor matrix.
- `tests/test_r222_hybrid_bootstrap_single_instance.py` now proves app ownership and route-order semantics and explicitly rejects creation of a second `FastAPI` app.
- `config/repair_system_contract.json` now requires `full_system_ci_must_install_declared_runtime_dependencies` and `successor_regressions_must_assert_behavioral_or_ownership_semantics_not_prose_or_formatting`.
- `tests/test_repair_system_contract.py` mechanically enforces both policies, the two workflow dependency contracts and the semantic R222 regression form.

### Failure evidence retained

The exact head `c67dd970ce0944aac09c31b6144ce190faa7882d` demonstrated the shared brittle-regression failure after the actual runtime/dependency work had otherwise progressed:

- repair-system contract red: https://github.com/medicinalElJefe/canonforge-omega/actions/runs/34260223350
- R180 full non-regression red: https://github.com/medicinalElJefe/canonforge-omega/actions/runs/34260223334
- general verify red: https://github.com/medicinalElJefe/canonforge-omega/actions/runs/34260223384
- R204 verified-return source proof red: https://github.com/medicinalElJefe/canonforge-omega/actions/runs/34260223501
- release-forward candidate validation red: https://github.com/medicinalElJefe/canonforge-omega/actions/runs/34260223406

The inspected R180, general verify and R204 source logs all converged on the same failed assertion: the source behavior/ownership checks passed, but the test additionally required the literal documentation substring `does not replace the app`. These runs remain failure evidence and are not rewritten as successful proof.

### Authority boundary

This repair changes CI correctness and regression-proof quality only. It grants no Canon mutation, GitHub mutation, physical-PC identity, local execution lease, solver execution proof, deployment authority, production ownership or live admission. A green source matrix remains a candidate proof until governed merge and exact-head live acceptance complete.

### Admission boundary

This repair remains `CANDIDATE` until the final ledger-bearing R222 head passes the repair-system gate, full inherited suite, R180, R204 source proof, Windows/RCWA/Hybrid gates and the complete candidate matrix. Even then it is not `ADMITTED/LIVE` until R222 is reconciled with the current canonical head, governed-merged, deployed by the exact-head release-forward controller and accepted by the applicable live truth/provenance gates.
