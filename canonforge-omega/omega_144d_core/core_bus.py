"""
CoreBus · merges internal Ω-state and external vector for CanonForge Omega.
"""

from __future__ import annotations

from typing import List, Optional


class CoreBus:
    def route(self, state: List[float], ext: Optional[List[float]] = None) -> List[float]:
        if ext is None:
            return state[:]
        return [(a + b) / 2.0 for a, b in zip(state, ext)]
