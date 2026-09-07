from __future__ import annotations

import hashlib
import subprocess
from pathlib import Path

import pytest

from omega_runtime.source_patch_r187 import (
    PATCH_APPLY_RECEIPT_SCHEMA_R187,
    PATCH_ROLLBACK_RECEIPT_SCHEMA_R187,
    SourcePatchError,
    apply_source_patch_r187,
    build_source_patch_r187,
    materialize_source_patch_r187,
    rollback_source_patch_r187,
    validate_source_patch_r187,
)


def _sha(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _git(root: Path, *args: str) -> str:
    proc = subprocess.run(["git", *args], cwd=root, check=True, capture_output=True, text=True)
    return proc.stdout.strip()


def _repo(tmp_path: Path) -> tuple[Path, str, str]:
    root = tmp_path / "repo"
    root.mkdir()
    _git(root, "init")
    _git(root, "config", "user.email", "omega@example.invalid")
    _git(root, "config", "user.name", "OMEGA Test")
    target = root / "omega_runtime" / "sample.py"
    target.parent.mkdir(parents=True)
    before = "VALUE = 1\n"
    target.write_text(before, encoding="utf-8")
    _git(root, "add", ".")
    _git(root, "commit", "-m", "base")
    return root, _git(root, "rev-parse", "HEAD"), before


def test_r187_build_validate_materialize_apply_and_rollback(tmp_path: Path):
    root, head, before = _repo(tmp_path)
    after = "VALUE = 2\n"
    patch = build_source_patch_r187(
        predecessor_git_sha=head,
        objective="Advance the bounded runtime without deleting predecessor capability.",
        source_evidence_sha256="a" * 64,
        continuation={"state": "CONTINUE_SELF_DEVELOPMENT"},
        changes=[{
            "path": "omega_runtime/sample.py",
            "beforeSha256": _sha(before),
            "content": after,
        }],
    )
    assert validate_source_patch_r187(patch)["patchSha256"] == patch["patchSha256"]
    materialized = materialize_source_patch_r187(root, patch)
    assert materialized["sourceMutation"] is False
    receipt = apply_source_patch_r187(root, patch)
    assert receipt["schema"] == PATCH_APPLY_RECEIPT_SCHEMA_R187
    assert (root / "omega_runtime" / "sample.py").read_text(encoding="utf-8") == after
    rollback = rollback_source_patch_r187(root, patch)
    assert rollback["schema"] == PATCH_ROLLBACK_RECEIPT_SCHEMA_R187
    assert (root / "omega_runtime" / "sample.py").read_text(encoding="utf-8") == before
    assert _git(root, "rev-parse", "HEAD") == head


def test_r187_rejects_protected_and_traversal_paths():
    common = dict(
        predecessor_git_sha="b" * 40,
        objective="test",
        source_evidence_sha256="c" * 64,
    )
    with pytest.raises(SourcePatchError):
        build_source_patch_r187(**common, changes=[{"path": "cloudflare/omega-v6-worker/wrangler.toml", "beforeSha256": "d" * 64, "content": "x"}])
    with pytest.raises(SourcePatchError):
        build_source_patch_r187(**common, changes=[{"path": "omega_runtime/../.github/workflows/x.yml", "beforeSha256": "d" * 64, "content": "x"}])


def test_r187_rejects_tampered_capsule():
    patch = build_source_patch_r187(
        predecessor_git_sha="e" * 40,
        objective="test",
        source_evidence_sha256="f" * 64,
        changes=[{"path": "omega_runtime/a.py", "beforeAbsent": True, "content": "X = 1\n"}],
    )
    patch["changes"][0]["content"] = "X = 2\n"
    with pytest.raises(SourcePatchError):
        validate_source_patch_r187(patch)
