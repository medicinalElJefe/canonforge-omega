from __future__ import annotations

from dataclasses import dataclass, asdict
from hashlib import sha256
import json
import re
from typing import Any

ACTIONS = {"BUILD","TEST","INDEX","READ_TEXT","SEARCH_TEXT","HASH_TREE","WORKBOOK_AUDIT","PACKAGE","SUPPORT_BUNDLE","APPLY_PATCH","TRAIN_LOCAL"}
PROFILES = {"AUTO_BUILD","NODE_BUILD","PYTHON_TEST","DOTNET_BUILD","NONE"}
PATH_BAD = re.compile(r"(^[A-Za-z]:)|(^/)|(^\\\\)|(?:^|[\\/])\.\.(?:[\\/]|$)")


@dataclass(frozen=True, slots=True)
class DraftPlan:
    schema: str
    action: str
    profile: str
    project_path: str
    rationale: str
    expected_proof: tuple[str, ...]
    warnings: tuple[str, ...]
    requiresConfirmation: bool = True
    confirmed: bool = False
    queued: bool = False
    hostStateMutation: bool = False
    queueMutation: bool = False


def _safe_path(path: str) -> tuple[str, list[str]]:
    raw = (path or ".").strip().replace("\\", "/")
    warnings = []
    if not raw or PATH_BAD.search(raw):
        warnings.append("Unsafe or absolute path replaced with approved-root marker '.'")
        return ".", warnings
    clean = "/".join(x for x in raw.split("/") if x not in ("", ".")) or "."
    if any(x == ".." for x in clean.split("/")):
        warnings.append("Parent traversal replaced with approved-root marker '.'")
        return ".", warnings
    return clean, warnings


def plan_prompt(prompt: str, *, project_path: str = ".") -> dict[str, Any]:
    text = " ".join(str(prompt).strip().split())
    low = text.lower()
    path, warnings = _safe_path(project_path)
    if any(k in low for k in ("train", "learn locally", "learning cycle")):
        action, profile = "TRAIN_LOCAL", "NONE"
    elif any(k in low for k in ("support bundle", "diagnostic bundle", "support packet")):
        action, profile = "SUPPORT_BUNDLE", "NONE"
    elif any(k in low for k in ("workbook", "excel", "xlsx", "xlsm")):
        action, profile = "WORKBOOK_AUDIT", "NONE"
    elif any(k in low for k in ("package", "zip", "release bundle")):
        action, profile = "PACKAGE", "NONE"
    elif any(k in low for k in ("test", "pytest", "unit test", "acceptance")):
        action, profile = "TEST", "PYTHON_TEST" if "python" in low or "pytest" in low else "AUTO_BUILD"
    elif any(k in low for k in ("build", "compile", "repair", "fix", "patch")):
        action = "BUILD"
        profile = "NODE_BUILD" if any(k in low for k in ("node", "npm", "javascript", "typescript")) else "DOTNET_BUILD" if any(k in low for k in ("dotnet", ".net", "c#")) else "AUTO_BUILD"
    elif any(k in low for k in ("search", "find text", "grep")):
        action, profile = "SEARCH_TEXT", "NONE"
    elif any(k in low for k in ("read", "inspect file", "open file")):
        action, profile = "READ_TEXT", "NONE"
    elif any(k in low for k in ("hash", "fingerprint", "checksum")):
        action, profile = "HASH_TREE", "NONE"
    else:
        action, profile = "INDEX", "NONE"
        warnings.append("No executable intent was unambiguous; draft defaults to discovery/indexing.")
    if path == "." and action in {"BUILD", "TEST"}:
        action = "INDEX"
        profile = "NONE"
        warnings.append("Broad-root build/test converted to discovery-only INDEX; locate a child project manifest first.")
    expected = {
        "BUILD": ("exit_code", "bounded_log", "output_paths", "result_fingerprint"),
        "TEST": ("exit_code", "bounded_log", "test_summary", "result_fingerprint"),
        "INDEX": ("bounded_file_index", "content_hashes", "result_fingerprint"),
        "READ_TEXT": ("source_sha256", "bounded_text", "result_fingerprint"),
        "SEARCH_TEXT": ("match_locations", "source_hashes", "result_fingerprint"),
        "HASH_TREE": ("file_count", "tree_fingerprint"),
        "WORKBOOK_AUDIT": ("semantic_fingerprint", "formula_count", "result_fingerprint"),
        "PACKAGE": ("package_path", "sha256", "file_count"),
        "SUPPORT_BUNDLE": ("bundle_path", "sha256", "redaction_boundary"),
        "APPLY_PATCH": ("pre_hash", "post_hash", "backup_path", "rollback_path"),
        "TRAIN_LOCAL": ("corpus_fingerprint", "model_fingerprint", "training_receipt"),
    }[action]
    rationale = f"Prompt mapped to governed {action}; execution remains on an explicitly authorized node and requires explicit confirmation; canonical authority remains cloud-hosted."
    draft = DraftPlan("OMEGA_HYBRID_DRAFT_V1", action, profile, path, rationale, expected, tuple(warnings))
    payload = asdict(draft)
    payload["plan_fingerprint"] = sha256(json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")).hexdigest()
    return payload


def validate_mission(spec: dict[str, Any]) -> dict[str, Any]:
    errors = []
    device = str(spec.get("device_id", "")).strip()
    root = str(spec.get("project_path", ".")).strip()
    operations = [str(x).upper() for x in spec.get("allowed_operations", [])]
    domains = [str(x).lower().strip() for x in spec.get("allowed_domains", []) if str(x).strip()]
    cycles = int(spec.get("cycle_budget", 3))
    safe_root, warnings = _safe_path(root)
    if not device:
        errors.append("device_id required")
    unknown = sorted(set(operations) - ACTIONS)
    if unknown:
        errors.append("unknown operations: " + ", ".join(unknown))
    if not 2 <= cycles <= 8:
        errors.append("cycle_budget must be 2..8")
    for d in domains:
        if "/" in d or ":" in d or d.startswith(".") or d.endswith("."):
            errors.append(f"invalid allowed domain: {d}")
    normalized = {"device_id": device, "project_path": safe_root, "allowed_operations": operations, "allowed_domains": sorted(set(domains)), "cycle_budget": cycles, "status": "DRAFT", "hostStateMutation": False}
    normalized["mission_fingerprint"] = sha256(json.dumps(normalized, sort_keys=True, separators=(",", ":")).encode("utf-8")).hexdigest()
    return {"status": "PASS" if not errors else "FAIL", "errors": errors, "warnings": warnings, "mission": normalized}
