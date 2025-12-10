"""
SequenceStore · JSON-backed pattern storage for CanonForge Omega.

Default file: ~/.omega_fusion/sequences.json

Structure:

{
  "patterns": [
    {"id": "S_ECFR", "name": "Evening CanonForge Focus Ritual", "steps": [...]},
    ...
  ]
}
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional


DEFAULT_STORE_PATH = Path(os.path.expanduser("~/.omega_fusion/sequences.json"))


@dataclass
class SequenceMeta:
    id: str
    name: str | None = None
    tags: List[str] | None = None


class SequenceStore:
    def __init__(self, path: Path | None = None):
        self.path = path or DEFAULT_STORE_PATH
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._loaded = False

    def _load(self) -> None:
        if self._loaded:
            return
        if not self.path.exists():
            self._cache = {}
            self._loaded = True
            return
        try:
            with self.path.open("r", encoding="utf-8") as f:
                raw = json.load(f)
        except Exception:
            raw = {}
        patterns = raw.get("patterns", [])
        self._cache = {p.get("id"): p for p in patterns if "id" in p}
        self._loaded = True

    def list_sequences(self) -> List[SequenceMeta]:
        self._load()
        out: List[SequenceMeta] = []
        for sid, p in sorted(self._cache.items()):
            out.append(
                SequenceMeta(
                    id=sid,
                    name=p.get("name"),
                    tags=p.get("tags") or [],
                )
            )
        return out

    def get_sequence(self, seq_id: str) -> Optional[Dict[str, Any]]:
        self._load()
        return self._cache.get(seq_id)
