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


def verify_manifest(root: Path, manifest_path: Path | None = None) -> dict[str, Any]:
    root = Path(root).resolve()
    manifest_path = Path(manifest_path or root / "omega.manifest.json")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    errors: list[str] = []
    checked = 0
    for row in manifest.get("files", []):
        rel = row.get("path")
        if not rel:
            errors.append("manifest row missing path")
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
        if actual != row.get("sha256"):
            errors.append(f"hash mismatch: {rel}")
    return {"status": "PASS" if not errors else "FAIL", "files": len(manifest.get("files", [])), "checked": checked, "errors": errors}


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
