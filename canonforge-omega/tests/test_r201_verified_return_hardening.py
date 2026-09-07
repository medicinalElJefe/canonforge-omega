from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
ENTRY = WORKER / "src" / "runtimeEntryR201.ts"
RUNTIME = WORKER / "src" / "omegaRuntimeR201.ts"
WRANGLER = WORKER / "wrangler.toml"
CONTRACT_CHECK = ROOT / "scripts" / "check_cloudflare_contract.py"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def load_contract_check():
    spec = importlib.util.spec_from_file_location("omega_r201_contract_check_test", CONTRACT_CHECK)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_r201_entry_is_additive_over_exact_existing_public_runtime():
    source = read(ENTRY)
    assert 'from "./runtimeEntryR169"' in source
    assert 'export { OmegaRuntime } from "./omegaRuntimeR201"' in source
    assert "current.fetch(request, env, ctx)" in source
    for export in (
        "OmegaSwarmCell",
        "OmegaSwarmCoordinator",
        "OmegaSwarmBranch",
        "OmegaSwarmOrgan",
        "OmegaSwarmOrganismCoordinator",
        "OmegaSwarmAutonomicCoordinator",
    ):
        assert export in source


def test_wrangler_activates_r201_without_replaying_or_deleting_durable_state():
    source = read(WRANGLER)
    assert 'main = "src/runtimeEntryR201.ts"' in source
    assert 'HYBRID_RETURN_ADMISSION_R201_ID = "r201-authenticated-full-step-server-hash-admission"' in source
    assert 'name = "OMEGA_RUNTIME"' in source
    assert 'class_name = "OmegaRuntime"' in source
    assert '[exports.OmegaRuntime]' in source
    assert 'storage = "sqlite"' in source
    assert "[[migrations]]" not in source
    assert "new_sqlite_classes" not in source
    assert 'state = "deleted"' not in source


def test_r201_removes_body_ok_shortcut_and_requires_full_success_lineage():
    source = read(RUNTIME)
    assert 'typeof body.ok !== "boolean"' in source
    assert "successful return requires proof for every queued step" in source
    assert "proof id mismatch" in source
    assert "proof operation mismatch" in source
    assert "failed proof cannot support successful return" in source
    assert "unsafeOutputPathsRejected: true" in source
    assert "serverReceiptSha256" in source
    assert "OMEGA_SERVER_RETURN_ADMISSION_CORE_R201" in source
    assert "OMEGA_RETURN_VERIFICATION_R201" in source
    assert "HOST_HASH_BOUND_PLUS_SERVER_ADMISSION" in source
    assert "AUTHENTICATED_SERVER_HASH_BOUND_ADMISSION" in source
    assert 'const complete = finalStatus === "COMPLETE" && verification.verified;' in source
    assert 'const status = body.ok === false ? "FAILED" : "COMPLETE";' not in source
    assert "resultFingerprint: text(body.resultFingerprint) ||" not in source


def test_r201_rejects_conflicting_returns_and_exposes_a_receipt_route():
    source = read(RUNTIME)
    for token in (
        "RESULT_CONFLICT",
        "RETURN_REJECTED",
        "RETURN_VERIFICATION_FAILED",
        "/receipt",
        "host canonical receipt SHA-256 mismatch",
        "serverReceiptSha256",
    ):
        assert token in source


def test_release_guard_accepts_only_two_parent_merge_over_exact_prior_head(monkeypatch, tmp_path: Path):
    module = load_contract_check()
    event = tmp_path / "event.json"
    event.write_text(json.dumps({"before": "base123"}), encoding="utf-8")
    monkeypatch.setenv("GITHUB_ACTIONS", "true")
    monkeypatch.setenv("GITHUB_EVENT_NAME", "push")
    monkeypatch.setenv("GITHUB_REF", "refs/heads/omega-v6-full-convergence")
    monkeypatch.setenv("GITHUB_SHA", "merge456")
    monkeypatch.setenv("GITHUB_EVENT_PATH", str(event))

    monkeypatch.setattr(module.subprocess, "check_output", lambda *args, **kwargs: "merge456 base123 topic789\n")
    good = module.release_lineage_guard()
    assert good["ok"] is True
    assert good["exactly_two_parents"] is True
    assert good["preserves_previous_head"] is True

    monkeypatch.setattr(module.subprocess, "check_output", lambda *args, **kwargs: "direct456 base123\n")
    held = module.release_lineage_guard()
    assert held["ok"] is False
    assert held["status"] == "HOLD"


def test_release_guard_does_not_block_pull_request_validation(monkeypatch):
    module = load_contract_check()
    monkeypatch.setenv("GITHUB_ACTIONS", "true")
    monkeypatch.setenv("GITHUB_EVENT_NAME", "pull_request")
    monkeypatch.setenv("GITHUB_REF", "refs/pull/999/merge")
    result = module.release_lineage_guard()
    assert result["ok"] is True
    assert result["enforced"] is False
