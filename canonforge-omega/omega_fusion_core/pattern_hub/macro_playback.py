"""
Macro playback engine for CanonForge Omega.

Iterates over pattern steps and:
- logs each step into the fusion event stream via fusion_ingest_fn
- delegates execution to a MacroExecutor backed by HostMuscles
"""

from __future__ import annotations

import time
from typing import Any, Callable, Dict, List


class MacroPlayer:
    def __init__(
        self,
        fusion_ingest_fn: Callable[[Dict[str, Any]], None],
        executor: "MacroExecutor",
    ):
        self.fusion_ingest_fn = fusion_ingest_fn
        self.executor = executor

    def play(self, sequence: Dict[str, Any], speed: float = 1.0, loop_repeats: int = 1):
        if not sequence:
            return
        steps: List[Dict[str, Any]] = sequence.get("steps") or []
        meta = {
            "id": sequence.get("id"),
            "name": sequence.get("name"),
            "tags": sequence.get("tags") or [],
        }
        loops = max(1, int(loop_repeats))
        for loop_idx in range(loops):
            for idx, step in enumerate(steps):
                event = {
                    "type": "PATTERN_STEP",
                    "pattern_id": meta["id"],
                    "pattern_name": meta["name"],
                    "loop_index": loop_idx,
                    "step_index": idx,
                    "step": step,
                    "timestamp": time.time(),
                }
                self.fusion_ingest_fn(event)
                self.executor.execute_step(step, speed=speed)
                delay = float(step.get("delay", 0)) / max(speed, 0.01)
                if delay > 0:
                    time.sleep(delay)
