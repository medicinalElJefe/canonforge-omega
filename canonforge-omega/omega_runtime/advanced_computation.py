from __future__ import annotations

from dataclasses import asdict, dataclass
from hashlib import sha256
import cmath
import json
from math import isfinite, pi, sqrt
from typing import Iterable, Sequence

C_M_S = 299_792_458.0
COMPUTE_SCHEMA = "OMEGA_COMPUTATION_TRUTH_R170"
TRUTH_BOUNDARY = (
    "R170 implements explicit mathematical reference solvers. Results are DERIVED computation, "
    "not empirical observation. 12/144/1728/20736 are OMEGA address-resolution levels, not physical dimensions. "
    "The multilayer optical solver is normal-incidence transfer-matrix screening, not RCWA/FDTD/FEM or fabrication-grade validation."
)


def _finite(value: float, name: str) -> float:
    value = float(value)
    if not isfinite(value):
        raise ValueError(f"{name} must be finite")
    return value


def _vec3(values: Sequence[float], name: str) -> tuple[float, float, float]:
    if len(values) != 3:
        raise ValueError(f"{name} must contain exactly three values")
    return tuple(_finite(v, f"{name}[{i}]") for i, v in enumerate(values))  # type: ignore[return-value]


def _dot(a: Sequence[float], b: Sequence[float]) -> float:
    return sum(float(x) * float(y) for x, y in zip(a, b))


def _norm2(a: Sequence[float]) -> float:
    return _dot(a, a)


def _relative_residual(a: float, b: float) -> float:
    return abs(a - b) / max(1.0, abs(a), abs(b))


def digest_payload(value: object) -> str:
    raw = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return sha256(raw.encode("utf-8")).hexdigest()


@dataclass(frozen=True, slots=True)
class LorentzEventResult:
    t_seconds: float
    position_m: tuple[float, float, float]
    frame_velocity_m_s: tuple[float, float, float]
    gamma: float
    beta2: float
    transformed_t_seconds: float
    transformed_position_m: tuple[float, float, float]
    interval_before_m2: float
    interval_after_m2: float
    invariant_relative_residual: float
    evidence_class: str = "DERIVED"
    canonical_mutation: bool = False


@dataclass(frozen=True, slots=True)
class VelocityTransformResult:
    object_velocity_m_s: tuple[float, float, float]
    frame_velocity_m_s: tuple[float, float, float]
    transformed_velocity_m_s: tuple[float, float, float]
    transformed_speed_fraction_c: float
    gamma_frame: float
    evidence_class: str = "DERIVED"
    canonical_mutation: bool = False


@dataclass(frozen=True, slots=True)
class OpticalLayer:
    n: float
    k: float
    thickness_nm: float

    def __post_init__(self) -> None:
        if _finite(self.n, "n") <= 0:
            raise ValueError("layer n must be > 0")
        if _finite(self.k, "k") < 0:
            raise ValueError("layer k must be >= 0 for a passive medium")
        if _finite(self.thickness_nm, "thickness_nm") < 0:
            raise ValueError("layer thickness_nm must be >= 0")

    @property
    def complex_index(self) -> complex:
        # exp(-i omega t) convention: n_tilde = n - i*k gives positive attenuation.
        return complex(self.n, -self.k)


@dataclass(frozen=True, slots=True)
class OpticalTMMResult:
    wavelength_nm: float
    incident_n: float
    substrate_n: float
    reflectance: float
    transmittance: float
    absorptance: float
    raw_absorptance: float
    energy_balance: float
    energy_balance_residual: float
    layers: tuple[OpticalLayer, ...]
    solver: str = "NORMAL_INCIDENCE_TMM"
    solver_tier: str = "REDUCED_ORDER_SCREENING"
    evidence_class: str = "DERIVED"
    fabrication_grade: bool = False
    canonical_mutation: bool = False


@dataclass(frozen=True, slots=True)
class ContinuityResult:
    values_before: tuple[float, ...]
    values_after: tuple[float, ...]
    invariant_before: float
    invariant_after: float
    invariant_absolute_residual: float
    invariant_relative_residual: float
    min_after: float
    max_after: float
    operation: str
    evidence_class: str = "DERIVED"
    canonical_mutation: bool = False


@dataclass(frozen=True, slots=True)
class Wave1DResult:
    wave_speed: float
    dx: float
    dt: float
    cfl: float
    steps: int
    final_state: tuple[float, ...]
    snapshots: tuple[tuple[float, ...], ...]
    max_abs_amplitude: float
    solver: str = "SECOND_ORDER_SCALAR_WAVE_FDTD_1D"
    evidence_class: str = "DERIVED"
    maxwell_solver: bool = False
    canonical_mutation: bool = False


def minkowski_interval_sq(t_seconds: float, position_m: Sequence[float]) -> float:
    t = _finite(t_seconds, "t_seconds")
    r = _vec3(position_m, "position_m")
    return (C_M_S * t) ** 2 - _norm2(r)


def lorentz_boost_event(
    t_seconds: float,
    position_m: Sequence[float],
    frame_velocity_m_s: Sequence[float],
) -> LorentzEventResult:
    """Boost a spacetime event into a frame moving with velocity v.

    Uses metric signature (+---), SI units, and a general 3-vector Lorentz boost.
    The returned invariant residual is a direct numerical accuracy check.
    """
    t = _finite(t_seconds, "t_seconds")
    r = _vec3(position_m, "position_m")
    v = _vec3(frame_velocity_m_s, "frame_velocity_m_s")
    beta = tuple(x / C_M_S for x in v)
    beta2 = _norm2(beta)
    if beta2 >= 1.0:
        raise ValueError("frame speed must be strictly less than c")
    if beta2 == 0.0:
        gamma = 1.0
        tp, rp = t, r
    else:
        gamma = 1.0 / sqrt(1.0 - beta2)
        ct = C_M_S * t
        beta_dot_r = _dot(beta, r)
        ctp = gamma * (ct - beta_dot_r)
        factor = (gamma - 1.0) / beta2
        rp = tuple(
            r[i] + factor * beta_dot_r * beta[i] - gamma * beta[i] * ct
            for i in range(3)
        )
        tp = ctp / C_M_S
    before = (C_M_S * t) ** 2 - _norm2(r)
    after = (C_M_S * tp) ** 2 - _norm2(rp)
    return LorentzEventResult(
        t_seconds=t,
        position_m=r,
        frame_velocity_m_s=v,
        gamma=gamma,
        beta2=beta2,
        transformed_t_seconds=tp,
        transformed_position_m=rp,
        interval_before_m2=before,
        interval_after_m2=after,
        invariant_relative_residual=_relative_residual(before, after),
    )


def transform_velocity(
    object_velocity_m_s: Sequence[float],
    frame_velocity_m_s: Sequence[float],
) -> VelocityTransformResult:
    """Relativistic velocity transformation for an arbitrary boost direction."""
    u = _vec3(object_velocity_m_s, "object_velocity_m_s")
    v = _vec3(frame_velocity_m_s, "frame_velocity_m_s")
    if _norm2(u) >= C_M_S ** 2:
        raise ValueError("object speed must be strictly less than c")
    v2 = _norm2(v)
    if v2 >= C_M_S ** 2:
        raise ValueError("frame speed must be strictly less than c")
    if v2 == 0.0:
        transformed = u
        gamma = 1.0
    else:
        gamma = 1.0 / sqrt(1.0 - v2 / C_M_S ** 2)
        dot_uv = _dot(u, v)
        denominator = 1.0 - dot_uv / C_M_S ** 2
        if denominator <= 0.0:
            raise ValueError("velocity transform denominator is non-positive")
        u_parallel = tuple((dot_uv / v2) * x for x in v)
        u_perp = tuple(u[i] - u_parallel[i] for i in range(3))
        transformed = tuple(
            (u_parallel[i] - v[i] + u_perp[i] / gamma) / denominator
            for i in range(3)
        )
    speed_fraction = sqrt(_norm2(transformed)) / C_M_S
    if speed_fraction >= 1.0 + 1e-12:
        raise ArithmeticError("relativistic velocity transform exceeded c")
    return VelocityTransformResult(
        object_velocity_m_s=u,
        frame_velocity_m_s=v,
        transformed_velocity_m_s=transformed,
        transformed_speed_fraction_c=speed_fraction,
        gamma_frame=gamma,
    )


def _matmul2(a: tuple[tuple[complex, complex], tuple[complex, complex]],
             b: tuple[tuple[complex, complex], tuple[complex, complex]]) -> tuple[tuple[complex, complex], tuple[complex, complex]]:
    return (
        (a[0][0] * b[0][0] + a[0][1] * b[1][0], a[0][0] * b[0][1] + a[0][1] * b[1][1]),
        (a[1][0] * b[0][0] + a[1][1] * b[1][0], a[1][0] * b[0][1] + a[1][1] * b[1][1]),
    )


def normal_incidence_tmm(
    wavelength_nm: float,
    layers: Iterable[OpticalLayer],
    *,
    incident_n: float = 1.0,
    substrate_n: float = 1.5,
) -> OpticalTMMResult:
    """Normal-incidence characteristic-matrix solver for passive isotropic layers.

    This is a real electromagnetic reduced-order calculation for 1D layered media.
    It is not RCWA/FDTD/FEM and does not model lateral patterning, oblique incidence,
    anisotropy, roughness, coherence loss, or fabrication tolerances.
    """
    wl = _finite(wavelength_nm, "wavelength_nm")
    n0 = _finite(incident_n, "incident_n")
    ns = _finite(substrate_n, "substrate_n")
    if wl <= 0 or n0 <= 0 or ns <= 0:
        raise ValueError("wavelength_nm, incident_n and substrate_n must be > 0")
    seq = tuple(layers)
    matrix = ((1 + 0j, 0 + 0j), (0 + 0j, 1 + 0j))
    for layer in seq:
        n = layer.complex_index
        delta = 2.0 * pi * n * layer.thickness_nm / wl
        c = cmath.cos(delta)
        s = cmath.sin(delta)
        layer_matrix = ((c, 1j * s / n), (1j * n * s, c))
        matrix = _matmul2(matrix, layer_matrix)
    b = matrix[0][0] + matrix[0][1] * ns
    cterm = matrix[1][0] + matrix[1][1] * ns
    denom = n0 * b + cterm
    if abs(denom) <= 1e-18:
        raise ArithmeticError("optical characteristic matrix became singular")
    r = (n0 * b - cterm) / denom
    t = 2.0 * n0 / denom
    reflectance = abs(r) ** 2
    transmittance = (ns / n0) * abs(t) ** 2
    raw_absorptance = 1.0 - reflectance - transmittance
    absorptance = 0.0 if -1e-12 < raw_absorptance < 0.0 else raw_absorptance
    balance = reflectance + transmittance + absorptance
    return OpticalTMMResult(
        wavelength_nm=wl,
        incident_n=n0,
        substrate_n=ns,
        reflectance=reflectance,
        transmittance=transmittance,
        absorptance=absorptance,
        raw_absorptance=raw_absorptance,
        energy_balance=balance,
        energy_balance_residual=abs(1.0 - balance),
        layers=seq,
    )


def conservative_transfer(values: Sequence[float], transfers: Sequence[tuple[int, int, float]]) -> ContinuityResult:
    """Apply simultaneous non-negative transfers while exactly carrying the scalar invariant."""
    before = tuple(_finite(v, f"values[{i}]") for i, v in enumerate(values))
    if not before:
        raise ValueError("values must not be empty")
    outflow = [0.0] * len(before)
    delta = [0.0] * len(before)
    for i, (source, target, amount) in enumerate(transfers):
        if not 0 <= int(source) < len(before) or not 0 <= int(target) < len(before):
            raise ValueError(f"transfer[{i}] index out of bounds")
        q = _finite(amount, f"transfer[{i}].amount")
        if q < 0:
            raise ValueError("transfer amounts must be >= 0")
        source, target = int(source), int(target)
        outflow[source] += q
        delta[source] -= q
        delta[target] += q
    for i, q in enumerate(outflow):
        if q > before[i] + 1e-12:
            raise ValueError(f"outflow exceeds available value at index {i}")
    after = tuple(before[i] + delta[i] for i in range(len(before)))
    inv_before = sum(before)
    inv_after = sum(after)
    return ContinuityResult(
        values_before=before,
        values_after=after,
        invariant_before=inv_before,
        invariant_after=inv_after,
        invariant_absolute_residual=abs(inv_after - inv_before),
        invariant_relative_residual=_relative_residual(inv_before, inv_after),
        min_after=min(after),
        max_after=max(after),
        operation="SIMULTANEOUS_CONSERVATIVE_TRANSFER",
    )


def conservative_diffusion_step(
    values: Sequence[float],
    undirected_edges: Sequence[tuple[int, int]],
    *,
    diffusivity: float,
    dt: float,
) -> ContinuityResult:
    """One explicit graph-Laplacian diffusion step with a positivity-preserving CFL guard."""
    before = tuple(_finite(v, f"values[{i}]") for i, v in enumerate(values))
    alpha = _finite(diffusivity, "diffusivity")
    step = _finite(dt, "dt")
    if not before or alpha < 0 or step <= 0:
        raise ValueError("values must be non-empty, diffusivity >= 0 and dt > 0")
    degree = [0] * len(before)
    edges: list[tuple[int, int]] = []
    seen: set[tuple[int, int]] = set()
    for i, (a0, b0) in enumerate(undirected_edges):
        a, b = int(a0), int(b0)
        if a == b or not (0 <= a < len(before) and 0 <= b < len(before)):
            raise ValueError(f"edge[{i}] invalid")
        edge = (a, b) if a < b else (b, a)
        if edge in seen:
            continue
        seen.add(edge)
        edges.append(edge)
        degree[a] += 1
        degree[b] += 1
    max_degree = max(degree, default=0)
    if alpha * step * max_degree > 1.0 + 1e-15:
        raise ValueError("explicit diffusion step violates alpha*dt*max_degree <= 1 stability/positivity guard")
    delta = [0.0] * len(before)
    factor = alpha * step
    for a, b in edges:
        flux = factor * (before[b] - before[a])
        delta[a] += flux
        delta[b] -= flux
    after = tuple(before[i] + delta[i] for i in range(len(before)))
    inv_before = sum(before)
    inv_after = sum(after)
    return ContinuityResult(
        values_before=before,
        values_after=after,
        invariant_before=inv_before,
        invariant_after=inv_after,
        invariant_absolute_residual=abs(inv_after - inv_before),
        invariant_relative_residual=_relative_residual(inv_before, inv_after),
        min_after=min(after),
        max_after=max(after),
        operation="EXPLICIT_CONSERVATIVE_GRAPH_DIFFUSION",
    )


def scalar_wave_fdtd_1d(
    initial_displacement: Sequence[float],
    *,
    initial_velocity: Sequence[float] | None = None,
    wave_speed: float = 1.0,
    dx: float = 1.0,
    dt: float = 0.5,
    steps: int = 1,
    snapshot_stride: int = 0,
) -> Wave1DResult:
    """Second-order finite-difference solver for u_tt = c^2 u_xx with fixed boundaries."""
    u0 = tuple(_finite(v, f"initial_displacement[{i}]") for i, v in enumerate(initial_displacement))
    if len(u0) < 3:
        raise ValueError("initial_displacement requires at least three grid points")
    c = _finite(wave_speed, "wave_speed")
    dx = _finite(dx, "dx")
    dt = _finite(dt, "dt")
    if c < 0 or dx <= 0 or dt <= 0 or not 1 <= int(steps) <= 100_000:
        raise ValueError("wave_speed >= 0, dx/dt > 0 and steps in 1..100000 are required")
    cfl = c * dt / dx
    if cfl > 1.0 + 1e-15:
        raise ValueError("1D scalar wave CFL condition c*dt/dx <= 1 is required")
    vel = tuple(0.0 for _ in u0) if initial_velocity is None else tuple(_finite(v, f"initial_velocity[{i}]") for i, v in enumerate(initial_velocity))
    if len(vel) != len(u0):
        raise ValueError("initial_velocity length must match initial_displacement")
    lam2 = cfl * cfl
    prev = list(u0)
    curr = list(u0)
    # Taylor-consistent first step; fixed boundary values stay at their initial values.
    for i in range(1, len(u0) - 1):
        curr[i] = u0[i] + dt * vel[i] + 0.5 * lam2 * (u0[i + 1] - 2.0 * u0[i] + u0[i - 1])
    curr[0], curr[-1] = u0[0], u0[-1]
    snapshots: list[tuple[float, ...]] = [tuple(u0)] if snapshot_stride else []
    if snapshot_stride and 1 % snapshot_stride == 0:
        snapshots.append(tuple(curr))
    for n in range(1, int(steps)):
        nxt = list(curr)
        for i in range(1, len(curr) - 1):
            nxt[i] = 2.0 * curr[i] - prev[i] + lam2 * (curr[i + 1] - 2.0 * curr[i] + curr[i - 1])
        nxt[0], nxt[-1] = u0[0], u0[-1]
        prev, curr = curr, nxt
        if snapshot_stride and (n + 1) % snapshot_stride == 0:
            snapshots.append(tuple(curr))
    return Wave1DResult(
        wave_speed=c,
        dx=dx,
        dt=dt,
        cfl=cfl,
        steps=int(steps),
        final_state=tuple(curr),
        snapshots=tuple(snapshots),
        max_abs_amplitude=max(abs(v) for v in curr),
    )


def computation_manifest() -> dict:
    return {
        "schema": COMPUTE_SCHEMA,
        "revision": "R170",
        "constants": {"c_m_s": C_M_S, "c_definition": "exact SI speed of light"},
        "solvers": {
            "lorentz_event_3d": {"physics": "special relativity", "invariant_check": "Minkowski interval"},
            "relativistic_velocity_3d": {"physics": "special relativity", "speed_guard": "strictly below c"},
            "normal_incidence_tmm": {"physics": "1D electromagnetic layered-media screening", "fabrication_grade": False},
            "conservative_transfer": {"math": "finite conservative redistribution", "invariant": "sum(values)"},
            "graph_diffusion": {"math": "explicit graph Laplacian", "guard": "alpha*dt*max_degree <= 1"},
            "scalar_wave_fdtd_1d": {"physics": "scalar wave equation", "guard": "CFL c*dt/dx <= 1", "maxwell_solver": False},
        },
        "hierarchy": {"address_levels": [12, 144, 1728, 20736], "physical_dimension_claim": False},
        "truth_boundary": TRUTH_BOUNDARY,
    }


def run_truth_suite() -> dict:
    checks: list[dict] = []

    event = lorentz_boost_event(1.25, (1.2e8, -2.5e7, 4.0e6), (4.0e7, -2.0e7, 1.0e7))
    checks.append({"name": "lorentz_interval_invariant", "value": event.invariant_relative_residual, "limit": 1e-12,
                   "pass": event.invariant_relative_residual < 1e-12})

    fresnel = normal_incidence_tmm(550.0, (), incident_n=1.0, substrate_n=1.5)
    expected_r = ((1.0 - 1.5) / (1.0 + 1.5)) ** 2
    checks.append({"name": "fresnel_bare_interface", "value": abs(fresnel.reflectance - expected_r), "limit": 1e-12,
                   "pass": abs(fresnel.reflectance - expected_r) < 1e-12})
    checks.append({"name": "tmm_energy_balance", "value": fresnel.energy_balance_residual, "limit": 1e-12,
                   "pass": fresnel.energy_balance_residual < 1e-12})

    quarter_n = sqrt(1.5)
    quarter = normal_incidence_tmm(550.0, (OpticalLayer(quarter_n, 0.0, 550.0 / (4.0 * quarter_n)),), incident_n=1.0, substrate_n=1.5)
    checks.append({"name": "quarter_wave_antireflection", "value": quarter.reflectance, "limit": 1e-12,
                   "pass": quarter.reflectance < 1e-12})

    continuity = conservative_transfer((4.0, 3.0, 2.0, 1.0), ((0, 1, 1.25), (1, 2, 0.5), (2, 3, 0.25)))
    checks.append({"name": "conservative_transfer_invariant", "value": continuity.invariant_absolute_residual, "limit": 1e-12,
                   "pass": continuity.invariant_absolute_residual < 1e-12})

    diffusion = conservative_diffusion_step((1.0, 0.0, 0.0, 0.0), ((0, 1), (1, 2), (2, 3)), diffusivity=0.2, dt=0.5)
    checks.append({"name": "graph_diffusion_invariant", "value": diffusion.invariant_absolute_residual, "limit": 1e-12,
                   "pass": diffusion.invariant_absolute_residual < 1e-12})

    wave = scalar_wave_fdtd_1d((0.0, 0.0, 1.0, 0.0, 0.0), wave_speed=1.0, dx=1.0, dt=0.5, steps=20)
    checks.append({"name": "wave_cfl_guarded_run", "value": wave.cfl, "limit": 1.0,
                   "pass": wave.cfl <= 1.0 and all(isfinite(v) for v in wave.final_state)})

    passed = all(item["pass"] for item in checks)
    payload = {"schema": "OMEGA_COMPUTATION_TRUTH_SUITE_R170", "passed": passed, "checks": checks,
               "manifest": computation_manifest(), "authority": "DERIVED_REFERENCE_COMPUTATION_NOT_CANON"}
    return {**payload, "receipt_sha256": digest_payload(payload)}


if __name__ == "__main__":
    print(json.dumps(run_truth_suite(), indent=2, sort_keys=True))
