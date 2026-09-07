from __future__ import annotations

from typing import Any, Dict, Mapping

from .successor_gate import SUCCESSOR_METRIC_WEIGHTS_R183, evaluate_successor_r183
from .warp_candidate import canonical_sha256

IMPROVEMENT_REVISION_R184 = "R184"
IMPROVEMENT_SCHEMA_R184 = "OMEGA_IMPROVEMENT_DISCOVERY_R184"
DESIGN_OUTPUT_SCHEMA_R184 = "OMEGA_IMPROVEMENT_DESIGN_OUTPUT_R184"
RELEASE_INTENT_SCHEMA_R184 = "OMEGA_IMMEDIATE_RELEASE_INTENT_R184"
REQUIRED_CONNECTIONS_R184 = (
    "canonicalEdge",
    "swarm",
    "genesisMachine",
    "opticalMachine",
    "sovereignHost",
    "sai",
)


def _hash64(value: Any) -> bool:
    return isinstance(value, str) and len(value) == 64 and all(ch in "0123456789abcdef" for ch in value.lower())


def _git_sha(value: Any) -> bool:
    return isinstance(value, str) and len(value) in {40, 64} and all(ch in "0123456789abcdef" for ch in value.lower())


def _strings(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    out: list[str] = []
    for item in value:
        text = str(item or "").strip()
        if text and text not in out:
            out.append(text)
    return out


def validate_design_output_r184(payload: Mapping[str, Any], evaluation: Mapping[str, Any]) -> Dict[str, Any]:
    body = dict(payload or {})
    mission = dict(body.get("mission") or {})
    candidate = dict(body.get("candidate") or {})
    predecessor = dict(body.get("predecessor") or {})
    design = dict(body.get("designOutput") or {})
    blockers: list[str] = []
    expected_mission_sha = canonical_sha256(mission)

    if mission.get("exactBuildDevelopment") is not True:
        blockers.append("MISSION_NOT_EXACT_BUILD_DEVELOPMENT")
    if not str(mission.get("objective") or "").strip():
        blockers.append("MISSION_OBJECTIVE_REQUIRED")
    if design.get("schema") != DESIGN_OUTPUT_SCHEMA_R184:
        blockers.append("DESIGN_OUTPUT_SCHEMA_INVALID")
    if not _git_sha(design.get("sourceCommitSha")):
        blockers.append("DESIGN_SOURCE_COMMIT_SHA_INVALID")
    if not str(design.get("sourceBranch") or "").strip():
        blockers.append("DESIGN_SOURCE_BRANCH_REQUIRED")
    if design.get("sourceCommitSha") == predecessor.get("canonicalGitSha"):
        blockers.append("DESIGN_SOURCE_MUST_DIFFER_FROM_PREDECESSOR")
    if design.get("predecessorCanonicalGitSha") != predecessor.get("canonicalGitSha"):
        blockers.append("DESIGN_PREDECESSOR_SHA_MISMATCH")
    if design.get("candidateSha256") != candidate.get("capsuleSha256"):
        blockers.append("DESIGN_CANDIDATE_HASH_MISMATCH")
    if design.get("missionSha256") != expected_mission_sha:
        blockers.append("DESIGN_MISSION_HASH_MISMATCH")
    if not _hash64(design.get("diffSha256")):
        blockers.append("DESIGN_DIFF_HASH_INVALID")
    if not _hash64(design.get("artifactSha256")):
        blockers.append("DESIGN_ARTIFACT_HASH_INVALID")

    changed_files = _strings(design.get("changedFiles"))
    if not changed_files:
        blockers.append("DESIGN_CHANGED_FILES_REQUIRED")
    evidence = _strings(design.get("evidenceSha256"))
    if not evidence or any(not _hash64(value) for value in evidence):
        blockers.append("DESIGN_EVIDENCE_HASHES_INVALID")

    metric_evidence = dict(design.get("metricEvidence") or {})
    missing_metric_evidence = [key for key in SUCCESSOR_METRIC_WEIGHTS_R183 if not _hash64(metric_evidence.get(key))]
    if missing_metric_evidence:
        blockers.append("METRIC_EVIDENCE_INCOMPLETE:" + ",".join(missing_metric_evidence))

    connection_evidence = dict(design.get("connectionEvidence") or {})
    missing_connection_evidence = [key for key in REQUIRED_CONNECTIONS_R184 if not _hash64(connection_evidence.get(key))]
    if missing_connection_evidence:
        blockers.append("CONNECTION_EVIDENCE_INCOMPLETE:" + ",".join(missing_connection_evidence))

    for field in ("canonicalMutation", "githubMutationAuthorized", "deploymentAuthorized", "promotionAuthorized"):
        if design.get(field) is not False:
            blockers.append(f"DESIGN_{field.upper()}_MUST_BE_FALSE")
    if evaluation.get("predecessorCanonicalGitSha") != design.get("predecessorCanonicalGitSha"):
        blockers.append("EVALUATION_PREDECESSOR_IDENTITY_MISMATCH")
    if evaluation.get("candidateSha256") != design.get("candidateSha256"):
        blockers.append("EVALUATION_CANDIDATE_IDENTITY_MISMATCH")

    core = {
        "schema": "OMEGA_DESIGN_OUTPUT_VALIDATION_R184",
        "revision": IMPROVEMENT_REVISION_R184,
        "valid": not blockers,
        "missionSha256": expected_mission_sha,
        "sourceBranch": design.get("sourceBranch"),
        "sourceCommitSha": design.get("sourceCommitSha"),
        "predecessorCanonicalGitSha": design.get("predecessorCanonicalGitSha"),
        "candidateSha256": design.get("candidateSha256"),
        "diffSha256": design.get("diffSha256"),
        "artifactSha256": design.get("artifactSha256"),
        "changedFiles": changed_files,
        "evidenceSha256": evidence,
        "metricEvidenceComplete": not missing_metric_evidence,
        "connectionEvidenceComplete": not missing_connection_evidence,
        "blockers": blockers,
        "authority": "DESIGN_OUTPUT_VALIDATION_NOT_CANON",
        "canonicalMutation": False,
        "promotionAuthorized": False,
    }
    return {**core, "receiptSha256": canonical_sha256(core)}


def _design_continuation(validation: Mapping[str, Any], candidate: Mapping[str, Any]) -> Dict[str, Any]:
    return {
        "continueDevelopment": True,
        "nextMission": {
            "priority": "DEVELOPMENT",
            "projection": "BUILD",
            "mode": "PULSE",
            "requestedCells": 12,
            "providerBudget": 0,
            "branchConcurrency": 1,
            "allowFullAuto": False,
            "operatorAuthorizedFull": False,
            "expansionProof": {"previousStageVerified": False},
            "intent": (
                f"Complete the exact R184 design-output identity for {candidate.get('candidateId') or 'candidate'}. "
                f"Resolve: {', '.join(validation.get('blockers') or [])}. Preserve the predecessor and all admitted capabilities; "
                "return hash-bound evidence and do not self-promote."
            ),
        },
        "authority": "R184_DESIGN_CONTINUATION_THROUGH_R180_GOVERNOR_NOT_EXECUTION_AUTHORITY",
    }


def discover_improvement_r184(payload: Mapping[str, Any]) -> Dict[str, Any]:
    body = dict(payload or {})
    evaluation = evaluate_successor_r183(body)
    design_validation = validate_design_output_r184(body, evaluation)
    release_ready = evaluation.get("promotionReady") is True and design_validation["valid"] is True

    base: Dict[str, Any] = {
        "ok": True,
        "schema": IMPROVEMENT_SCHEMA_R184,
        "revision": IMPROVEMENT_REVISION_R184,
        "state": "DISCOVERED_SUPERIOR_DESIGN_OUTPUT" if release_ready else "CONTINUE_SHAPING",
        "discoveredSuperiorDesign": release_ready,
        "successorEvaluation": evaluation,
        "designValidation": design_validation,
        "continuousDevelopment": not release_ready,
        "canonicalMutation": False,
        "githubMutationAuthorized": False,
        "deploymentAuthorized": False,
        "promotionAuthorized": False,
        "authority": "IMPROVEMENT_DISCOVERY_RECEIPT_NOT_CANON",
    }
    if not release_ready:
        return {
            **base,
            "releaseIntent": None,
            "continuation": evaluation.get("continuation") or _design_continuation(design_validation, body.get("candidate") or {}),
        }

    design = dict(body["designOutput"])
    mission = dict(body["mission"])
    release_core = {
        "schema": RELEASE_INTENT_SCHEMA_R184,
        "revision": IMPROVEMENT_REVISION_R184,
        "missionSha256": design_validation["missionSha256"],
        "missionObjective": str(mission["objective"]),
        "predecessorCanonicalGitSha": design["predecessorCanonicalGitSha"],
        "sourceBranch": design["sourceBranch"],
        "sourceCommitSha": design["sourceCommitSha"],
        "candidateSha256": design["candidateSha256"],
        "diffSha256": design["diffSha256"],
        "artifactSha256": design["artifactSha256"],
        "changedFiles": design_validation["changedFiles"],
        "evidenceSha256": design_validation["evidenceSha256"],
        "metricEvidence": design["metricEvidence"],
        "connectionEvidence": design["connectionEvidence"],
        "successorPromotionPacket": evaluation["promotionPacket"],
        "targetReleaseAuthority": "omega-v6-full-convergence",
        "nextAction": "OPEN_OR_UPDATE_RELEASE_PR_FOR_EXACT_SOURCE_COMMIT_THEN_R182_VERIFY_DEPLOY_EXACT_SHA_AND_POST_DEPLOY_PROOF",
        "authority": "RELEASE_INTENT_NOT_RELEASE_AUTHORITY",
        "canonicalMutation": False,
        "githubMutationAuthorized": False,
        "deploymentAuthorized": False,
        "promotionAuthorized": False,
    }
    return {
        **base,
        "releaseIntent": {**release_core, "packetSha256": canonical_sha256(release_core)},
        "continuation": None,
    }
