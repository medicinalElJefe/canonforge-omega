"""
Event Queue & Time Evolution for CanonForge Omega.
"""

from __future__ import annotations

from typing import Any, Dict, List, Tuple


class EventQueue:
    def __init__(self, max_events: int = 500):
        self.max_events = max_events
        self.events: List[Dict[str, Any]] = []

    def tick(self, t: int, state: List[float], metrics: Dict) -> Tuple[List[float], List[Dict[str, Any]]]:
        event = {
            "t": t,
            "coherence": metrics.get("coherence"),
            "max_abs": metrics.get("max_abs"),
            "variance": metrics.get("variance"),
        }
        self.events.append(event)
        if len(self.events) > self.max_events:
            self.events = self.events[-self.max_events :]
        return state, [event]

    def get_events(self) -> List[Dict[str, Any]]:
        return list(self.events)
