from __future__ import annotations

from dataclasses import dataclass, asdict
from hashlib import sha256
from pathlib import Path, PurePosixPath
from zipfile import ZipFile, BadZipFile
import json
from typing import Iterable


@dataclass(frozen=True, slots=True)
class DonorFile:
    path: str
    size: int
    compressed_size: int
    sha256: str | None
    executable_candidate: bool


@dataclass(frozen=True, slots=True)
class DonorManifest:
    archive: str
    archive_sha256: str
    archive_bytes: int
    file_count: int
    suspicious_paths: tuple[str, ...]
    executable_candidates: tuple[str, ...]
    files: tuple[DonorFile, ...]
    admission: str
    reason: str


def _hash_file(path: Path) -> str:
    h = sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def inspect_zip(path: str | Path, *, hash_members_under_bytes: int = 2_000_000) -> DonorManifest:
    """Inventory a donor ZIP without executing or extracting it.

    Archive members with absolute/parent-traversal paths cause QUARANTINE. Small
    members are hashed in-memory so donor lineage can be compared without
    launching historical code.
    """
    p = Path(path)
    archive_hash = _hash_file(p)
    suspicious: list[str] = []
    executables: list[str] = []
    files: list[DonorFile] = []
    executable_ext = {".exe", ".dll", ".bat", ".cmd", ".ps1", ".sh", ".js", ".py", ".jar", ".msi"}
    try:
        with ZipFile(p) as zf:
            for info in zf.infolist():
                if info.is_dir():
                    continue
                posix = PurePosixPath(info.filename.replace("\\", "/"))
                if posix.is_absolute() or ".." in posix.parts:
                    suspicious.append(info.filename)
                is_exec = posix.suffix.lower() in executable_ext
                if is_exec:
                    executables.append(info.filename)
                member_hash = None
                if info.file_size <= hash_members_under_bytes:
                    member_hash = sha256(zf.read(info)).hexdigest()
                files.append(DonorFile(info.filename, info.file_size, info.compress_size, member_hash, is_exec))
    except BadZipFile as exc:
        return DonorManifest(p.name, archive_hash, p.stat().st_size, 0, (), (), (), "REJECT", f"invalid zip: {exc}")
    admission = "QUARANTINE" if suspicious else "INSPECTED_NO_EXECUTION"
    reason = "unsafe archive paths detected" if suspicious else "safe path inventory only; capability admission still requires source/test review"
    return DonorManifest(p.name, archive_hash, p.stat().st_size, len(files), tuple(suspicious), tuple(executables), tuple(files), admission, reason)


def write_manifest(manifest: DonorManifest, output: str | Path) -> None:
    Path(output).write_text(json.dumps(asdict(manifest), indent=2, sort_keys=True), encoding="utf-8")
