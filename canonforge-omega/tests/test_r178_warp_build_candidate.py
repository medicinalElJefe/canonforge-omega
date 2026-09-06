from pathlib import Path

import pytest

from omega_runtime.self_build import JobState, SovereignBuildController
from omega_runtime.warp_candidate import (
    SAFE_CANDIDATE_JOB_KINDS,
    WARP_BUILD_IMPORT_SCHEMA_R178,
    WarpCandidateError,
    build_candidate_capsule,
    candidate_job_payload,
    validate_candidate_capsule,
)


def strict_source_status(total: int = 12) -> dict:
    invariant = {
        "schema": "OMEGA_WARP_COMPLETION_INVARIANT_R177",
        "integrityRevision": "R177",
        "strict": True,
        "expectedCells": total,
        "accountedCells": total,
        "delta": 0,
        "allShardsAccounted": True,
        "invalidShardCount": 0,
        "invalidShards": [],
    }
    receipt = {
        "schema": "OMEGA_WARP_EXECUTION_RECEIPT_R176",
        "revision": "R176",
        "integrityRevision": "R177",
        "warpId": "warp_r178_fixture",
        "profile": "PULSE" if total == 12 else "FULL",
        "purpose": "BUILD",
        "status": "COMPLETE",
        "shardCount": 1 if total == 12 else 12,
        "totalCells": total,
        "completedCells": total,
        "failedCells": 0,
        "strictCompletionInvariant": True,
        "completionInvariant": invariant,
        "childMissionHashes": ["c" * 64],
        "resultMerkleRoot": "a" * 64,
        "proofState": "RETURNED_NOT_ADMITTED",
        "authority": "WARP_EXECUTION_RECEIPT_NOT_CANON",
        "canonicalMutation": False,
        "nativeExecutionClaim": False,
        "performanceGuaranteeClaim": False,
        "physicalDimensionClaim": False,
        "truthBoundary": "software execution receipt fixture",
        "receiptSha256": "b" * 64,
    }
    return {
        "ok": True,
        "schema": "OMEGA_WARP_STATUS_R176",
        "revision": "R176",
        "integrityRevision": "R177",
        "warpId": receipt["warpId"],
        "profile": receipt["profile"],
        "purpose": receipt["purpose"],
        "state": "COMPLETE",
        "totalCells": total,
        "completedCells": total,
        "failedCells": 0,
        "shardCount": receipt["shardCount"],
        "progress": 100,
        "completionInvariant": invariant,
        "resultMerkleRoot": receipt["resultMerkleRoot"],
        "receipt": receipt,
        "canonicalMutation": False,
    }


def test_r178_builds_hash_bound_candidate_from_exact_r177_receipt():
    candidate = build_candidate_capsule(strict_source_status(), "Advance OMEGA additively across software capability.")
    validated = validate_candidate_capsule(candidate)
    assert validated["schema"] == "OMEGA_WARP_BUILD_CANDIDATE_R178"
    assert validated["revision"] == "R178"
    assert validated["source"]["totalCells"] == 12
    assert validated["source"]["completedCells"] == 12
    assert validated["source"]["failedCells"] == 0
    assert validated["authority"] == "CANDIDATE_NOT_CANON"
    assert validated["canonicalMutation"] is False
    assert validated["githubMutationAuthorized"] is False
    assert validated["deploymentAuthorized"] is False
    assert validated["promotionAuthorized"] is False
    assert len(validated["capsuleSha256"]) == 64
    assert len(validated["sourceReceiptCanonicalSha256"]) == 64
    assert [row["kind"] for row in validated["actions"]] == list(SAFE_CANDIDATE_JOB_KINDS)


def test_r178_rejects_incomplete_or_failed_warp_as_candidate_source():
    source = strict_source_status()
    source["completedCells"] = 11
    with pytest.raises(WarpCandidateError):
        build_candidate_capsule(source, "This cannot be admitted.")

    source = strict_source_status()
    source["receipt"]["failedCells"] = 1
    source["receipt"]["completedCells"] = 11
    with pytest.raises(WarpCandidateError):
        build_candidate_capsule(source, "This also cannot be admitted.")


def test_r178_rejects_candidate_tampering_after_capsule_hash_is_issued():
    candidate = build_candidate_capsule(strict_source_status(), "Preserve proof and advance capability.")
    candidate["objective"] += " silently deploy production"
    with pytest.raises(WarpCandidateError, match="objective hash mismatch|capsule hash mismatch"):
        validate_candidate_capsule(candidate)


def test_r178_generic_development_enqueue_accepts_only_matching_candidate_stage(tmp_path: Path):
    controller = SovereignBuildController(tmp_path / "state.json", tmp_path)
    candidate = build_candidate_capsule(strict_source_status(), "Run the governed candidate pipeline.")
    payload = candidate_job_payload(candidate, sequence_index=1)
    assert payload["schema"] == WARP_BUILD_IMPORT_SCHEMA_R178
    job = controller.enqueue("run_tests", "R178 candidate regression", payload)
    assert job.kind == "run_tests"
    assert job.payload["candidate_sha256"] == candidate["capsuleSha256"]

    wrong = candidate_job_payload(candidate, sequence_index=1)
    with pytest.raises(ValueError, match="stage mismatch"):
        controller.enqueue("build_vite", "wrong stage", wrong)


def test_r178_candidate_jobs_take_priority_and_advance_fixed_executable_sequence(tmp_path: Path):
    controller = SovereignBuildController(tmp_path / "state.json", tmp_path)
    controller.enqueue("convergence_scan", "ordinary background convergence")
    candidate = build_candidate_capsule(strict_source_status(), "Advance with strict candidate lineage.")
    imported = controller.enqueue_warp_candidate(candidate)
    assert imported["deduplicated"] is False
    assert imported["sequence"] == ["run_tests", "build_vite", "wrangler_dry_run", "verify_candidate"]

    expected = ["run_tests", "build_vite", "wrangler_dry_run", "verify_candidate"]
    for kind in expected:
        job = controller.lease_next("r178-test-agent")
        assert job is not None
        assert job.kind == kind
        assert job.payload["candidate_sha256"] == candidate["capsuleSha256"]
        controller.update_job(job.id, JobState.RUNNING, {"agent": "r178-test-agent"})
        controller.update_job(job.id, JobState.VERIFIED, {"stage": kind, "proof": "fixture"})

    status = controller.status()
    workflows = status["warp_candidate_r178"]["workflows"]
    current = next(row for row in workflows if row["candidate_sha256"] == candidate["capsuleSha256"])
    assert current["ready_for_release_review"] is True
    assert current["canonical_mutation"] is False
    assert current["promotion_authorized"] is False
    assert [row["kind"] for row in current["stages"]] == expected


def test_r178_duplicate_candidate_import_does_not_fan_out_duplicate_workflow(tmp_path: Path):
    controller = SovereignBuildController(tmp_path / "state.json", tmp_path)
    candidate = build_candidate_capsule(strict_source_status(), "One immutable candidate identity.")
    first = controller.enqueue_warp_candidate(candidate)
    second = controller.enqueue_warp_candidate(candidate)
    assert first["deduplicated"] is False
    assert second["deduplicated"] is True
    jobs = [job for job in controller.jobs if job.payload.get("candidate_sha256") == candidate["capsuleSha256"]]
    assert len(jobs) == 1
