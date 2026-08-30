from __future__ import annotations

from hashlib import sha256
import json
from pathlib import Path
from typing import Any


def sha256_file(path: Path) -> str:
    h = sha256()
    with Path(path).open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def _read_sums(path: Path) -> tuple[dict[str, str], list[str]]:
    rows: dict[str, str] = {}
    errors: list[str] = []
    for line_no, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        try:
            digest, rel = line.split("  ", 1)
        except ValueError:
            errors.append(f"invalid SHA256SUMS line {line_no}")
            continue
        if len(digest) != 64 or any(ch not in "0123456789abcdef" for ch in digest.lower()):
            errors.append(f"invalid SHA-256 on line {line_no}")
            continue
        if rel in rows:
            errors.append(f"duplicate SHA256SUMS path: {rel}")
            continue
        rows[rel] = digest.lower()
    return rows, errors


def verify_manifest(root: Path, manifest_path: Path | None = None) -> dict[str, Any]:
    root = Path(root).resolve()
    manifest_path = Path(manifest_path or root / "omega.manifest.json")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    errors: list[str] = []
    checked = 0
    expected_sums: dict[str, str] = {}

    for row in manifest.get("files", []):
        rel = row.get("path")
        if not rel:
            errors.append("manifest row missing path")
            continue
        if rel in expected_sums:
            errors.append(f"duplicate manifest path: {rel}")
            continue
        p = (root / rel).resolve()
        if root != p and root not in p.parents:
            errors.append(f"path escapes root: {rel}")
            continue
        if not p.is_file():
            errors.append(f"missing: {rel}")
            continue
        checked += 1
        actual = sha256_file(p)
        expected = str(row.get("sha256", "")).lower()
        expected_sums[rel] = expected
        if actual != expected:
            errors.append(f"hash mismatch: {rel}")
        if p.stat().st_size != int(row.get("bytes", -1)):
            errors.append(f"size mismatch: {rel}")

    expected_sums["omega.manifest.json"] = sha256_file(manifest_path)
    sums_path = root / "SHA256SUMS.txt"
    if not sums_path.is_file():
        errors.append("missing: SHA256SUMS.txt")
        actual_sums = {}
    else:
        actual_sums, sum_errors = _read_sums(sums_path)
        errors.extend(sum_errors)

    if actual_sums != expected_sums:
        missing = sorted(set(expected_sums) - set(actual_sums))
        extra = sorted(set(actual_sums) - set(expected_sums))
        changed = sorted(k for k in set(actual_sums) & set(expected_sums) if actual_sums[k] != expected_sums[k])
        if missing:
            errors.append("SHA256SUMS missing: " + ", ".join(missing))
        if extra:
            errors.append("SHA256SUMS extra: " + ", ".join(extra))
        if changed:
            errors.append("SHA256SUMS mismatch: " + ", ".join(changed))

    return {
        "status": "PASS" if not errors else "FAIL",
        "files": len(manifest.get("files", [])),
        "checked": checked,
        "sha256_entries": len(actual_sums),
        "errors": errors,
    }


def hash_tree(root: Path, *, max_files: int = 25000) -> dict[str, Any]:
    root = Path(root).resolve()
    rows = []
    for i, p in enumerate(sorted(x for x in root.rglob("*") if x.is_file())):
        if i >= max_files:
            raise ValueError(f"tree exceeds max_files={max_files}")
        rel = str(p.relative_to(root)).replace("\\", "/")
        rows.append({"path": rel, "size": p.stat().st_size, "sha256": sha256_file(p)})
    fingerprint = sha256(json.dumps(rows, sort_keys=True, separators=(",", ":")).encode("utf-8")).hexdigest()
    return {"root": str(root), "files": len(rows), "fingerprint": fingerprint, "entries": rows}
