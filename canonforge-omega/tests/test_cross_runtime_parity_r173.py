from __future__ import annotations

import json
from pathlib import Path

from omega_runtime.cross_runtime import (
    CROSS_RUNTIME_CHALLENGE_SCHEMA,
    atlas_reference_diffusion,
    native_reference_receipt,
    native_reference_result,
)
from omega_runtime.self_build import SAFE_JOB_KINDS, VALIDATION_SEQUENCE
from scripts.omega_sovereign_agent import cross_runtime_validate


ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
SRC = WORKER / "src"
FABRIC = SRC / "validation" / "crossRuntimeParityR173.ts"
LAB = SRC / "validation" / "crossRuntimeLabR173.ts"
ENTRY = SRC / "runtimeEntryR169.ts"
WRANGLER = WORKER / "wrangler.toml"
AGENT = ROOT / "scripts" / "omega_sovereign_agent.py"


def canonical(value: dict) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"))


def test_r173_native_reference_executes_same_model_families_with_receipts():
    cases = [
        ("/api/compute/relativity/event", {"t_seconds": 1.25, "position_m": [120000000, -25000000, 4000000], "frame_velocity_m_s": [40000000, -20000000, 10000000]}),
        ("/api/compute/relativity/velocity", {"object_velocity_m_s": [80000000, 20000000, -10000000], "frame_velocity_m_s": [30000000, -5000000, 1000000]}),
        ("/api/compute/optics/tmm", {"wavelength_nm": 550, "incident_n": 1, "substrate_n": 1.5, "layers": [{"n": 1.224744871391589, "k": 0, "thickness_nm": 112.26827987756235}]}),
        ("/api/compute/continuity/transfer", {"values": [4, 3, 2, 1], "transfers": [{"from": 0, "to": 1, "amount": 1.25}, {"from": 1, "to": 2, "amount": 0.5}, {"from": 2, "to": 3, "amount": 0.25}]}),
        ("/api/compute/continuity/diffusion", {"values": [1, 0, 0, 0], "edges": [[0, 1], [1, 2], [2, 3]], "diffusivity": 0.2, "dt": 0.5}),
        ("/api/compute/wave/fdtd1d", {"initial_displacement": [0, 0, 1, 0, 0], "wave_speed": 1, "dx": 1, "dt": 0.5, "steps": 20}),
    ]
    for path, payload in cases:
        result = native_reference_result(path, payload)
        assert isinstance(result, dict) and result
        receipt = native_reference_receipt(path, canonical(payload))
        assert receipt["schema"] == "OMEGA_NATIVE_REFERENCE_RECEIPT_R173"
        assert receipt["native_execution"] is True
        assert receipt["canonical_mutation"] is False
        assert receipt["independent_solver_family_claim"] is False
        assert len(receipt["input_sha256"]) == 64
        assert len(receipt["result_sha256"]) == 64
        assert len(receipt["receipt_sha256"]) == 64


def test_r173_native_atlas_matches_recovered_reference_topology_contract():
    result = atlas_reference_diffusion({"diffusivity": 0.1, "dt": 1, "steps": 1, "top_k": 4, "impulses": [[0, 1]]})
    assert result["nodes"] == 20_736
    assert result["undirected_edges"] == 72_576
    assert result["degree"] == 7
    assert result["invariant_absolute_residual"] < 1e-12
    assert result["canonical_mutation"] is False


def test_r173_job_kind_is_allowlisted_but_never_auto_queued_without_a_challenge():
    assert "cross_runtime_validate" in SAFE_JOB_KINDS
    assert "cross_runtime_validate" not in VALIDATION_SEQUENCE


def test_r173_agent_rejects_unbound_or_malformed_challenges(tmp_path: Path):
    bad = cross_runtime_validate({"payload": {}}, tmp_path)
    assert bad["blocked"] is True
    payload = {
        "schema": CROSS_RUNTIME_CHALLENGE_SCHEMA,
        "path": "/api/compute/relativity/event",
        "input_canonical_json": canonical({"t_seconds": 0, "position_m": [0, 0, 0], "frame_velocity_m_s": [0, 0, 0]}),
        "input_sha256": "0" * 64,
        "challenge_sha256": "1" * 64,
        "cloud_result_sha256": "2" * 64,
        "cloud_receipt_sha256": "3" * 64,
        "challenge_id": "fixture",
    }
    mismatch = cross_runtime_validate({"payload": payload}, tmp_path)
    assert mismatch["blocked"] is True
    assert "input hash" in mismatch["reason"]


def test_r173_cloud_fabric_reexecutes_cloud_and_reads_persisted_authenticated_job_evidence():
    source = FABRIC.read_text(encoding="utf-8")
    for marker in (
        "CROSS_RUNTIME_PARITY",
        "cross_runtime_validate",
        "/api/development/status",
        "/api/hybrid/status",
        "job.state === \"VERIFIED\"",
        "job.lease_owner === evidence.agent_id",
        "evidence.native_execution === true",
        "nativeReceipt.native_execution === true",
        "heartbeat_sequence",
        "cloudReexecutionBound",
        "compareNumeric",
        "CROSS_RUNTIME_VALIDATION_RECEIPT_NOT_CANON",
        "independentSolverFamilyClaim: false",
        "externalMeasurementClaim: false",
        "canonicalMutation: false",
    ):
        assert marker in source
    assert "caller-supplied native" not in source.lower()
    assert "12/144/1728/20736 remain software address/execution-resolution levels rather than physical dimensions" in source


def test_r173_operator_lab_and_runtime_mount_are_additive_and_atlas_route_is_repaired():
    lab = LAB.read_text(encoding="utf-8")
    entry = ENTRY.read_text(encoding="utf-8")
    wrangler = WRANGLER.read_text(encoding="utf-8")
    agent = AGENT.read_text(encoding="utf-8")
    assert "OMEGA · R173 · AUTHENTICATED CROSS-RUNTIME PARITY" in lab
    assert "PREPARE + QUEUE AUTHENTICATED PC PARITY" in lab
    assert "never treats a caller-supplied result as native proof" in lab
    assert 'url.pathname === "/validate/cross-runtime"' in entry
    assert 'url.pathname.startsWith("/api/validate/cross-runtime/")' in entry
    assert 'url.pathname.startsWith("/api/compute/atlas/")' in entry
    assert 'return canonical.fetch(request, env, ctx)' in entry
    assert 'CROSS_RUNTIME_VALIDATION_ID = "r173-authenticated-cloud-sovereign-pc-parity"' in wrangler
    assert "r173-cross-runtime-parity-agent" in agent
    assert '"cross_runtime_validate"' in agent
    assert "authenticated native execution" in agent.lower()
    assert "[[migrations]]" not in wrangler
