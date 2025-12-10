"""
MacroExecutor · translates pattern steps into HostMuscles calls.
"""

from __future__ import annotations

from typing import Any, Dict

from .muscles import HostMuscles


class MacroExecutor:
    def __init__(self, muscles: HostMuscles):
        self.muscles = muscles

    def execute_step(self, step: Dict[str, Any], speed: float = 1.0):
        kind = step.get("kind") or step.get("type") or "LOG"
        payload = step.get("payload") or {}

        if kind == "OPEN_APP":
            self.muscles.open_app(payload.get("name", ""))
        elif kind == "FOCUS":
            self.muscles.focus_window(payload.get("title", ""))
        elif kind == "TYPE":
            self.muscles.type_text(payload.get("text", ""))
        elif kind == "CLICK":
            self.muscles.click(payload.get("target", ""))
        else:
            self.muscles.custom_action({"kind": kind, "payload": payload})
