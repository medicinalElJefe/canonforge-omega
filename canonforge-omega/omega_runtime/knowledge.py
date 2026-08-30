from __future__ import annotations

from dataclasses import dataclass
import re
from typing import Iterable

_TOKEN = re.compile(r"[A-Za-z0-9_+.-]+")


@dataclass(frozen=True, slots=True)
class KnowledgeRecord:
    record_id: str
    text: str
    source_id: str
    source_hash: str = ""
    evidence_class: str = "IMPORTED"
    tags: tuple[str, ...] = ()


@dataclass(frozen=True, slots=True)
class KnowledgeHit:
    record: KnowledgeRecord
    score: float
    matched_terms: tuple[str, ...]


class KnowledgeIndex:
    """Deterministic native retrieval index for accepted OMEGA corpus material.

    This is intentionally not represented as model-weight training. It provides
    a sovereign baseline that can later coexist with embeddings or actual local
    checkpoints when those artifacts are explicitly present and verified.
    """

    def __init__(self) -> None:
        self._records: dict[str, KnowledgeRecord] = {}

    @staticmethod
    def _terms(text: str) -> set[str]:
        return {m.group(0).lower() for m in _TOKEN.finditer(text)}

    def add(self, records: Iterable[KnowledgeRecord]) -> None:
        for record in records:
            self._records[record.record_id] = record

    def search(self, query: str, limit: int = 10) -> tuple[KnowledgeHit, ...]:
        q = self._terms(query)
        if not q:
            return ()
        hits: list[KnowledgeHit] = []
        for record in self._records.values():
            terms = self._terms(record.text + " " + " ".join(record.tags))
            matched = q & terms
            if not matched:
                continue
            union = q | terms
            score = len(matched) / max(1, len(q)) + 0.25 * (len(matched) / max(1, len(union)))
            hits.append(KnowledgeHit(record, score, tuple(sorted(matched))))
        hits.sort(key=lambda hit: (-hit.score, hit.record.record_id))
        return tuple(hits[:max(1, min(limit, 100))])

    @property
    def size(self) -> int:
        return len(self._records)
