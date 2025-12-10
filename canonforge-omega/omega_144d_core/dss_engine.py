"""
Deep System Symmetry (DSS) Engine · CanonForge Omega

- Reshapes 144D vector into 12×12 grid.
- Each cell interacts with its row/column average.
- Damping prevents runaway growth.
- Coherence = inverse normalized variance in [0, 1].
"""

from __future__ import annotations

from typing import Dict, List, Tuple


class DSSEngine:
    def __init__(
        self,
        n_domains: int = 12,
        domain_size: int = 12,
        coupling: float = 0.18,
        damping: float = 0.04,
    ):
        self.n_domains = n_domains
        self.domain_size = domain_size
        self.dim = n_domains * domain_size
        self.coupling = float(coupling)
        self.damping = float(damping)

    def _to_matrix(self, vec: List[float]) -> List[List[float]]:
        m = []
        idx = 0
        for _ in range(self.n_domains):
            row = []
            for _ in range(self.domain_size):
                row.append(float(vec[idx]))
                idx += 1
            m.append(row)
        return m

    def _to_vector(self, mat: List[List[float]]) -> List[float]:
        return [x for row in mat for x in row]

    def _variance(self, v: List[float]) -> float:
        n = len(v)
        if n == 0:
            return 0.0
        mean = sum(v) / n
        return sum((x - mean) ** 2 for x in v) / n

    def compute(self, state: List[float]) -> Tuple[List[float], Dict]:
        if len(state) != self.dim:
            raise ValueError(f"Expected {self.dim} elements, got {len(state)}")
        mat = self._to_matrix(state)
        row_means = [sum(row) / self.domain_size for row in mat]
        col_means = [
            sum(mat[i][j] for i in range(self.n_domains)) / self.n_domains
            for j in range(self.domain_size)
        ]
        new_mat: List[List[float]] = []
        for i in range(self.n_domains):
            new_row: List[float] = []
            for j in range(self.domain_size):
                x = mat[i][j]
                neighborhood = 0.5 * (row_means[i] + col_means[j])
                updated = (1.0 - self.damping) * x + self.coupling * neighborhood
                new_row.append(updated)
            new_mat.append(new_row)
        new_vec = self._to_vector(new_mat)
        max_abs = max((abs(x) for x in new_vec), default=0.0)
        var = self._variance(new_vec)
        if max_abs == 0:
            coherence = 1.0
        else:
            norm_var = var / (max_abs**2 + 1e-9)
            coherence = 1.0 / (1.0 + norm_var)
            coherence = max(0.0, min(1.0, coherence))
        metrics = {
            "coherence": coherence,
            "row_means": row_means,
            "col_means": col_means,
            "max_abs": max_abs,
            "variance": var,
        }
        return new_vec, metrics
