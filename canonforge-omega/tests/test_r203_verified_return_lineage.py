from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
SRC = WORKER / "src"
ENTRY203 = (SRC / "runtimeEntryR203.ts").read_text(encoding="utf-8")
ENTRY169 = (SRC / "runtimeEntryR169.ts").read_text(encoding="utf-8")
RUNTIME203 = (SRC / "omegaRuntimeR203.ts").read_text(encoding="utf-8")
RUNTIME_BASE = (SRC / "omegaRuntime.ts").read_text(encoding="utf-8")
R201 = (SRC / "system" / "omegaRuntimeR201.ts").read_text(encoding="utf-8")
R202 = (SRC / "system" / "continuityPotentialR202.ts").read_text(encoding="utf-8")
WRANGLER = (WORKER / "wrangler.toml").read_text(encoding="utf-8")
CONTRACT_CHECK = ROOT / "scripts" / "check_cloudflare_contract.py"


def load_contract_check():
    spec = importlib.util.spec_from_file_location("omega_r203_contract_check_test", CONTRACT_CHECK)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_r203_is_additive_wrapper_over_complete_r169_to_r202_stack():
    assert 'main = "src/runtimeEntryR203.ts"' in WRANGLER
    assert 'import runtime from "./runtimeEntryR169"' in ENTRY203
    assert 'return runtime.fetch(request, env, ctx)' in ENTRY203
    assert 'export { OmegaRuntime } from "./omegaRuntimeR203"' in ENTRY203
    assert 'handleContinuityPotentialR202' in ENTRY169
    assert 'OMEGA_UNIFIED_CONTINUITY_POTENTIAL_R202' in R202
    assert 'export { OmegaMissionLedgerR201 } from "./system/omegaRuntimeR201"' in ENTRY203
    for export in (
        "OmegaSwarmCell",
        "OmegaSwarmCoordinator",
        "OmegaSwarmBranch",
        "OmegaSwarmOrgan",
        "OmegaSwarmOrganismCoordinator",
        "OmegaSwarmAutonomicCoordinator",
    ):
        assert export in ENTRY203


def test_r203_preserves_every_durable_namespace_and_storage_identity():
    assert 'HYBRID_RETURN_ADMISSION_R203_ID = "r203-verified-hybrid-return-admission"' in WRANGLER
    for binding, cls in (
        ("OMEGA_RUNTIME", "OmegaRuntime"),
        ("OMEGA_MISSION_LEDGER_R201", "OmegaMissionLedgerR201"),
        ("OMEGA_SWARM_CELL", "OmegaSwarmCell"),
        ("OMEGA_SWARM_COORDINATOR", "OmegaSwarmCoordinator"),
        ("OMEGA_SWARM_BRANCH", "OmegaSwarmBranch"),
        ("OMEGA_SWARM_ORGAN", "OmegaSwarmOrgan"),
        ("OMEGA_SWARM_ORGANISM", "OmegaSwarmOrganismCoordinator"),
        ("OMEGA_SWARM_AUTONOMIC", "OmegaSwarmAutonomicCoordinator"),
    ):
        assert f'name = "{binding}"' in WRANGLER
        assert f'class_name = "{cls}"' in WRANGLER
        assert f'[exports.{cls}]' in WRANGLER
    assert WRANGLER.count('name = "OMEGA_RUNTIME"') == 1
    assert WRANGLER.count('name = "OMEGA_MISSION_LEDGER_R201"') == 1
    assert "[[migrations]]" not in WRANGLER
    assert "new_sqlite_classes" not in WRANGLER
    assert 'state = "deleted"' not in WRANGLER
    assert 'DURABLE_EVIDENCE_HISTORY_NOT_HOSTSTATE_NOT_CANONSTATE' in R201


def test_r203_replaces_only_the_active_return_admission_shortcut():
    assert 'import { OmegaRuntime as BaseOmegaRuntime } from "./omegaRuntime"' in RUNTIME203
    assert 'export class OmegaRuntime extends BaseOmegaRuntime' in RUNTIME203
    assert 'typeof body.ok !== "boolean"' in RUNTIME203
    assert 'successful return requires proof for every queued step' in RUNTIME203
    assert 'proof id mismatch' in RUNTIME203
    assert 'proof operation mismatch' in RUNTIME203
    assert 'failed proof cannot support successful return' in RUNTIME203
    assert 'OMEGA_SERVER_RETURN_ADMISSION_CORE_R203' in RUNTIME203
    assert 'RETURN_VERIFIED_SUCCESS_R203' in RUNTIME203
    assert 'RETURN_REJECTED_R203' in RUNTIME203
    assert 'const complete = finalStatus === "COMPLETE" && verification.verified === true;' in RUNTIME203
    assert 'const status = body.ok === false ? "FAILED" : "COMPLETE";' in RUNTIME_BASE
    assert 'const status = body.ok === false ? "FAILED" : "COMPLETE";' not in RUNTIME203


def test_r203_confines_outputs_hashes_server_receipts_and_rejects_conflicting_replays():
    for token in [
        'relativePath',
        'unsafe or non-string relative path',
        'serverReceiptSha256',
        'RESULT_CONFLICT',
        'RETURN_VERIFICATION_FAILED',
        'HOST_HASH_BOUND_PLUS_SERVER_ADMISSION',
        'AUTHENTICATED_SERVER_HASH_BOUND_ADMISSION',
        'path.endsWith("/receipt")',
    ]:
        assert token in RUNTIME203
    receipt_section = RUNTIME203[RUNTIME203.index('if (path.startsWith("/jobs/")'):]
    assert 'this.authorized(request)' in receipt_section
    assert 'returnVerification' in receipt_section
    assert 'AUTHENTICATED_EXECUTION_RETURN_EVIDENCE_NOT_CANONSTATE' in receipt_section


def test_r203_does_not_overclaim_hardware_attestation_or_host_hash_authority():
    assert 'hostFingerprintAloneIsAuthority: false' in RUNTIME203
    assert 'hostCryptographicAttestationClaimed: false' in RUNTIME203
    assert 'host canonical receipt SHA-256 mismatch' in RUNTIME203
    assert 'does not convert an authenticated software agent into hardware attestation' in RUNTIME203
    assert 'verifiedReturnIsNotCanonState: true' in ENTRY203
    assert 'verifiedReturnIsNotPromotion: true' in ENTRY203
    assert 'canonicalMutation: false' in ENTRY203
    assert 'hostStateMutation: false' in ENTRY203
    assert 'promotionAuthorized: false' in ENTRY203


def test_r203_manifest_explicitly_preserves_r201_and_r202():
    assert '/api/system/r203/manifest' in ENTRY203
    assert 'OMEGA_VERIFIED_HYBRID_RETURN_MANIFEST_R203' in ENTRY203
    assert 'r201EvidenceLedgerPreserved: true' in ENTRY203
    assert 'r202ContinuityPotentialPreserved: true' in ENTRY203
    assert 'storageIdentityChanged: false' in ENTRY203
    assert 'newDurableNamespaceCreated: false' in ENTRY203
    assert 'R169_TO_R202_UNCHANGED' in ENTRY203


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
