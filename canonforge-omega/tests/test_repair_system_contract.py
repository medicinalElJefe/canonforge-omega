import json
from pathlib import Path


PROJECT = Path(__file__).resolve().parents[1]
REPO = PROJECT.parent
CONTRACT = PROJECT / "config" / "repair_system_contract.json"


def _resolve(path: str) -> Path:
    return (REPO if path.startswith(".github/") else PROJECT) / path


def _text(path: str) -> str:
    return _resolve(path).read_text(encoding="utf-8")


def _ledger_status(text: str, repair_id: str) -> str:
    marker = f"## {repair_id}"
    assert marker in text, f"missing repair ledger section {repair_id}"
    section = text.split(marker, 1)[1]
    for line in section.splitlines():
        if line.startswith("**Status:**"):
            return line.strip()
    raise AssertionError(f"missing Status field in repair ledger section {repair_id}")


def test_repair_contract_is_governed_and_complete():
    data = json.loads(CONTRACT.read_text(encoding="utf-8"))
    assert data["schema"] == "OMEGA_REPAIR_SYSTEM_CONTRACT_V1"
    assert data["system_inheritance_contract"] == "config/system_inheritance_contract.json"
    assert _resolve(data["system_inheritance_contract"]).exists()
    policy = data["policy"]
    assert policy["required_stages"] == [
        "incident",
        "invariant",
        "implementation",
        "regression",
        "ci_proof",
        "release_admission",
        "ledger",
    ]
    for key in (
        "source_merge_is_not_live_admission",
        "failure_must_remain_visible",
        "legacy_entrypoints_must_delegate_or_fail_closed",
        "capability_actions_must_not_bootstrap_parallel_runtimes",
        "successor_proofs_follow_canonical_ownership_instead_of_requiring_duplicated_legacy_implementations",
        "proof_surfaces_must_follow_stable_entrypoint",
        "archive_donors_require_validation_before_admission",
        "repair_packaging_is_not_source_authority",
        "dependency_repair_requires_post_repair_probe",
        "full_system_ci_must_install_declared_runtime_dependencies",
        "successor_regressions_must_assert_behavioral_or_ownership_semantics_not_prose_or_formatting",
        "mode_changes_require_operational_semantics_not_cosmetic_only",
        "measured_claims_require_source_bound_evidence",
    ):
        assert policy[key] is True, key

    repairs = data["repairs"]
    assert repairs, "at least one governed repair must be registered"
    ids = [row["id"] for row in repairs]
    assert len(ids) == len(set(ids)), "repair ids must be unique"
    assert "R222-SINGLE-OWNER-HYBRID-REPAIR" in ids
    assert "R222-CI-DEPENDENCY-AND-SEMANTIC-REGRESSION-REPAIR" in ids
    for repair in repairs:
        for field in (
            "incident",
            "invariant",
            "implementation_paths",
            "regression_tests",
            "proof_workflows",
            "authority_boundary",
            "release_admission",
            "ledger",
            "advancement_ledger",
        ):
            assert repair.get(field), f"{repair['id']} missing {field}"
        assert "legacy_entrypoints" in repair, f"{repair['id']} missing legacy_entrypoints declaration"
        paths = (
            repair["implementation_paths"]
            + repair["legacy_entrypoints"]
            + repair["regression_tests"]
            + repair["proof_workflows"]
            + [repair["ledger"], repair["advancement_ledger"]]
        )
        for path in paths:
            assert _resolve(path).exists(), f"{repair['id']} references missing path {path}"


def test_full_system_ci_uses_declared_dependencies_and_successor_tests_are_semantic():
    r180 = _text(".github/workflows/omega-v6-r180-convergence-gate.yml")
    repair_workflow = _text(".github/workflows/omega-v6-repair-system-contract.yml")
    r222_regression = _text("tests/test_r222_hybrid_bootstrap_single_instance.py")

    assert "python -m pip install -e '.[dev]'" in r180
    assert "python -m pip install --disable-pip-version-check -e '.[dev]'" in repair_workflow

    assert 'assert "from api.app import APPROVED_BUILD_ROOT, GATEWAY_TOKEN, _pairing, app" in local' in r222_regression
    assert 'assert "FastAPI(" not in local' in r222_regression
    assert 'assert "app = FastAPI" not in local' in r222_regression
    assert 'assert "does not replace the app" in local' not in r222_regression
    assert "app.router.routes.remove(route)" in r222_regression
    assert "app.router.routes.append(route)" in r222_regression


def test_stable_gateway_owns_all_general_windows_launch_paths():
    contract = json.loads(CONTRACT.read_text(encoding="utf-8"))
    entry = contract["canonical_entrypoints"]
    assert entry["windows_powershell"] == "scripts/START_OMEGA_SOVEREIGN.ps1"
    assert entry["windows_cmd"] == "scripts/START_OMEGA_SOVEREIGN.cmd"
    assert entry["localhost_port"] == 8127
    assert entry["durable_singleton"] == "OMEGA_RUNTIME"

    stable_ps1 = _text(entry["windows_powershell"])
    stable_cmd = _text(entry["windows_cmd"])
    assert "START_OMEGA_R222_FULL_HYBRID.ps1" in stable_ps1
    assert "START_OMEGA_SOVEREIGN.ps1" in stable_cmd

    # Historical user-facing launch names must be compatibility delegates, not
    # independent process owners.
    legacy_launcher = _text("scripts/LAUNCH_OMEGA_V6_WINDOWS.ps1")
    r220 = _text("scripts/START_OMEGA_R220_FULL_HYBRID.cmd")
    r222_cmd = _text("scripts/START_OMEGA_R222_FULL_HYBRID.cmd")
    installer = _text("scripts/INSTALL_OMEGA_V6_WINDOWS.ps1")
    assert "START_OMEGA_SOVEREIGN.ps1" in legacy_launcher
    assert "START_OMEGA_SOVEREIGN.cmd" in r220
    assert "START_OMEGA_SOVEREIGN.cmd" in r222_cmd
    assert "START_OMEGA_SOVEREIGN.ps1" in installer

    forbidden_direct_owner_tokens = (
        "omega_runtime.cli",
        "omega_sovereign_agent.py",
        'start "OMEGA Sovereign Agent"',
    )
    for name, source in (("legacy launcher", legacy_launcher), ("R220 launcher", r220), ("R222 command wrapper", r222_cmd)):
        for token in forbidden_direct_owner_tokens:
            assert token not in source, f"{name} still owns a parallel process through {token}"


def test_stable_gateway_preserves_acceptance_proof_after_ownership_deduplication():
    gateway = _text("scripts/START_OMEGA_SOVEREIGN.ps1")
    assert "PROVE_OMEGA_V6_R209_WINDOWS.ps1" in gateway
    assert "r209_sovereign_convergence_latest.json" in gateway
    assert "R209 is additive to R208" in gateway
    assert "existing single-owner runtime" in gateway
    assert "-MaxAttempts 12 -DelaySeconds 5" in gateway
    assert "no success claim promoted" in gateway
    # The gateway orchestrates the current implementation and proof surfaces but does
    # not become a second local runtime or sovereign agent owner.
    assert "omega_runtime.cli" not in gateway
    assert "omega_sovereign_agent.py" not in gateway


def test_rcwa_is_a_capability_dispatch_not_a_launcher():
    lab = _text("cloudflare/omega-v6-worker/src/validation/independentSolverLabR175.ts")
    assert "/api/development/enqueue" in lab
    assert "kind:'cross_runtime_validate'" in lab
    for forbidden in (
        "/api/hybrid/launcher",
        "START_OMEGA_",
        "LAUNCH_OMEGA_",
        "Start-Process",
        "omega_runtime.cli",
        "omega_sovereign_agent.py",
    ):
        assert forbidden not in lab, f"RCWA validation surface must not bootstrap runtime ownership: {forbidden}"


def test_r222_single_owner_implementation_remains_truth_gated():
    source = _text("scripts/START_OMEGA_R222_FULL_HYBRID.ps1")
    for required in (
        "OMEGA_R222_FULL_HYBRID_SINGLE_INSTANCE",
        "WaitOne(0",
        "127.0.0.1",
        "$Port = 8127",
        "Stop-OwnedAgents",
        "/api/hybrid/enrollment",
        "/api/hybrid/authority/grant",
        "DEVELOPMENT_LOOP",
        "duplicateLauncherStarted = $false",
        "canonicalMutation = $false",
        "deploymentAuthorized = $false",
        "promotionAuthorized = $false",
    ):
        assert required in source


def test_public_bootstrap_cannot_bypass_single_owner_chain():
    control = _text("cloudflare/omega-v6-worker/src/hybridControlPlaneR222.ts")
    assert 'path === "/api/hybrid/launcher"' in control
    assert "START_OMEGA_R222_FULL_HYBRID.cmd" in control
    # The release wrapper is itself a mandatory delegate to the stable gateway.
    assert "SOVEREIGN_ORIGIN" not in control
    assert 'const CANONICAL_SINGLETON = "OMEGA_RUNTIME"' in control


def test_repair_is_durably_ledgered_without_false_live_admission():
    contract = json.loads(CONTRACT.read_text(encoding="utf-8"))
    repair = next(row for row in contract["repairs"] if row["id"] == "R222-SINGLE-OWNER-HYBRID-REPAIR")
    process_repair = next(row for row in contract["repairs"] if row["id"] == "R222-CI-DEPENDENCY-AND-SEMANTIC-REGRESSION-REPAIR")
    repair_ledger = _text(repair["ledger"])
    advancement_ledger = _text(repair["advancement_ledger"])
    assert "R222-SINGLE-OWNER-HYBRID-REPAIR" in repair_ledger
    assert "R222-CI-DEPENDENCY-AND-SEMANTIC-REGRESSION-REPAIR" in repair_ledger
    assert "Permanent system invariant" in repair_ledger
    assert process_repair["status"] == "CANDIDATE"
    assert _ledger_status(repair_ledger, repair["id"]) == "**Status:** `CANDIDATE`"
    assert _ledger_status(repair_ledger, process_repair["id"]) == "**Status:** `CANDIDATE`"
    assert "release completion is incomplete until this ledger and the user-facing completion report" in advancement_ledger
