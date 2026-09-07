from __future__ import annotations

from pathlib import Path
from typing import Any

from .sai_b059 import install_from_archives, locate_release, probe, query, traverse, verify_archives, verify_release
from .sai_training import train as train_repository_index

SAI_JOB_KINDS = {
    "sai_b059_verify",
    "sai_b059_install",
    "sai_b059_query",
    "sai_b059_traverse",
    "sai_repository_index",
}


def sai_capabilities(root: Path) -> tuple[list[str], dict[str, Any]]:
    status = probe(root)
    caps = ["sai_b059_probe", "sai_b059_exact_drive_archive_identity"]
    if status.get("state") == "B059_PRESENT_VERIFICATION_REQUIRED":
        caps.extend([
            "sai_b059_verify",
            "sai_b059_grounded_query",
            "sai_b059_20736_traversal",
            "sai_b059_hash_chained_ledger",
            "sai_b059_15_authority_training_scope",
        ])
    return caps, status


def execute_sai_job(kind: str, job: dict, root: Path) -> dict[str, Any]:
    if kind not in SAI_JOB_KINDS:
        raise RuntimeError(f"unsupported R179 SAI job: {kind}")
    payload = job.get("payload") if isinstance(job.get("payload"), dict) else {}
    if kind == "sai_b059_verify":
        release = locate_release(root)
        if release is None:
            archives = verify_archives(root)
            return {
                "kind": kind,
                "blocked": True,
                "reason": "exact OMEGA SAI B059 release is not installed on this authenticated host",
                "archive_set": archives,
                "install_possible": bool(archives.get("passed")),
                "canonical_mutation": False,
            }
        verification = verify_release(release, run_selftest=True, deep=bool(payload.get("deep", False)))
        return {
            "kind": kind,
            "blocked": not verification.get("passed", False),
            "verification": verification,
            "fully_trained_within_declared_scope": bool((verification.get("training") or {}).get("fully_trained_within_declared_scope")),
            "foundation_model_weights_trained": False,
            "native_execution": True,
            "canonical_mutation": False,
        }
    if kind == "sai_b059_install":
        receipt = install_from_archives(root)
        return {
            "kind": kind,
            "blocked": not receipt.get("installed", False),
            "install": receipt,
            "native_execution": True,
            "canonical_mutation": False,
        }
    if kind == "sai_b059_query":
        release = locate_release(root)
        if release is None:
            return {"kind": kind, "blocked": True, "reason": "verified B059 release not installed", "canonical_mutation": False}
        prompt = str(payload.get("prompt") or payload.get("query") or "").strip()
        if not prompt:
            return {"kind": kind, "blocked": True, "reason": "SAI query prompt required", "canonical_mutation": False}
        receipt = query(release, prompt, int(payload.get("limit", 8)))
        return {
            "kind": kind,
            "blocked": bool(receipt.get("blocked")) or not receipt.get("grounded", False),
            "query": receipt,
            "native_execution": True,
            "canonical_mutation": False,
        }
    if kind == "sai_b059_traverse":
        release = locate_release(root)
        if release is None:
            return {"kind": kind, "blocked": True, "reason": "verified B059 release not installed", "canonical_mutation": False}
        receipt = traverse(release, str(payload.get("seed") or ""))
        return {
            "kind": kind,
            "blocked": bool(receipt.get("blocked")) or not receipt.get("valid", False),
            "traversal": receipt,
            "native_execution": True,
            "canonical_mutation": False,
        }
    output = Path(payload.get("output") or (root / ".omega" / "sai-training" / "release"))
    receipt = train_repository_index(root, output)
    return {
        "kind": kind,
        "blocked": receipt.get("state") == "FAILED",
        "repository_index": receipt,
        "native_execution": True,
        "canonical_mutation": False,
        "authority": "REPOSITORY_RETRIEVAL_BOOTSTRAP_NOT_B059_TRAINED_AUTHORITY",
    }
