"""
CanonForge Omega · 144D Core Engine

High-level façade over the Deep System Symmetry (DSS) engine.
"""

from __future__ import annotations

from typing import Dict, List, Optional

from .dss_engine import DSSEngine
from .event_queue import EventQueue
from .core_bus import CoreBus
from .subverse_core import SubverseCore


class Omega144Core:
    def __init__(self, n_domains: int = 12, domain_size: int = 12):
        self.n_domains = n_domains
        self.domain_size = domain_size
        self.dim = n_domains * domain_size

        self.dss = DSSEngine(n_domains=n_domains, domain_size=domain_size)
        self.event_queue = EventQueue()
        self.bus = CoreBus()
        self.subverse = SubverseCore(n_domains=n_domains, domain_size=domain_size)

        self.state: List[float] = [0.0] * self.dim
        self.t: int = 0

    def _to_vector(self, vec: Optional[List[float]]) -> List[float]:
        if vec is None:
            return self.state[:]
        v = [float(x) for x in vec]
        if len(v) < self.dim:
            v = v + [0.0] * (self.dim - len(v))
        elif len(v) > self.dim:
            v = v[: self.dim]
        return v

    def initialize(self, initial_vector):
        self.state = self._to_vector(initial_vector)
        self.t = 0

    def classify_regime(self, coherence: float) -> str:
        if coherence >= 0.80:
            return "COHERENT"
        if coherence >= 0.60:
            return "STABILIZING"
        if coherence >= 0.40:
            return "DRIFT"
        return "CHAOTIC"

    def step(self, input_vector=None, tag: str | None = None):
        ext = self._to_vector(input_vector) if input_vector is not None else None
        merged = self.bus.route(self.state, ext)
        dss_state, dss_metrics = self.dss.compute(merged)
        self.t += 1
        event_state, triggered = self.event_queue.tick(self.t, dss_state, dss_metrics)
        overlay = self.subverse.expand(event_state, dss_metrics)

        self.state = event_state
        coherence = dss_metrics.get("coherence", 0.0)
        regime = self.classify_regime(coherence)

        return {
            "t": self.t,
            "tag": tag,
            "state": self.state[:],
            "coherence": coherence,
            "regime": regime,
            "metrics": dss_metrics,
            "events": triggered,
            "overlay": overlay,
        }
