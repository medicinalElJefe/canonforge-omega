from __future__ import annotations

from dataclasses import dataclass
from math import cos, exp, sin
from typing import Callable

from .state import MotionState


@dataclass(frozen=True, slots=True)
class MotionParameters:
    beta: float = 0.05
    omega0: float = 1.0
    gamma: float = 0.01
    rho_q: float = 0.95
    sigma_q: float = 0.05

    def __post_init__(self) -> None:
        if self.beta < 0 or self.omega0 <= 0 or self.gamma < 0:
            raise ValueError("beta/gamma must be >= 0 and omega0 must be > 0")
        if not 0 <= self.rho_q <= 1:
            raise ValueError("rho_q must be in [0,1]")


def step_motion(
    state: MotionState,
    h: float,
    params: MotionParameters = MotionParameters(),
    *,
    curvature_response: Callable[[float], float] = lambda x: x,
) -> MotionState:
    """Advance the recovered Mode-188 oscillator/ledger equations one step.

    The source corpus did not uniquely specify the Φ response function used in
    the q update, so it is an explicit callback rather than a silently invented
    law. Default is identity for a deterministic reference implementation.
    """
    if h <= 0:
        raise ValueError("h must be > 0")
    b, w, g, rho, sigma = params.beta, params.omega0, params.gamma, params.rho_q, params.sigma_q
    old_v = float(state.v)
    vp = exp(-2.0 * b * h) * old_v
    wh = w * h
    next_a = cos(wh) * state.a + (sin(wh) / w) * vp
    next_v = -w * sin(wh) * state.a + cos(wh) * vp
    next_c = (w ** 2) * next_a
    next_ledger = state.ledger + g * (old_v ** 2) * h
    next_q = rho * state.q + sigma * float(curvature_response(-2.0 * b * old_v))
    return MotionState(a=next_a, v=next_v, c=next_c, q=next_q, ledger=next_ledger)
