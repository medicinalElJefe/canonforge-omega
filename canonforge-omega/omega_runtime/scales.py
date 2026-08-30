from __future__ import annotations

from dataclasses import dataclass
from .state import Address20736


@dataclass(frozen=True, slots=True)
class Address144:
    regulation: int
    layer: int

    def __post_init__(self) -> None:
        if not 1 <= self.regulation <= 12 or not 1 <= self.layer <= 12:
            raise ValueError("regulation/layer must be in 1..12")

    @property
    def index(self) -> int:
        return (self.regulation - 1) * 12 + self.layer - 1

    @classmethod
    def from_index(cls, index: int) -> "Address144":
        if not 0 <= index < 144:
            raise ValueError("index must be in 0..143")
        r, l = divmod(index, 12)
        return cls(r + 1, l + 1)


@dataclass(frozen=True, slots=True)
class Address1728:
    phase: int
    regulation: int
    layer: int

    def __post_init__(self) -> None:
        if any(not 1 <= value <= 12 for value in (self.phase, self.regulation, self.layer)):
            raise ValueError("phase/regulation/layer must be in 1..12")

    @property
    def index(self) -> int:
        return ((self.phase - 1) * 12 + (self.regulation - 1)) * 12 + self.layer - 1

    @classmethod
    def from_index(cls, index: int) -> "Address1728":
        if not 0 <= index < 1728:
            raise ValueError("index must be in 0..1727")
        p, rem = divmod(index, 144)
        r, l = divmod(rem, 12)
        return cls(p + 1, r + 1, l + 1)


def project_20736_to_1728(address: Address20736) -> tuple[int, Address1728]:
    return address.domain, Address1728(address.phase, address.regulation, address.layer)


def expand_1728(domain: int, address: Address1728) -> Address20736:
    return Address20736(domain, address.phase, address.regulation, address.layer)


def project_1728_to_144(address: Address1728) -> tuple[int, Address144]:
    return address.phase, Address144(address.regulation, address.layer)
