from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any


class BridgeAction(str, Enum):
    INDEX = "INDEX"
    READ = "READ"
    SEARCH = "SEARCH"
    HASH = "HASH"
    SAFE_IMPORT = "SAFE_IMPORT"
    WORKBOOK_AUDIT = "WORKBOOK_AUDIT"
    BUILD = "BUILD"
    TEST = "TEST"
    APPLY_PATCH = "APPLY_PATCH"
    TRAIN_LOCAL = "TRAIN_LOCAL"


@dataclass(frozen=True, slots=True)
class BridgeStep:
    action: BridgeAction
    relative_path: str = "."
    args: dict[str, Any] = field(default_factory=dict)

    def validate(self) -> None:
        p = Path(self.relative_path)
        if p.is_absolute() or ".." in p.parts:
            raise ValueError("bridge paths must stay relative to the approved root")


@dataclass(frozen=True, slots=True)
class BridgePlan:
    plan_id: str
    steps: tuple[BridgeStep, ...]
    confirmed: bool = False

    def validate_for_execution(self) -> None:
        if not self.confirmed:
            raise PermissionError("mutating/host execution requires explicit confirmation")
        if not self.steps:
            raise ValueError("plan must contain at least one step")
        for step in self.steps:
            step.validate()
