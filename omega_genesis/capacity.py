from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

from .schema import Address20736

BASE = 12
CAPACITY_12 = 12
CAPACITY_144 = 12 ** 2
CAPACITY_1728 = 12 ** 3
CAPACITY_20736 = 12 ** 4
CAPACITY_145152 = 7 * CAPACITY_20736
CAPACITY_61917364224 = 12 ** 10

CAPACITY_TIERS = {
    "12D": CAPACITY_12,
    "144D": CAPACITY_144,
    "1728D": CAPACITY_1728,
    "20736D": CAPACITY_20736,
    "145152D": CAPACITY_145152,
    "61917364224D": CAPACITY_61917364224,
}


def _digit(value: int) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or not 1 <= value <= BASE:
        raise ValueError("base-12 coordinates must be integers in 1..12")
    return value


@dataclass(frozen=True, slots=True)
class CapacityAddress61917364224:
    """Reversible 12^10 software-design address. It is not a physical dimension."""

    coordinates: tuple[int, int, int, int, int, int, int, int, int, int]

    def __post_init__(self) -> None:
        if len(self.coordinates) != 10:
            raise ValueError("capacity address requires exactly 10 base-12 coordinates")
        object.__setattr__(self, "coordinates", tuple(_digit(v) for v in self.coordinates))

    @property
    def index0(self) -> int:
        value = 0
        for digit in self.coordinates:
            value = value * BASE + (digit - 1)
        return value

    @property
    def state_id(self) -> int:
        return self.index0 + 1

    @property
    def compact(self) -> str:
        return "Ω12:" + ".".join(f"{v:02d}" for v in self.coordinates)

    @classmethod
    def from_index0(cls, index: int) -> "CapacityAddress61917364224":
        if isinstance(index, bool) or not isinstance(index, int) or not 0 <= index < CAPACITY_61917364224:
            raise ValueError(f"index must be in 0..{CAPACITY_61917364224 - 1}")
        digits = [0] * 10
        n = index
        for pos in range(9, -1, -1):
            n, rem = divmod(n, BASE)
            digits[pos] = rem + 1
        return cls(tuple(digits))

    @classmethod
    def from_state_id(cls, state_id: int) -> "CapacityAddress61917364224":
        if isinstance(state_id, bool) or not isinstance(state_id, int):
            raise ValueError("state_id must be an integer")
        return cls.from_index0(state_id - 1)

    @classmethod
    def from_coordinates(cls, values: Iterable[int]) -> "CapacityAddress61917364224":
        return cls(tuple(values))  # type: ignore[arg-type]


@dataclass(frozen=True, slots=True)
class StarAddress145152:
    """Seven-host layer over one 20,736 software address."""

    star: int
    address: Address20736

    def __post_init__(self) -> None:
        if isinstance(self.star, bool) or not isinstance(self.star, int) or not 1 <= self.star <= 7:
            raise ValueError("star must be an integer in 1..7")

    @property
    def index0(self) -> int:
        return (self.star - 1) * CAPACITY_20736 + self.address.index0

    @property
    def state_id(self) -> int:
        return self.index0 + 1

    @classmethod
    def from_index0(cls, index: int) -> "StarAddress145152":
        if isinstance(index, bool) or not isinstance(index, int) or not 0 <= index < CAPACITY_145152:
            raise ValueError(f"index must be in 0..{CAPACITY_145152 - 1}")
        star0, inner = divmod(index, CAPACITY_20736)
        return cls(star0 + 1, Address20736.from_index0(inner))


def capacity_packet(index0: int) -> dict[str, object]:
    address = CapacityAddress61917364224.from_index0(index0)
    canonical_index = index0 % CAPACITY_20736
    canonical = Address20736.from_index0(canonical_index)
    return {
        "index0": address.index0,
        "state_id": address.state_id,
        "capacity": CAPACITY_61917364224,
        "factorization": "12^10 = 2^20 × 3^10",
        "coordinates": address.coordinates,
        "compact": address.compact,
        "canonical_projection": {
            "index0": canonical.index0,
            "state_id": canonical.state_id,
            "address": canonical.as_tuple(),
        },
        "boundary": "software design/instrumentation capacity; not a physical dimension and not an enumerated worksheet",
    }
