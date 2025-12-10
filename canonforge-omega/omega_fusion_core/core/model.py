from __future__ import annotations
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List
from datetime import datetime


class Domain(str, Enum):
    GENERIC = "GENERIC"
    EMAIL_OS = "EMAIL_OS"
    OS_APP = "OS_APP"
    REPORT_SECTION = "REPORT_SECTION"


class StateKind(str, Enum):
    COGNITIVE = "COGNITIVE"
    EMOTIONAL = "EMOTIONAL"
    RELATIONAL = "RELATIONAL"
    SOMATIC = "SOMATIC"
    SPIRITUAL = "SPIRITUAL"


class RoleKind(str, Enum):
    DRIVER = "DRIVER"
    OBSERVER = "OBSERVER"
    STEWARD = "STEWARD"
    MESSENGER = "MESSENGER"
    ARCHITECT = "ARCHITECT"
    GUARDIAN = "GUARDIAN"
    HEALER = "HEALER"


class Channel(str, Enum):
    INNER = "INNER"
    OUTER = "OUTER"
    FUSION = "FUSION"
    DOMAIN = "DOMAIN"


@dataclass
class OmegaPacket:
    """Universal event atom for the Omega Fusion OS."""
    timestamp: datetime | None
    domain: Domain
    state: StateKind
    role: RoleKind
    channel: Channel
    tags: List[str] = field(default_factory=list)
    payload: Dict[str, Any] = field(default_factory=dict)
