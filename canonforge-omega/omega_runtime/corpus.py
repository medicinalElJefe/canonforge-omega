from __future__ import annotations

from dataclasses import dataclass
from hashlib import sha256
from pathlib import Path
from typing import Iterable


@dataclass(frozen=True, slots=True)
class CorpusSource:
    source_id: str
    name: str
    sha256: str
    bytes: int
    evidence_class: str
    schema_hint: str = ""


def manifest_file(path: str | Path, *, source_id: str, evidence_class: str = "IMPORTED", schema_hint: str = "") -> CorpusSource:
    p = Path(path)
    h = sha256()
    size = 0
    with p.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            size += len(chunk)
            h.update(chunk)
    return CorpusSource(source_id, p.name, h.hexdigest(), size, evidence_class, schema_hint)


def dedupe_sources(sources: Iterable[CorpusSource]) -> tuple[CorpusSource, ...]:
    seen: set[str] = set()
    out: list[CorpusSource] = []
    for source in sources:
        if source.sha256 in seen:
            continue
        seen.add(source.sha256)
        out.append(source)
    return tuple(out)
