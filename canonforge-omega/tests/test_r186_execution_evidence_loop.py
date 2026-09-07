from pathlib import Path

from omega_runtime.successor_evidence_r186 import (
    CAPABILITY_FILES,
    EVIDENCE_RECEIPT_SCHEMA_R186,
    EVIDENCE_REVISION_R186,
    build_execution_evidence_r186,
    execution_metric_vector,
)
from omega_runtime.warp_candidate import build_candidate_capsule


ROOT = Path(__file__).resolve().parents[1]
TS = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "swarm" / "successorEvidenceR186.ts"
ENTRY = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "runtimeEntryR169.ts"
WORKFLOW = ROOT.parent / ".github" / "workflows" / "omega-v6-r185-live-172-cloud-proof.yml"
RELEASE = ROOT.parent / ".github" / "workflows" / "omega-v6-release-forward-production.yml"
VERIFIER = ROOT / "scripts" / "verify_r185_live_federation.py"
WRANGLER = ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml"


def r178_candidate():
    invariant = {
        "schema": "OMEGA_WARP_COMPLETION_INVARIANT_R177",
        "integrityRevision": "R177",
        "strict": True,
        "expectedCells": 12,
        "accountedCells": 12,
        "delta": 0,
        "allShardsAccounted": True,
        "invalidShardCount": 0,
        "invalidShards": [],
    }
    receipt = {
        "schema": "OMEGA_WARP_EXECUTION_RECEIPT_R176",
        "revision": "R176",
        "integrityRevision": "R177",
        "warpId": "r186-fixture-warp",
        "profile": "PULSE",
        "purpose": "BUILD",
        "status": "COMPLETE",
        "shardCount": 1,
        "totalCells": 12,
        "completedCells": 12,
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
        "truthBoundary": "R186 fixture",
        "receiptSha256": "b" * 64,
    }
    status = {
        "state": "COMPLETE",
        "integrityRevision": "R177",
        "warpId": receipt["warpId"],
        "profile": receipt["profile"],
        "purpose": receipt["purpose"],
        "totalCells": 12,
        "completedCells": 12,
        "failedCells": 0,
        "shardCount": 1,
        "resultMerkleRoot": receipt["resultMerkleRoot"],
        "receipt": receipt,
    }
    return build_candidate_capsule(status, "Advance OMEGA with execution-derived successor evidence.")


def test_r186_execution_metrics_are_derived_from_raw_results_not_supplied_scores():
    metrics = execution_metric_vector(
        test_result={"exit_code": 0, "elapsed_seconds": 2},
        typecheck_result={"exit_code": 0, "elapsed_seconds": 3},
        dry_run_result={"exit_code": 0, "elapsed_seconds": 4},
        verify_result={"passed": True},
        capabilities=list(CAPABILITY_FILES),
        changed_files=["cloudflare/omega-v6-worker/src/swarm/x.ts"],
        objective="Add a measured capability without regression.",
        connections={
            "canonicalEdge": True,
            "swarm": True,
            "genesisMachine": True,
            "opticalMachine": True,
            "sovereignHost": True,
            "sai": True,
        },
        clean_workspace=True,
    )
    assert metrics["correctness"] == 1.0
    assert metrics["regressionSafety"] == 1.0
    assert metrics["missionFit"] == 1.0
    assert metrics["proofCoverage"] == 1.0
    assert metrics["federationConnectivity"] == 1.0
    assert metrics["sovereignConnectivity"] == 1.0
    assert 0.0 < metrics["interactiveEfficiency"] < 1.0
    assert 0.0 < metrics["resourceEfficiency"] < 1.0


def test_r186_python_receipt_hash_binds_r183_r184_payload():
    candidate = r178_candidate()
    predecessor_metrics = {key: 0.8 for key in (
        "correctness", "regressionSafety", "missionFit", "proofCoverage", "capabilityCoverage",
        "interactiveEfficiency", "resourceEfficiency", "recoverability", "continuity",
        "federationConnectivity", "sovereignConnectivity",
    )}
    successor_metrics = dict(predecessor_metrics)
    successor_metrics["missionFit"] = 0.95
    stage_evidence = {
        "run_tests": {"exit_code": 0},
        "build_vite": {"exit_code": 0},
        "wrangler_dry_run": {"exit_code": 0},
        "verify_candidate": {"passed": True},
    }
    connections = {key: True for key in (
        "canonicalEdge", "swarm", "genesisMachine", "opticalMachine", "sovereignHost", "sai"
    )}
    receipt = build_execution_evidence_r186(
        candidate=candidate,
        predecessor_sha="a" * 40,
        predecessor_metrics=predecessor_metrics,
        predecessor_capabilities=["BASE"],
        successor_sha="b" * 40,
        successor_branch="feature/r186-test",
        successor_metrics=successor_metrics,
        successor_capabilities=["BASE", "R186"],
        stage_evidence=stage_evidence,
        connections=connections,
        connection_receipts={key: {"ok": True} for key in connections},
        changed_files=["x.py"],
        diff_text="+r186",
    )
    assert receipt["schema"] == EVIDENCE_RECEIPT_SCHEMA_R186
    assert receipt["revision"] == EVIDENCE_REVISION_R186
    assert len(receipt["receiptSha256"]) == 64
    payload = receipt["r183R184Payload"]
    assert payload["mission"]["exactBuildDevelopment"] is True
    assert payload["designOutput"]["canonicalMutation"] is False
    assert len(payload["designOutput"]["metricEvidence"]) == 11
    assert len(payload["designOutput"]["connectionEvidence"]) == 6


def test_r186_cloud_collector_probes_connections_and_feeds_r183_r184():
    source = TS.read_text(encoding="utf-8")
    assert "OMEGA_EXECUTION_DERIVED_SUCCESSOR_EVIDENCE_R186" in source
    assert "collectLiveConnectionsR186" in source
    assert 'callCanonical(request, env, ctx, canonicalFetch, "/api/hybrid/status")' in source
    assert 'callCanonical(request, env, ctx, canonicalFetch, "/api/sai/status")' in source
    assert "OMEGA_GENESIS_MACHINE" in source
    assert "OMEGA_OPTICAL_MACHINE" in source
    assert "omega-cloud-r185-001" in source
    assert "evaluateSuccessorR183" in source
    assert "discoverImprovementR184" in source
    assert "R186_EXECUTION_DERIVED" in source
    assert "callers cannot directly supply R183 metric scores" in source


def test_r186_route_is_first_class_and_identity_declared():
    entry = ENTRY.read_text(encoding="utf-8")
    wrangler = WRANGLER.read_text(encoding="utf-8")
    assert "handleSuccessorEvidenceR186" in entry
    assert 'url.pathname.startsWith("/api/swarm/evidence/r186/")' in entry
    assert 'SUCCESSOR_EVIDENCE_R186_ID = "r186-execution-derived-live-connection-successor-evidence"' in wrangler


def test_r186_exact_sha_172_link_proof_is_preserved_under_release_forward_sequence():
    workflow = WORKFLOW.read_text(encoding="utf-8")
    release = RELEASE.read_text(encoding="utf-8")
    verifier = VERIFIER.read_text(encoding="utf-8")
    assert 'workflows: ["OMEGA V6 release-forward exact-head production"]' in workflow
    assert "github.event.workflow_run.conclusion == 'success'" in workflow
    assert '--expected-sha "$EXPECTED_SHA"' in workflow
    assert "/api/acceptance/r181/manifest" in verifier
    assert "canonicalGitSha" in verifier
    assert "expected_sha" in verifier
    assert "NODE_COUNT = 172" in verifier
    assert "verify_r185_live_federation.py" in release
    assert '--expected-sha "$GITHUB_SHA"' in release
