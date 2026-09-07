from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
SRC = WORKER / "src"
ALIAS204 = (SRC / "convergenceRuntimeAliasR204.ts").read_text(encoding="utf-8")
ENTRY169 = (SRC / "runtimeEntryR169.ts").read_text(encoding="utf-8")
HEARTBEAT = (SRC / "heartbeatTruth.ts").read_text(encoding="utf-8")
RUNTIME204 = (SRC / "omegaRuntimeR204.ts").read_text(encoding="utf-8")
RUNTIME_BASE = (SRC / "omegaRuntime.ts").read_text(encoding="utf-8")
R201 = (SRC / "system" / "omegaRuntimeR201.ts").read_text(encoding="utf-8")
R202 = (SRC / "system" / "continuityPotentialR202.ts").read_text(encoding="utf-8")
R203_ROUTE = (SRC / "system" / "hybridMissionRouteR203.ts").read_text(encoding="utf-8")
R203_LEDGER = (SRC / "system" / "hybridMissionLedgerR203.ts").read_text(encoding="utf-8")
WRANGLER = (WORKER / "wrangler.toml").read_text(encoding="utf-8")
CONTRACT_CHECK = ROOT / "scripts" / "check_cloudflare_contract.py"


def load_contract_check():
    spec = importlib.util.spec_from_file_location("omega_r204_contract_check_test", CONTRACT_CHECK)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_r204_preserves_canonical_r169_entrypoint_and_upgrades_only_convergence_export_alias():
    assert 'main = "src/runtimeEntryR169.ts"' in WRANGLER
    assert '[alias]' in WRANGLER
    assert '"./convergence" = "./src/convergenceRuntimeAliasR204.ts"' in WRANGLER
    assert 'import convergence, { OmegaRuntime } from "./convergence"' in HEARTBEAT
    assert 'export { OmegaRuntime } from "./heartbeatTruth"' in ENTRY169
    assert 'import convergence from "./system/../convergence"' in ALIAS204
    assert 'export { OmegaRuntime } from "./omegaRuntimeR204"' in ALIAS204
    assert 'return convergence.fetch(request, env, ctx)' in ALIAS204
    assert 'handleHybridMissionR203' in ENTRY169
    assert 'handleContinuityPotentialR202' in ENTRY169
    assert 'OMEGA_HYBRID_MISSION_CONTINUITY_MANIFEST_R203' in R203_ROUTE
    assert 'OMEGA_UNIFIED_CONTINUITY_POTENTIAL_R202' in R202


def test_r204_preserves_all_existing_durable_namespaces_and_storage_identities():
    assert 'HYBRID_RETURN_ADMISSION_R204_ID = "r204-verified-hybrid-return-admission"' in WRANGLER
    for binding, cls in (
        ("OMEGA_RUNTIME", "OmegaRuntime"),
        ("OMEGA_MISSION_LEDGER_R201", "OmegaMissionLedgerR201"),
        ("OMEGA_HYBRID_MISSION_LEDGER_R203", "OmegaHybridMissionLedgerR203"),
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
    assert WRANGLER.count('name = "OMEGA_HYBRID_MISSION_LEDGER_R203"') == 1
    assert "[[migrations]]" not in WRANGLER
    assert "new_sqlite_classes" not in WRANGLER
    assert 'state = "deleted"' not in WRANGLER
    assert 'DURABLE_EVIDENCE_HISTORY_NOT_HOSTSTATE_NOT_CANONSTATE' in R201
    assert 'R201_ANCHORED_R202_AWARE_HYBRID_CORRELATION_NOT_HOSTSTATE_NOT_CANONSTATE' in R203_ROUTE
    assert 'OmegaHybridMissionLedgerR203' in R203_LEDGER


def test_r204_replaces_only_the_active_agent_result_completion_shortcut():
    assert 'import { OmegaRuntime as BaseOmegaRuntime } from "./omegaRuntime"' in RUNTIME204
    assert 'export class OmegaRuntime extends BaseOmegaRuntime' in RUNTIME204
    assert 'typeof body.ok !== "boolean"' in RUNTIME204
    assert 'successful return requires proof for every queued step' in RUNTIME204
    assert 'proof id mismatch' in RUNTIME204
    assert 'proof operation mismatch' in RUNTIME204
    assert 'failed proof cannot support successful return' in RUNTIME204
    assert 'OMEGA_SERVER_RETURN_ADMISSION_CORE_R204' in RUNTIME204
    assert 'RETURN_VERIFIED_SUCCESS_R204' in RUNTIME204
    assert 'RETURN_VERIFIED_FAILURE_R204' in RUNTIME204
    assert 'RETURN_REJECTED_R204' in RUNTIME204
    assert 'const complete = finalStatus === "COMPLETE" && verification.verified === true;' in RUNTIME204
    assert 'const status = body.ok === false ? "FAILED" : "COMPLETE";' in RUNTIME_BASE
    assert 'const status = body.ok === false ? "FAILED" : "COMPLETE";' not in RUNTIME204


def test_r204_confines_outputs_binds_server_receipts_and_detects_replay_conflicts():
    combined = ALIAS204 + RUNTIME204
    for token in (
        'relativePath',
        'unsafe or non-string relative path',
        'SERVER_CANONICAL_SHA256_RECEIPT',
        'serverReceiptSha256',
        'RESULT_CONFLICT',
        'RETURN_VERIFICATION_FAILED',
        'HOST_HASH_BOUND_PLUS_SERVER_ADMISSION',
        'AUTHENTICATED_SERVER_HASH_BOUND_ADMISSION',
        'path.endsWith("/receipt")',
    ):
        assert token in combined
    receipt_section = RUNTIME204[RUNTIME204.index('if (path.startsWith("/jobs/")'):]
    assert 'this.authorized(request)' in receipt_section
    assert 'returnVerification' in receipt_section
    assert 'AUTHENTICATED_EXECUTION_RETURN_EVIDENCE_NOT_CANONSTATE' in receipt_section


def test_r204_does_not_overclaim_hardware_attestation_host_hash_or_canon_authority():
    assert 'hostFingerprintAloneIsAuthority: false' in RUNTIME204
    assert 'hostCryptographicAttestationClaimed: false' in RUNTIME204
    assert 'host canonical receipt SHA-256 mismatch' in RUNTIME204
    assert 'does not convert an authenticated software agent into hardware attestation' in RUNTIME204
    for token in (
        'authenticatedAgentIsNotHardwareAttestation: true',
        'hostHashAloneIsNotAuthority: true',
        'returnedIsNotVerified: true',
        'verifiedReturnIsNotCanonState: true',
        'verifiedReturnIsNotPromotion: true',
        'verifiedFailureDoesNotCompleteMission: true',
        'canonicalMutation: false',
        'hostStateMutation: false',
        'promotionAuthorized: false',
    ):
        assert token in ALIAS204


def test_r204_manifest_preserves_r203_mission_continuity_and_r201_evidence_chain():
    assert '/api/system/r204/manifest' in ALIAS204
    assert 'OMEGA_VERIFIED_HYBRID_RETURN_MANIFEST_R204' in ALIAS204
    assert 'R203_AUTHENTICATED_HYBRID_MISSION_CONTINUITY' in ALIAS204
    assert 'r201EvidenceLedgerPreserved: true' in ALIAS204
    assert 'r203HybridMissionLedgerPreserved: true' in ALIAS204
    assert 'storageIdentityChanged: false' in ALIAS204
    assert 'newDurableNamespaceCreated: false' in ALIAS204
    assert 'canonicalEntrypoint: "src/runtimeEntryR169.ts"' in ALIAS204
    assert 'underlyingConvergencePreserved: true' in ALIAS204


def test_r203_sync_will_observe_and_hash_r204_return_packet_without_becoming_verifier():
    assert 'mission?.lastProof' in R203_ROUTE
    assert 'hostProofHash' in R203_ROUTE
    assert 'R203_HOST_RETURN_PACKET_SHA256_RECORDED_NOT_PHYSICAL_VERIFICATION' in R203_ROUTE
    assert 'blindRetryQueued: false' in R203_ROUTE
    assert 'hostProofIntegrityClass' in R203_ROUTE
    assert 'hostProofLaw' in R203_ROUTE


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


def test_release_lineage_guard_does_not_block_pr_or_local_validation(monkeypatch):
    module = load_contract_check()
    monkeypatch.setenv("GITHUB_ACTIONS", "true")
    monkeypatch.setenv("GITHUB_EVENT_NAME", "pull_request")
    monkeypatch.setenv("GITHUB_REF", "refs/pull/999/merge")
    result = module.release_lineage_guard()
    assert result["ok"] is True
    assert result["enforced"] is False
