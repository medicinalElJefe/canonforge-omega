from __future__ import annotations

from dataclasses import dataclass
from math import cos, sin, radians
from .state import Address20736
from .atlas import opposite_address


@dataclass(frozen=True, slots=True)
class ObserverFrame:
    observer_id: str = "canonical"
    phase_offset: int = 0
    scale: float = 1.0
    rotation_deg: float = 0.0
    time_basis: str = "TRANSITION_INDEX"

    def __post_init__(self) -> None:
        if self.scale <= 0:
            raise ValueError("scale must be > 0")


def phase_transform(address: Address20736, frame: ObserverFrame) -> Address20736:
    phase = ((address.phase - 1 + frame.phase_offset) % 12) + 1
    return Address20736(address.domain, phase, address.regulation, address.layer)


def outverse_inverse(address: Address20736) -> tuple[Address20736, Address20736]:
    return address, opposite_address(address)


def rotate_shell_axes(axes: tuple[float, float, float], frame: ObserverFrame) -> tuple[float, float, float]:
    theta = radians(frame.rotation_deg)
    u1, u2, u3 = axes
    return ((u1 * cos(theta) - u2 * sin(theta)) * frame.scale,
            (u1 * sin(theta) + u2 * cos(theta)) * frame.scale,
            u3 * frame.scale)
