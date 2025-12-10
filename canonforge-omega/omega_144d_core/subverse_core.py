"""
SubverseCore · builds 188-style overlay: per-domain, per-axis, and globals.
"""

from __future__ import annotations

from typing import Dict, List


class SubverseCore:
    def __init__(self, n_domains: int = 12, domain_size: int = 12):
        self.n_domains = n_domains
        self.domain_size = domain_size

    def expand(self, state: List[float], metrics: Dict) -> Dict:
        domains = []
        axes = []
        # domains: rows
        idx = 0
        for _ in range(self.n_domains):
            row_vals = state[idx : idx + self.domain_size]
            idx += self.domain_size
            domains.append(sum(row_vals) / max(len(row_vals), 1))
        # axes: columns
        for col in range(self.domain_size):
            col_vals = [state[row * self.domain_size + col] for row in range(self.n_domains)]
            axes.append(sum(col_vals) / max(len(col_vals), 1))
        overlay = {
            "domains": domains,
            "axes": axes,
            "global": {
                "coherence": metrics.get("coherence"),
                "max_abs": metrics.get("max_abs"),
                "variance": metrics.get("variance"),
            },
        }
        return overlay
