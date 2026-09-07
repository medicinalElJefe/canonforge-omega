from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
SRC = WORKER / "src"
ENTRY = (SRC / "runtimeEntryR202.ts").read_text(encoding="utf-8")
RUNTIME = (SRC / "omegaRuntimeR202.ts").read_text(encoding="utf-8")
R201_RUNTIME = (SRC / "system" / "omegaRuntimeR201.ts").read_text(encoding="utf-8")
WRANGLER = (WORKER / "wrangler.toml").read_text(encoding="utf-8")
CONTRACT_CHECK = ROOT / "scripts" / "check_cloudflare_contract.py"


def load_contract_check():
    spec = importlib.util.spec_from_file_location("omega_r202_contract_check_test", CONTRACT_CHECK)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_r202_is_a_narrow_wrapper_over_the_current_r169_through_r201_public_stack():
    assert 'import currentRuntime from "./runtimeEntryR169"' in ENTRY
    assert 'export { OmegaRuntime } from "./omegaRuntimeR202"' in ENTRY
    assert 'export { OmegaRuntime as OmegaMissionLedgerR201 } from "./system/omegaRuntimeR201"' in ENTRY
    assert "current.fetch(request, env, ctx)" in ENTRY
    for export in (
        "OmegaSwarmCell",
        "OmegaSwarmCoordinator",
        "OmegaSwarmBranch",
        "OmegaSwarmOrgan",
        "OmegaSwarmOrganismCoordinator",
        "OmegaSwarmAutonomicCoordinator",
    ):
        assert export in ENTRY


def test_r202_preserves_r201_evidence_ledger_and_every_durable_namespace():
    assert 'main = "src/runtimeEntryR202.ts"' in WRANGLER
    assert 'DURABLE_MISSION_LEDGER_R201_ID = "r201-durable-mission-evidence-ledger"' in WRANGLER
    assert 'HYBRID_RETURN_ADMISSION_R202_ID = "r202-authenticated-return-admission"' in WRANGLER
    assert 'name = "OMEGA_MISSION_LEDGER_R201"' in WRANGLER
    assert 'class_name = "OmegaMissionLedgerR201"' in WRANGLER
    assert '[exports.OmegaMissionLedgerR201]' in WRANGLER
    assert 'DURABLE_EVIDENCE_HISTORY_NOT_HOSTSTATE_NOT_CANONSTATE' in R201_RUNTIME
    for binding in (
        "OMEGA_RUNTIME",
        "OMEGA_MISSION_LEDGER_R201",
        "OMEGA_SWARM_CELL",
        "OMEGA_SWARM_COORDINATOR",
        "OMEGA_SWARM_BRANCH",
        "OMEGA_SWARM_ORGAN",
        "OMEGA_SWARM_ORGANISM",
        "OMEGA_SWARM_AUTONOMIC",
    ):
        assert f'name = "{binding}"' in WRANGLER
    assert "[[migrations]]" not in WRANGLER
    assert "new_sqlite_classes" not in WRANGLER
    assert 'state = "deleted"' not in WRANGLER


def test_r202_removes_the_body_ok_completion_shortcut_from_the_active_runtime_export():
    assert 'import { OmegaRuntime as BaseOmegaRuntime } from "./omegaRuntime"' in RUNTIME
    assert "class OmegaRuntime extends BaseOmegaRuntime" in RUNTIME
    assert 'typeof body.ok !== "boolean"' in RUNTIME
    assert "successful return requires proof for every queued step" in RUNTIME
    assert "proof id mismatch" in RUNTIME
    assert "proof operation mismatch" in RUNTIME
    assert "failed proof cannot support successful return" in RUNTIME
    assert "serverReceiptSha256" in RUNTIME
    assert "OMEGA_SERVER_RETURN_ADMISSION_CORE_R202" in RUNTIME
    assert "RETURN_VERIFIED_SUCCESS_R202" in RUNTIME
    assert "RETURN_REJECTED_R202" in RUNTIME
    assert 'const complete = finalStatus === "COMPLETE" && verification.verified === true;' in RUNTIME
    assert 'const status = body.ok === false ? "FAILED" : "COMPLETE";' not in RUNTIME
    assert "resultFingerprint: text(body.resultFingerprint) ||" not in RUNTIME


def test_r202_does_not_overclaim_hardware_attestation_or_trust_a_host_hash_alone():
    assert "hostFingerprintAloneIsAuthority: false" in RUNTIME
    assert "hostCryptographicAttestationClaimed: false" in RUNTIME
    assert "host canonical receipt SHA-256 mismatch" in RUNTIME
    assert "HOST_HASH_BOUND_PLUS_SERVER_ADMISSION" in RUNTIME
    assert "AUTHENTICATED_SERVER_HASH_BOUND_ADMISSION" in RUNTIME
    assert "does not convert an authenticated software agent into hardware attestation" in RUNTIME


def test_r202_rejects_conflicting_replays_and_exposes_authenticated_receipts():
    assert "RESULT_CONFLICT" in RUNTIME
    assert "RETURN_VERIFICATION_FAILED" in RUNTIME
    assert 'path.endsWith("/receipt")' in RUNTIME
    receipt_section = RUNTIME[RUNTIME.index('if (path.startsWith("/jobs/")'):]
    assert "this.authorized(request)" in receipt_section
    assert "returnVerification" in receipt_section


def test_release_lineage_guard_accepts_only_two_parent_merge_over_exact_previous_head(monkeypatch, tmp_path: Path):
    module = load_contract_check()
    event = tmp_path / "event.json"
    event.write_text(json.dumps({"before": "base123"}), encoding="utf-8")
    monkeypatch.setenv("GITHUB_ACTIONS", "true")
    monkeypatch.setenv("GITHUB_EVENT_NAME", "push")
    monkeypatch.setenv("GITHUB_REF", "refs/heads/omega-v6-full-convergence")
    monkeypatch.setenv("GITHUB_SHA", "merge456")
    monkeypatch.setenv("GITHUB_EVENT_PATH", str(event))

    merge_object = "tree abc\nparent base123\nparent topic789\nauthor Test <test@example.com> 0 +0000\n\nmerge\n"
    monkeypatch.setattr(module.subprocess, "check_output", lambda *args, **kwargs: merge_object)
    good = module.release_lineage_guard()
    assert good["ok"] is True
    assert good["exactly_two_parents"] is True
    assert good["preserves_previous_head"] is True

    direct_object = "tree abc\nparent base123\nauthor Test <test@example.com> 0 +0000\n\ndirect\n"
    monkeypatch.setattr(module.subprocess, "check_output", lambda *args, **kwargs: direct_object)
    held = module.release_lineage_guard()
    assert held["ok"] is False
    assert held["status"] == "HOLD"


def test_release_lineage_guard_does_not_block_pull_request_validation(monkeypatch):
    module = load_contract_check()
    monkeypatch.setenv("GITHUB_ACTIONS", "true")
    monkeypatch.setenv("GITHUB_EVENT_NAME", "pull_request")
    monkeypatch.setenv("GITHUB_REF", "refs/pull/999/merge")
    result = module.release_lineage_guard()
    assert result["ok"] is True
    assert result["enforced"] is False
