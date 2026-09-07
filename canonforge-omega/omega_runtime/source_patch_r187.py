from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import subprocess
from typing import Any, Dict, Iterable, List, Mapping

from .warp_candidate import canonical_sha256


PATCH_REVISION_R187 = "R187"
PATCH_SCHEMA_R187 = "OMEGA_BOUNDED_SOURCE_PATCH_R187"
PATCH_APPLY_RECEIPT_SCHEMA_R187 = "OMEGA_BOUNDED_SOURCE_PATCH_APPLY_RECEIPT_R187"
PATCH_ROLLBACK_RECEIPT_SCHEMA_R187 = "OMEGA_BOUNDED_SOURCE_PATCH_ROLLBACK_RECEIPT_R187"
PATCH_AUTHORITY_R187 = "SOURCE_PATCH_CANDIDATE_NOT_CANON"
MAX_PATCH_FILES_R187 = 12
MAX_FILE_BYTES_R187 = 240_000
MAX_PATCH_BYTES_R187 = 1_200_000

ALLOWED_PREFIXES_R187 = (
    "omega_runtime/",
    "cloudflare/omega-v6-worker/src/",
    "tests/",
    "web/",
    "docs/",
)

FORBIDDEN_EXACT_R187 = {
    ".env",
    ".env.local",
    "cloudflare/omega-v6-worker/wrangler.toml",
    "pyproject.toml",
}

FORBIDDEN_PARTS_R187 = {
    ".git",
    ".github",
    "node_modules",
    "__pycache__",
    "secrets",
    "credentials",
}

FORBIDDEN_SUFFIXES_R187 = (
    ".pem", ".key", ".pfx", ".p12", ".crt", ".cer", ".sqlite", ".db", ".zip", ".exe", ".dll",
)


class SourcePatchError(ValueError):
    pass


def _sha_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def _sha_text(value: str) -> str:
    return _sha_bytes(value.encode("utf-8"))


def _git_sha(value: Any) -> bool:
    return isinstance(value, str) and len(value) in {40, 64} and all(ch in "0123456789abcdef" for ch in value.lower())


def _hash64(value: Any) -> bool:
    return isinstance(value, str) and len(value) == 64 and all(ch in "0123456789abcdef" for ch in value.lower())


def _normalized_path(raw: Any) -> str:
    value = str(raw or "").replace("\\", "/").strip().lstrip("./")
    if not value:
        raise SourcePatchError("patch path is empty")
    pure = PurePosixPath(value)
    if pure.is_absolute() or ".." in pure.parts:
        raise SourcePatchError(f"unsafe patch path: {value}")
    lowered = value.lower()
    if any(part.lower() in FORBIDDEN_PARTS_R187 for part in pure.parts):
        raise SourcePatchError(f"forbidden patch path component: {value}")
    if lowered in FORBIDDEN_EXACT_R187:
        raise SourcePatchError(f"protected file cannot be self-patched: {value}")
    if lowered.endswith(FORBIDDEN_SUFFIXES_R187):
        raise SourcePatchError(f"binary/secret-bearing file type cannot be self-patched: {value}")
    if not any(value.startswith(prefix) for prefix in ALLOWED_PREFIXES_R187):
        raise SourcePatchError(f"patch path is outside R187 allow-list: {value}")
    return value


def current_git_sha(root: Path) -> str | None:
    try:
        proc = subprocess.run(
            ["git", "rev-parse", "HEAD"], cwd=str(root), capture_output=True, text=True, timeout=30, check=False
        )
    except (OSError, subprocess.SubprocessError):
        return None
    value = proc.stdout.strip()
    return value if proc.returncode == 0 and _git_sha(value) else None


def git_worktree_clean(root: Path) -> bool:
    try:
        proc = subprocess.run(
            ["git", "status", "--porcelain"], cwd=str(root), capture_output=True, text=True, timeout=30, check=False
        )
    except (OSError, subprocess.SubprocessError):
        return False
    return proc.returncode == 0 and not proc.stdout.strip()


def build_source_patch_r187(
    *,
    predecessor_git_sha: str,
    objective: str,
    source_evidence_sha256: str,
    changes: Iterable[Mapping[str, Any]],
    continuation: Mapping[str, Any] | None = None,
) -> Dict[str, Any]:
    if not _git_sha(predecessor_git_sha):
        raise SourcePatchError("predecessor git SHA must be a 40/64-character hex identity")
    if not _hash64(source_evidence_sha256):
        raise SourcePatchError("source R186 evidence hash is invalid")
    objective_text = str(objective or "").strip()
    if not objective_text:
        raise SourcePatchError("patch objective is required")

    normalized: List[Dict[str, Any]] = []
    total_bytes = 0
    seen: set[str] = set()
    for raw in changes:
        path = _normalized_path(raw.get("path"))
        if path in seen:
            raise SourcePatchError(f"duplicate patch path: {path}")
        seen.add(path)
        content = raw.get("content")
        if not isinstance(content, str):
            raise SourcePatchError(f"patch content must be UTF-8 text: {path}")
        encoded = content.encode("utf-8")
        if len(encoded) > MAX_FILE_BYTES_R187:
            raise SourcePatchError(f"patch file exceeds {MAX_FILE_BYTES_R187} bytes: {path}")
        total_bytes += len(encoded)
        before_sha = str(raw.get("beforeSha256") or "")
        before_absent = raw.get("beforeAbsent") is True
        if before_absent:
            before_sha = "ABSENT"
        elif not _hash64(before_sha):
            raise SourcePatchError(f"beforeSha256 is invalid for {path}")
        after_sha = _sha_bytes(encoded)
        supplied_after = raw.get("afterSha256")
        if supplied_after is not None and supplied_after != after_sha:
            raise SourcePatchError(f"afterSha256 mismatch for {path}")
        normalized.append({
            "path": path,
            "beforeSha256": before_sha,
            "afterSha256": after_sha,
            "bytes": len(encoded),
            "content": content,
        })
    if not normalized:
        raise SourcePatchError("at least one source change is required")
    if len(normalized) > MAX_PATCH_FILES_R187:
        raise SourcePatchError(f"patch contains more than {MAX_PATCH_FILES_R187} files")
    if total_bytes > MAX_PATCH_BYTES_R187:
        raise SourcePatchError(f"patch exceeds {MAX_PATCH_BYTES_R187} bytes")

    objective_sha = _sha_text(objective_text)
    patch_id = f"r187_{predecessor_git_sha[:12]}_{source_evidence_sha256[:12]}_{objective_sha[:12]}"
    core = {
        "schema": PATCH_SCHEMA_R187,
        "revision": PATCH_REVISION_R187,
        "patchId": patch_id,
        "predecessorGitSha": predecessor_git_sha,
        "objective": objective_text,
        "objectiveSha256": objective_sha,
        "sourceEvidenceSha256": source_evidence_sha256,
        "continuation": dict(continuation or {}),
        "changes": normalized,
        "limits": {
            "maxFiles": MAX_PATCH_FILES_R187,
            "maxFileBytes": MAX_FILE_BYTES_R187,
            "maxPatchBytes": MAX_PATCH_BYTES_R187,
            "allowedPrefixes": list(ALLOWED_PREFIXES_R187),
        },
        "validationSequence": ["materialize_source_patch", "apply_source_patch", "run_tests", "build_vite", "wrangler_dry_run", "verify_source_patch"],
        "rollbackRequiredOnFailure": True,
        "sourceMutationScope": "APPROVED_SOVEREIGN_WORKTREE_ONLY",
        "gitCommitAuthorized": False,
        "gitPushAuthorized": False,
        "githubMutationAuthorized": False,
        "deploymentAuthorized": False,
        "promotionAuthorized": False,
        "canonicalMutation": False,
        "authority": PATCH_AUTHORITY_R187,
        "truthBoundary": "R187 may stage and apply hash-bound UTF-8 source changes only inside allow-listed paths of the authenticated approved Sovereign worktree. Exact predecessor/file hashes are mandatory; validation failure requires rollback. It cannot commit, push, deploy or promote Canon by itself.",
    }
    return {**core, "patchSha256": canonical_sha256(core)}


def validate_source_patch_r187(patch: Mapping[str, Any]) -> Dict[str, Any]:
    value = dict(patch or {})
    if value.get("schema") != PATCH_SCHEMA_R187 or value.get("revision") != PATCH_REVISION_R187:
        raise SourcePatchError("R187 patch schema/revision is invalid")
    if value.get("authority") != PATCH_AUTHORITY_R187:
        raise SourcePatchError("R187 patch authority boundary is invalid")
    for field in ("gitCommitAuthorized", "gitPushAuthorized", "githubMutationAuthorized", "deploymentAuthorized", "promotionAuthorized", "canonicalMutation"):
        if value.get(field) is not False:
            raise SourcePatchError(f"R187 {field} must be false")
    if not _git_sha(value.get("predecessorGitSha")):
        raise SourcePatchError("R187 predecessor Git SHA is invalid")
    if not _hash64(value.get("sourceEvidenceSha256")):
        raise SourcePatchError("R187 source evidence hash is invalid")
    objective = str(value.get("objective") or "").strip()
    if not objective or value.get("objectiveSha256") != _sha_text(objective):
        raise SourcePatchError("R187 objective identity mismatch")
    changes = value.get("changes")
    if not isinstance(changes, list) or not changes or len(changes) > MAX_PATCH_FILES_R187:
        raise SourcePatchError("R187 changes are missing or exceed file limit")
    total = 0
    seen: set[str] = set()
    for row in changes:
        if not isinstance(row, Mapping):
            raise SourcePatchError("R187 change entry is invalid")
        path = _normalized_path(row.get("path"))
        if path in seen:
            raise SourcePatchError(f"duplicate R187 path: {path}")
        seen.add(path)
        content = row.get("content")
        if not isinstance(content, str):
            raise SourcePatchError(f"R187 content is not text: {path}")
        encoded = content.encode("utf-8")
        total += len(encoded)
        if len(encoded) > MAX_FILE_BYTES_R187:
            raise SourcePatchError(f"R187 file too large: {path}")
        if row.get("beforeSha256") != "ABSENT" and not _hash64(row.get("beforeSha256")):
            raise SourcePatchError(f"R187 before hash invalid: {path}")
        if row.get("afterSha256") != _sha_bytes(encoded):
            raise SourcePatchError(f"R187 after hash mismatch: {path}")
    if total > MAX_PATCH_BYTES_R187:
        raise SourcePatchError("R187 patch byte budget exceeded")
    patch_hash = value.get("patchSha256")
    if not _hash64(patch_hash):
        raise SourcePatchError("R187 patch hash is invalid")
    core = dict(value)
    core.pop("patchSha256", None)
    if canonical_sha256(core) != patch_hash:
        raise SourcePatchError("R187 patch capsule hash mismatch")
    return value


def _patch_dir(root: Path, patch_id: str) -> Path:
    safe = "".join(ch for ch in str(patch_id) if ch.isalnum() or ch in {"-", "_"})[:180]
    if not safe:
        raise SourcePatchError("R187 patch id is unsafe")
    return root.resolve() / "convergence" / "source_patches" / safe


def _target(root: Path, relative: str) -> Path:
    root_resolved = root.resolve()
    target = (root_resolved / relative).resolve()
    try:
        target.relative_to(root_resolved)
    except ValueError as exc:
        raise SourcePatchError(f"R187 target escaped approved root: {relative}") from exc
    return target


def materialize_source_patch_r187(root: Path, patch: Mapping[str, Any]) -> Dict[str, Any]:
    valid = validate_source_patch_r187(patch)
    directory = _patch_dir(root, valid["patchId"])
    staged = directory / "staged"
    staged.mkdir(parents=True, exist_ok=True)
    for row in valid["changes"]:
        out = staged / row["path"]
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(row["content"], encoding="utf-8")
    manifest = directory / "patch.json"
    manifest.write_text(json.dumps(valid, indent=2, sort_keys=True), encoding="utf-8")
    return {
        "schema": "OMEGA_SOURCE_PATCH_MATERIALIZATION_R187",
        "revision": PATCH_REVISION_R187,
        "patchId": valid["patchId"],
        "patchSha256": valid["patchSha256"],
        "directory": str(directory),
        "stagedFiles": [row["path"] for row in valid["changes"]],
        "sourceMutation": False,
        "canonicalMutation": False,
    }


def verify_preconditions_r187(root: Path, patch: Mapping[str, Any], require_clean: bool = True) -> Dict[str, Any]:
    valid = validate_source_patch_r187(patch)
    head = current_git_sha(root)
    if head != valid["predecessorGitSha"]:
        raise SourcePatchError(f"R187 predecessor mismatch: workspace={head} patch={valid['predecessorGitSha']}")
    if require_clean and not git_worktree_clean(root):
        raise SourcePatchError("R187 requires a clean worktree before source mutation")
    checks: List[Dict[str, Any]] = []
    for row in valid["changes"]:
        target = _target(root, row["path"])
        if row["beforeSha256"] == "ABSENT":
            if target.exists():
                raise SourcePatchError(f"R187 expected absent file already exists: {row['path']}")
            checks.append({"path": row["path"], "exists": False, "beforeSha256": "ABSENT"})
            continue
        if not target.exists() or not target.is_file():
            raise SourcePatchError(f"R187 predecessor file missing: {row['path']}")
        digest = _sha_bytes(target.read_bytes())
        if digest != row["beforeSha256"]:
            raise SourcePatchError(f"R187 predecessor file hash mismatch: {row['path']}")
        checks.append({"path": row["path"], "exists": True, "beforeSha256": digest})
    return {"head": head, "worktreeClean": git_worktree_clean(root), "files": checks}


def apply_source_patch_r187(root: Path, patch: Mapping[str, Any]) -> Dict[str, Any]:
    valid = validate_source_patch_r187(patch)
    preconditions = verify_preconditions_r187(root, valid, require_clean=True)
    directory = _patch_dir(root, valid["patchId"])
    backup = directory / "backup"
    backup.mkdir(parents=True, exist_ok=True)
    applied: List[Dict[str, Any]] = []
    try:
        for row in valid["changes"]:
            target = _target(root, row["path"])
            backup_path = backup / row["path"]
            if target.exists():
                backup_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(target, backup_path)
            target.parent.mkdir(parents=True, exist_ok=True)
            tmp = target.with_suffix(target.suffix + ".r187.tmp")
            tmp.write_text(row["content"], encoding="utf-8")
            os.replace(tmp, target)
            digest = _sha_bytes(target.read_bytes())
            if digest != row["afterSha256"]:
                raise SourcePatchError(f"R187 post-write hash mismatch: {row['path']}")
            applied.append({"path": row["path"], "afterSha256": digest, "created": row["beforeSha256"] == "ABSENT"})
    except Exception:
        _restore_backup(root, valid, backup)
        raise
    core = {
        "schema": PATCH_APPLY_RECEIPT_SCHEMA_R187,
        "revision": PATCH_REVISION_R187,
        "patchId": valid["patchId"],
        "patchSha256": valid["patchSha256"],
        "predecessorGitSha": valid["predecessorGitSha"],
        "preconditions": preconditions,
        "applied": applied,
        "backupDirectory": str(backup),
        "rollbackAvailable": True,
        "gitCommitCreated": False,
        "gitPushPerformed": False,
        "deploymentPerformed": False,
        "canonicalMutation": False,
        "authority": "SOVEREIGN_WORKTREE_PATCH_APPLIED_NOT_CANON",
    }
    return {**core, "receiptSha256": canonical_sha256(core)}


def _restore_backup(root: Path, patch: Mapping[str, Any], backup: Path) -> List[str]:
    restored: List[str] = []
    for row in patch["changes"]:
        target = _target(root, row["path"])
        backup_path = backup / row["path"]
        if row["beforeSha256"] == "ABSENT":
            if target.exists():
                target.unlink()
            restored.append(row["path"])
            continue
        if not backup_path.exists():
            raise SourcePatchError(f"R187 rollback backup missing: {row['path']}")
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(backup_path, target)
        restored.append(row["path"])
    return restored


def rollback_source_patch_r187(root: Path, patch: Mapping[str, Any]) -> Dict[str, Any]:
    valid = validate_source_patch_r187(patch)
    backup = _patch_dir(root, valid["patchId"]) / "backup"
    restored = _restore_backup(root, valid, backup)
    core = {
        "schema": PATCH_ROLLBACK_RECEIPT_SCHEMA_R187,
        "revision": PATCH_REVISION_R187,
        "patchId": valid["patchId"],
        "patchSha256": valid["patchSha256"],
        "restored": restored,
        "headAfterRollback": current_git_sha(root),
        "gitCommitCreated": False,
        "gitPushPerformed": False,
        "deploymentPerformed": False,
        "canonicalMutation": False,
        "authority": "SOVEREIGN_WORKTREE_ROLLBACK_RECEIPT_NOT_CANON",
    }
    return {**core, "receiptSha256": canonical_sha256(core)}
