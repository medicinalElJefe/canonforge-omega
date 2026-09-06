from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any, Dict, Iterable, List


WARP_BUILD_CANDIDATE_SCHEMA_R178 = "OMEGA_WARP_BUILD_CANDIDATE_R178"
WARP_BUILD_CANDIDATE_REVISION_R178 = "R178"
WARP_RECEIPT_SCHEMA_R176 = "OMEGA_WARP_EXECUTION_RECEIPT_R176"
WARP_INTEGRITY_REVISION_R177 = "R177"
WARP_BUILD_CANDIDATE_AUTHORITY_R178 = "CANDIDATE_NOT_CANON"
WARP_BUILD_IMPORT_SCHEMA_R178 = "OMEGA_SOVEREIGN_WARP_CANDIDATE_JOB_R178"

SAFE_CANDIDATE_JOB_KINDS = (
    "prepare_candidate",
    "run_tests",
    "build_vite",
    "wrangler_dry_run",
    "verify_candidate",
)

TARGET_CAPABILITY_DIMENSIONS = (
    "SOFTWARE",
    "TEST",
    "UI",
    "FEDERATION",
    "SOVEREIGN",
    "PROOF",
    "DATA",
    "RESEARCH",
    "VISUAL",
    "COMPUTE",
    "RECOVERY",
    "COORDINATION",
)

TRUTH_BOUNDARY_R178 = (
    "R178 converts a strictly accounted R177 software-warp receipt into a bounded build candidate capsule. "
    "The capsule may be inspected, materialized, tested, typechecked and dry-run by the authenticated "
    "Sovereign host, but it cannot mutate CanonState, source authority, GitHub, deployment state, or production "
    "without a separate proof and release-promotion path. 12/144/1728/20736 remain software address/execution "
    "resolution levels, not physical dimensions."
)


class WarpCandidateError(ValueError):
    pass


def canonical_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, default=str)


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def canonical_sha256(value: Any) -> str:
    return sha256_text(canonical_json(value))


def _hash64(value: Any) -> bool:
    if not isinstance(value, str) or len(value) != 64:
        return False
    return all(ch in "0123456789abcdef" for ch in value.lower())


def _positive_int(value: Any, field: str) -> int:
    try:
        number = int(value)
    except (TypeError, ValueError) as exc:
        raise WarpCandidateError(f"{field} must be an integer") from exc
    if number <= 0:
        raise WarpCandidateError(f"{field} must be positive")
    return number


def validate_source_receipt(receipt: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(receipt, dict):
        raise WarpCandidateError("sourceReceipt must be an object")
    if receipt.get("schema") != WARP_RECEIPT_SCHEMA_R176:
        raise WarpCandidateError("source receipt schema is not OMEGA_WARP_EXECUTION_RECEIPT_R176")
    if receipt.get("integrityRevision") != WARP_INTEGRITY_REVISION_R177:
        raise WarpCandidateError("source receipt is not protected by R177 strict accounting")
    if receipt.get("strictCompletionInvariant") is not True:
        raise WarpCandidateError("source receipt does not assert the strict completion invariant")
    if receipt.get("proofState") != "RETURNED_NOT_ADMITTED":
        raise WarpCandidateError("source receipt proof state is not RETURNED_NOT_ADMITTED")
    if receipt.get("authority") != "WARP_EXECUTION_RECEIPT_NOT_CANON":
        raise WarpCandidateError("source receipt authority boundary is invalid")
    if receipt.get("canonicalMutation") is not False:
        raise WarpCandidateError("source receipt claims canonical mutation")
    if receipt.get("performanceGuaranteeClaim") is not False:
        raise WarpCandidateError("source receipt improperly claims a performance guarantee")
    if receipt.get("physicalDimensionClaim") is not False:
        raise WarpCandidateError("source receipt improperly claims physical dimensions")

    total = _positive_int(receipt.get("totalCells"), "sourceReceipt.totalCells")
    completed = int(receipt.get("completedCells") or 0)
    failed = int(receipt.get("failedCells") or 0)
    if completed != total or failed != 0:
        raise WarpCandidateError(
            f"source receipt is not an exact zero-failure completion: completed={completed} failed={failed} total={total}"
        )
    if not _hash64(receipt.get("resultMerkleRoot")):
        raise WarpCandidateError("source receipt resultMerkleRoot is missing or invalid")
    if not _hash64(receipt.get("receiptSha256")):
        raise WarpCandidateError("source receipt receiptSha256 is missing or invalid")

    invariant = receipt.get("completionInvariant") or {}
    if invariant.get("strict") is not True or invariant.get("allShardsAccounted") is not True:
        raise WarpCandidateError("source receipt completionInvariant is not strict/all-shards-accounted")
    if int(invariant.get("accountedCells") or -1) != total:
        raise WarpCandidateError("source receipt completionInvariant accountedCells does not equal total")
    if int(invariant.get("delta") or 0) != 0:
        raise WarpCandidateError("source receipt completionInvariant delta is non-zero")
    if int(invariant.get("invalidShardCount") or 0) != 0:
        raise WarpCandidateError("source receipt contains invalid shards")
    return receipt


def _normalize_capabilities(values: Iterable[Any] | None) -> List[str]:
    allowed = set(TARGET_CAPABILITY_DIMENSIONS)
    out: List[str] = []
    for raw in values or TARGET_CAPABILITY_DIMENSIONS:
        value = str(raw).strip().upper()
        if value in allowed and value not in out:
            out.append(value)
    return out or list(TARGET_CAPABILITY_DIMENSIONS)


def build_candidate_capsule(
    source_status: Dict[str, Any],
    objective: str,
    desired_capabilities: Iterable[Any] | None = None,
) -> Dict[str, Any]:
    if not isinstance(source_status, dict):
        raise WarpCandidateError("source warp status must be an object")
    receipt = validate_source_receipt(source_status.get("receipt") or {})
    if source_status.get("state") != "COMPLETE":
        raise WarpCandidateError("source warp status is not COMPLETE")
    if source_status.get("integrityRevision") != WARP_INTEGRITY_REVISION_R177:
        raise WarpCandidateError("source warp status is not R177 integrity-protected")
    total = _positive_int(source_status.get("totalCells"), "sourceStatus.totalCells")
    if int(source_status.get("completedCells") or 0) != total or int(source_status.get("failedCells") or 0) != 0:
        raise WarpCandidateError("source warp status is not exact zero-failure completion")
    if receipt.get("totalCells") != total:
        raise WarpCandidateError("source status and source receipt totalCells disagree")

    objective_text = str(objective or "").strip()
    if not objective_text:
        raise WarpCandidateError("candidate objective is required")
    objective_text = objective_text[:6000]
    source_receipt_canonical_sha = canonical_sha256(receipt)
    objective_sha = sha256_text(objective_text)
    candidate_id = f"warp_candidate_{str(receipt['receiptSha256'])[:12]}_{objective_sha[:12]}"
    capabilities = _normalize_capabilities(desired_capabilities)

    actions = [
        {
            "order": index + 1,
            "kind": kind,
            "authority": "ALLOW_LISTED_SOVEREIGN_JOB_NOT_RELEASE_AUTHORITY",
            "reason": {
                "prepare_candidate": "Materialize the immutable R178 capsule as a bounded local candidate artifact; do not edit source.",
                "run_tests": "Run the complete sovereign Python test suite against the approved workspace.",
                "build_vite": "Reconfirm the Cloudflare/Vite TypeScript interface boundary.",
                "wrangler_dry_run": "Package the Worker with Wrangler dry-run only; do not deploy.",
                "verify_candidate": "Revalidate the capsule identity, local artifact, tests, computation truth and workspace state for review.",
            }[kind],
        }
        for index, kind in enumerate(SAFE_CANDIDATE_JOB_KINDS)
    ]

    source_summary = {
        "warpId": source_status.get("warpId"),
        "profile": source_status.get("profile"),
        "purpose": source_status.get("purpose"),
        "integrityRevision": source_status.get("integrityRevision"),
        "totalCells": total,
        "completedCells": int(source_status.get("completedCells") or 0),
        "failedCells": int(source_status.get("failedCells") or 0),
        "shardCount": int(source_status.get("shardCount") or 0),
        "resultMerkleRoot": source_status.get("resultMerkleRoot"),
        "receiptSha256": receipt.get("receiptSha256"),
    }
    core: Dict[str, Any] = {
        "schema": WARP_BUILD_CANDIDATE_SCHEMA_R178,
        "revision": WARP_BUILD_CANDIDATE_REVISION_R178,
        "candidateId": candidate_id,
        "objective": objective_text,
        "objectiveSha256": objective_sha,
        "source": source_summary,
        "sourceReceipt": receipt,
        "sourceReceiptCanonicalSha256": source_receipt_canonical_sha,
        "capabilityDelta": {
            "targetDimensions": capabilities,
            "requestedCount": len(capabilities),
            "mode": "ADDITIVE_SUCCESSOR",
            "preserveExistingCapabilities": True,
            "noFlattening": True,
        },
        "actions": actions,
        "validationPlan": {
            "sequence": list(SAFE_CANDIDATE_JOB_KINDS),
            "requiresAuthenticatedSovereignHost": True,
            "sourceMutationDuringPreparation": False,
            "deploymentDuringValidation": False,
            "promotionRequiresSeparateAuthority": True,
        },
        "lineage": {
            "sourceWarpId": source_status.get("warpId"),
            "sourceResultMerkleRoot": source_status.get("resultMerkleRoot"),
            "sourceReceiptSha256": receipt.get("receiptSha256"),
            "sourceReceiptCanonicalSha256": source_receipt_canonical_sha,
            "continuity": "strict R177 receipt -> R178 candidate capsule -> sovereign allow-listed validation -> separate promotion decision",
        },
        "authority": WARP_BUILD_CANDIDATE_AUTHORITY_R178,
        "canonicalMutation": False,
        "sourceMutationAuthorized": False,
        "githubMutationAuthorized": False,
        "deploymentAuthorized": False,
        "promotionAuthorized": False,
        "physicalDimensionClaim": False,
        "performanceGuaranteeClaim": False,
        "truthBoundary": TRUTH_BOUNDARY_R178,
    }
    return {**core, "capsuleSha256": canonical_sha256(core)}


def validate_candidate_capsule(candidate: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(candidate, dict):
        raise WarpCandidateError("candidate must be an object")
    if candidate.get("schema") != WARP_BUILD_CANDIDATE_SCHEMA_R178:
        raise WarpCandidateError("candidate schema is invalid")
    if candidate.get("revision") != WARP_BUILD_CANDIDATE_REVISION_R178:
        raise WarpCandidateError("candidate revision is invalid")
    if candidate.get("authority") != WARP_BUILD_CANDIDATE_AUTHORITY_R178:
        raise WarpCandidateError("candidate authority boundary is invalid")
    for field in (
        "canonicalMutation",
        "sourceMutationAuthorized",
        "githubMutationAuthorized",
        "deploymentAuthorized",
        "promotionAuthorized",
        "physicalDimensionClaim",
        "performanceGuaranteeClaim",
    ):
        if candidate.get(field) is not False:
            raise WarpCandidateError(f"candidate {field} must be false")

    objective = str(candidate.get("objective") or "").strip()
    if not objective:
        raise WarpCandidateError("candidate objective is empty")
    if candidate.get("objectiveSha256") != sha256_text(objective):
        raise WarpCandidateError("candidate objective hash mismatch")

    receipt = validate_source_receipt(candidate.get("sourceReceipt") or {})
    if candidate.get("sourceReceiptCanonicalSha256") != canonical_sha256(receipt):
        raise WarpCandidateError("candidate source receipt canonical hash mismatch")
    source = candidate.get("source") or {}
    for key in ("warpId", "profile", "purpose", "totalCells", "completedCells", "failedCells", "shardCount", "resultMerkleRoot", "receiptSha256"):
        expected = {
            "warpId": receipt.get("warpId"),
            "profile": receipt.get("profile"),
            "purpose": receipt.get("purpose"),
            "totalCells": receipt.get("totalCells"),
            "completedCells": receipt.get("completedCells"),
            "failedCells": receipt.get("failedCells"),
            "shardCount": receipt.get("shardCount"),
            "resultMerkleRoot": receipt.get("resultMerkleRoot"),
            "receiptSha256": receipt.get("receiptSha256"),
        }[key]
        if source.get(key) != expected:
            raise WarpCandidateError(f"candidate source.{key} does not match source receipt")
    if source.get("integrityRevision") != WARP_INTEGRITY_REVISION_R177:
        raise WarpCandidateError("candidate source integrity revision is not R177")

    actions = candidate.get("actions")
    if not isinstance(actions, list):
        raise WarpCandidateError("candidate actions must be a list")
    kinds = [str(action.get("kind")) for action in actions if isinstance(action, dict)]
    if kinds != list(SAFE_CANDIDATE_JOB_KINDS):
        raise WarpCandidateError("candidate validation actions do not match the fixed allow-listed R178 sequence")
    plan = candidate.get("validationPlan") or {}
    if plan.get("sequence") != list(SAFE_CANDIDATE_JOB_KINDS):
        raise WarpCandidateError("candidate validation plan sequence mismatch")
    if plan.get("requiresAuthenticatedSovereignHost") is not True:
        raise WarpCandidateError("candidate does not require authenticated Sovereign host validation")
    if plan.get("sourceMutationDuringPreparation") is not False or plan.get("deploymentDuringValidation") is not False:
        raise WarpCandidateError("candidate validation plan permits mutation or deployment")

    capsule_hash = candidate.get("capsuleSha256")
    if not _hash64(capsule_hash):
        raise WarpCandidateError("candidate capsuleSha256 is missing or invalid")
    core = dict(candidate)
    core.pop("capsuleSha256", None)
    if capsule_hash != canonical_sha256(core):
        raise WarpCandidateError("candidate capsule hash mismatch")
    return candidate


def candidate_job_payload(candidate: Dict[str, Any], sequence_index: int = 0) -> Dict[str, Any]:
    valid = validate_candidate_capsule(candidate)
    if sequence_index < 0 or sequence_index >= len(SAFE_CANDIDATE_JOB_KINDS):
        raise WarpCandidateError("candidate sequence index is out of range")
    return {
        "schema": WARP_BUILD_IMPORT_SCHEMA_R178,
        "revision": WARP_BUILD_CANDIDATE_REVISION_R178,
        "candidate_id": valid["candidateId"],
        "candidate_sha256": valid["capsuleSha256"],
        "source_warp_id": valid["source"]["warpId"],
        "source_receipt_sha256": valid["source"]["receiptSha256"],
        "sequence": list(SAFE_CANDIDATE_JOB_KINDS),
        "sequence_index": sequence_index,
        "candidate": valid,
        "canonical_mutation": False,
        "deployment_authorized": False,
        "promotion_authorized": False,
    }


def candidate_artifact_path(root: Path, candidate_id: str) -> Path:
    safe_id = "".join(ch for ch in str(candidate_id) if ch.isalnum() or ch in {"-", "_"})[:180]
    if not safe_id:
        raise WarpCandidateError("candidate id cannot be represented safely on disk")
    return root.resolve() / "convergence" / "candidates" / f"{safe_id}.json"


def prepare_candidate_artifact(root: Path, candidate: Dict[str, Any]) -> Dict[str, Any]:
    valid = validate_candidate_capsule(candidate)
    path = candidate_artifact_path(root, valid["candidateId"])
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(valid, indent=2, sort_keys=True, ensure_ascii=False) + "\n"
    tmp = path.with_suffix(".tmp")
    tmp.write_text(text, encoding="utf-8")
    tmp.replace(path)
    return {
        "schema": "OMEGA_WARP_CANDIDATE_ARTIFACT_R178",
        "candidate_id": valid["candidateId"],
        "candidate_sha256": valid["capsuleSha256"],
        "artifact_path": str(path),
        "artifact_sha256": sha256_text(text),
        "bytes": len(text.encode("utf-8")),
        "source_mutation": False,
        "canonical_mutation": False,
        "deployment": False,
    }


def verify_candidate_artifact(root: Path, candidate: Dict[str, Any]) -> Dict[str, Any]:
    valid = validate_candidate_capsule(candidate)
    path = candidate_artifact_path(root, valid["candidateId"])
    if not path.exists():
        return {
            "ok": False,
            "candidate_id": valid["candidateId"],
            "candidate_sha256": valid["capsuleSha256"],
            "artifact_path": str(path),
            "reason": "candidate artifact is missing",
        }
    try:
        parsed = json.loads(path.read_text(encoding="utf-8"))
        validate_candidate_capsule(parsed)
    except (OSError, json.JSONDecodeError, WarpCandidateError) as exc:
        return {
            "ok": False,
            "candidate_id": valid["candidateId"],
            "candidate_sha256": valid["capsuleSha256"],
            "artifact_path": str(path),
            "reason": f"candidate artifact validation failed: {exc}",
        }
    if parsed.get("capsuleSha256") != valid["capsuleSha256"]:
        return {
            "ok": False,
            "candidate_id": valid["candidateId"],
            "candidate_sha256": valid["capsuleSha256"],
            "artifact_path": str(path),
            "reason": "candidate artifact capsule identity does not match queued candidate",
        }
    return {
        "ok": True,
        "candidate_id": valid["candidateId"],
        "candidate_sha256": valid["capsuleSha256"],
        "artifact_path": str(path),
        "source_warp_id": valid["source"]["warpId"],
        "source_receipt_sha256": valid["source"]["receiptSha256"],
        "canonical_mutation": False,
        "deployment": False,
    }
