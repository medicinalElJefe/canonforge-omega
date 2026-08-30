from __future__ import annotations

from .state import Address20736


def ping_next(address: Address20736) -> Address20736:
    return Address20736.from_index((address.index + 1) % 20736)


def ping_prev(address: Address20736) -> Address20736:
    return Address20736.from_index((address.index - 1) % 20736)


def opposite_address(address: Address20736) -> Address20736:
    def mirror(v: int) -> int:
        return ((v - 1 + 6) % 12) + 1
    return Address20736(mirror(address.domain), mirror(address.phase), mirror(address.regulation), mirror(address.layer))


def phase_portal(address: Address20736) -> tuple[Address20736, ...]:
    return tuple(Address20736(address.domain, address.phase, r, l) for r in range(1, 13) for l in range(1, 13))


def domain_portal(domain: int) -> tuple[Address20736, ...]:
    if not 1 <= domain <= 12:
        raise ValueError("domain must be in 1..12")
    return tuple(Address20736(domain, p, r, l) for p in range(1, 13) for r in range(1, 13) for l in range(1, 13))
