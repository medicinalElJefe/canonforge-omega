"""OMEGA R175 independent full-wave RCWA solver.

This module executes a real rigorous coupled-wave analysis through the external
``grcwa`` Maxwell solver. It deliberately has no scalar/TMM/fake fallback.
Missing NumPy/grcwa, invalid geometry, failed convergence, or an inadmissible
Tier-2 packet must remain a failed/blocked RCWA execution.

Input schema:  OMEGA_FULLWAVE_QUEUE_v1
Output schema: OMEGA_RESULT_v1

12/144/1728/20736 are OMEGA software address/execution-resolution levels and
are not interpreted here as physical dimensions.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import platform
import sys
import time
from typing import Any

WORKER_VERSION = "R175.0"
QUEUE_SCHEMA = "OMEGA_FULLWAVE_QUEUE_v1"
RESULT_SCHEMA = "OMEGA_RESULT_v1"
SOLVER_FAMILY = "MAXWELL_RCWA"


def canonical_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, default=str)


def sha256(value: Any) -> str:
    raw = value if isinstance(value, str) else canonical_json(value)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def dependency_status() -> dict[str, Any]:
    status: dict[str, Any] = {
        "available": False,
        "numpy": None,
        "grcwa": None,
        "solver_family": SOLVER_FAMILY,
        "fallback": False,
    }
    try:
        import numpy as np  # type: ignore
        status["numpy"] = getattr(np, "__version__", "unknown")
    except Exception as exc:
        status["error"] = f"NUMPY_DEPENDENCY_MISSING: {exc}"
        return status
    try:
        import grcwa  # type: ignore
        status["grcwa"] = getattr(grcwa, "__version__", "unknown")
    except Exception as exc:
        status["error"] = f"RCWA_DEPENDENCY_MISSING: {exc}"
        return status
    status["available"] = True
    return status


def _finite(name: str, value: Any, lo: float | None = None, hi: float | None = None) -> float:
    try:
        x = float(value)
    except Exception as exc:
        raise ValueError(f"{name} must be numeric") from exc
    if not math.isfinite(x):
        raise ValueError(f"{name} must be finite")
    if lo is not None and x < lo:
        raise ValueError(f"{name} must be >= {lo}")
    if hi is not None and x > hi:
        raise ValueError(f"{name} must be <= {hi}")
    return x


def _material(job: dict[str, Any]) -> dict[str, complex]:
    model = job.get("material_model") or {}
    required = ["n_incident", "n_feature", "n_background", "n_substrate"]
    missing = [key for key in required if key not in model]
    if missing:
        raise ValueError("material_model missing " + ", ".join(missing))
    return {key: complex(model[key]) for key in required}


def _geometry(job: dict[str, Any]) -> tuple[float, float, float, float, float]:
    geometry = job.get("geometry") or {}
    pitch = _finite("geometry.pitch_nm", geometry.get("pitch_nm"), 1e-6)
    width = _finite("geometry.width_nm", geometry.get("width_nm"), 1e-6, pitch)
    length = _finite("geometry.length_nm", geometry.get("length_nm"), 1e-6, pitch)
    height = _finite("geometry.height_nm", geometry.get("height_nm"), 1e-6)
    theta_deg = _finite("geometry.theta_deg", geometry.get("theta_deg", 0.0), -360.0, 360.0)
    return pitch, width, length, height, theta_deg


def _eps_grid(np: Any, nx: int, ny: int, pitch: float, width: float, length: float,
              theta_deg: float, eps_feature: complex, eps_background: complex) -> Any:
    x = (np.arange(nx) + 0.5) / nx * pitch - pitch / 2
    y = (np.arange(ny) + 0.5) / ny * pitch - pitch / 2
    xx, yy = np.meshgrid(x, y, indexing="ij")
    angle = math.radians(theta_deg)
    xr = xx * math.cos(angle) + yy * math.sin(angle)
    yr = -xx * math.sin(angle) + yy * math.cos(angle)
    inside = (np.abs(xr) <= length / 2) & (np.abs(yr) <= width / 2)
    eps = np.full((nx, ny), eps_background, dtype=complex)
    eps[inside] = eps_feature
    return eps


def _solve_once(job: dict[str, Any], harmonics: int) -> tuple[dict[str, Any], str]:
    try:
        import numpy as np  # type: ignore
        import grcwa  # type: ignore
    except Exception as exc:
        raise RuntimeError(
            "RCWA_DEPENDENCY_MISSING: install the OMEGA rcwa extra or `py -3 -m pip install numpy grcwa`; no fallback result is permitted"
        ) from exc

    pitch, width, length, height, theta_deg = _geometry(job)
    wavelength = _finite("wavelength_nm", job.get("wavelength_nm"), 1e-6)
    material = _material(job)
    numerics = job.get("numerics") or {}
    nx = int(_finite("numerics.nx", numerics.get("nx", 96), 16, 512))
    ny = int(_finite("numerics.ny", numerics.get("ny", 96), 16, 512))
    incidence_theta = math.radians(_finite("numerics.incidence_theta_deg", numerics.get("incidence_theta_deg", 0.0), -89.0, 89.0))
    incidence_phi = math.radians(_finite("numerics.incidence_phi_deg", numerics.get("incidence_phi_deg", 0.0), -360.0, 360.0))
    polarization = str(job.get("polarization", "s")).lower()
    if polarization not in {"s", "p"}:
        raise ValueError("polarization must be 's' or 'p'")

    freq = 1.0 / wavelength
    eps_i = material["n_incident"] ** 2
    eps_f = material["n_feature"] ** 2
    eps_b = material["n_background"] ** 2
    eps_s = material["n_substrate"] ** 2
    lattice_1 = [pitch, 0.0]
    lattice_2 = [0.0, pitch]

    obj = grcwa.obj(int(harmonics), lattice_1, lattice_2, freq, incidence_theta, incidence_phi, verbose=0)
    buffer_nm = max(pitch, wavelength)
    obj.Add_LayerUniform(buffer_nm, eps_i)
    obj.Add_LayerGrid(height, nx, ny)
    obj.Add_LayerUniform(buffer_nm, eps_s)
    obj.Init_Setup(Gmethod=0)
    if polarization == "s":
        obj.MakeExcitationPlanewave(0.0, 0.0, 1.0, 0.0, order=0)
    else:
        obj.MakeExcitationPlanewave(1.0, 0.0, 0.0, 0.0, order=0)

    grid = _eps_grid(np, nx, ny, pitch, width, length, theta_deg, eps_f, eps_b)
    obj.GridLayer_geteps(grid.flatten())
    reflection, transmission = obj.RT_Solve(normalize=1)
    reflection_orders, transmission_orders = obj.RT_Solve(normalize=1, byorder=1)
    reflection = float(np.real(reflection))
    transmission = float(np.real(transmission))
    energy = reflection + transmission
    return ({
        "requested_harmonics": int(harmonics),
        "actual_harmonics": int(obj.nG),
        "R": reflection,
        "T": transmission,
        "A_or_numeric_residual": float(1.0 - energy),
        "energy_balance_error": float(abs(energy - 1.0)),
        "R_by_order": [float(np.real(x)) for x in np.asarray(reflection_orders).reshape(-1).tolist()],
        "T_by_order": [float(np.real(x)) for x in np.asarray(transmission_orders).reshape(-1).tolist()],
        "grid": {"nx": nx, "ny": ny},
    }, str(getattr(grcwa, "__version__", "unknown")))


def solve(job: dict[str, Any]) -> dict[str, Any]:
    if job.get("schema") != QUEUE_SCHEMA:
        raise ValueError(f"schema must be {QUEUE_SCHEMA}")
    if str(job.get("solver", "")).lower() != "rcwa":
        raise ValueError("R175 independent solver accepts solver='rcwa' only")
    proof = job.get("proof") or {}
    if proof.get("gate") != "STAY" or float(proof.get("mode188_score", 0)) < 1.05:
        raise ValueError("candidate is not proof-admissible for Tier 2")

    numerics = job.get("numerics") or {}
    low = int(_finite("numerics.harmonics_low", numerics.get("harmonics_low", 49), 9, 401))
    high = int(_finite("numerics.harmonics_high", numerics.get("harmonics_high", 81), low + 1, 801))
    convergence_tolerance = _finite("numerics.convergence_tolerance", numerics.get("convergence_tolerance", 0.01), 1e-8, 0.25)
    energy_tolerance = _finite("numerics.energy_tolerance", numerics.get("energy_tolerance", 0.02), 1e-8, 0.5)

    started = time.perf_counter()
    coarse, version_coarse = _solve_once(job, low)
    fine, version_fine = _solve_once(job, high)
    runtime_ms = (time.perf_counter() - started) * 1000.0
    delta_rt = max(abs(fine["R"] - coarse["R"]), abs(fine["T"] - coarse["T"]))
    converged = bool(delta_rt <= convergence_tolerance and fine["energy_balance_error"] <= energy_tolerance)

    result: dict[str, Any] = {
        "schema": RESULT_SCHEMA,
        "revision": "R175",
        "packet_id": "result_" + sha256({"job": job.get("job_id"), "fine": fine, "time": time.time()})[:24],
        "source_packet_id": str(job.get("source_packet_id")),
        "worker": "omega-sovereign",
        "solver": "rcwa",
        "solver_family": SOLVER_FAMILY,
        "solver_version": f"grcwa:{version_fine or version_coarse};omega-worker:{WORKER_VERSION}",
        "converged": converged,
        "convergence_metrics": {
            "harmonics_low": coarse["actual_harmonics"],
            "harmonics_high": fine["actual_harmonics"],
            "delta_RT": delta_rt,
            "convergence_tolerance": convergence_tolerance,
            "energy_balance_error": fine["energy_balance_error"],
            "energy_tolerance": energy_tolerance,
        },
        "observables": {
            "R": fine["R"],
            "T": fine["T"],
            "A_or_numeric_residual": fine["A_or_numeric_residual"],
            "R_by_order": fine["R_by_order"],
            "T_by_order": fine["T_by_order"],
        },
        "runtime_ms": runtime_ms,
        "lineage": list(job.get("lineage") or []) + [f"omega-sovereign:rcwa:{WORKER_VERSION}"],
        "completed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "numerical_identity": {
            "python": sys.version.split()[0],
            "platform": platform.platform(),
            "input_sha256": sha256(job),
        },
        "native_execution": True,
        "independent_solver_family_claim": True,
        "external_measurement_claim": False,
        "physical_dimension_claim": False,
        "canonical_mutation": False,
        "truth_boundary": (
            "R175 is a native grcwa Maxwell-RCWA result for the submitted periodic structure. "
            "Numerical convergence is independent-solver evidence relative to OMEGA's reduced-order optical screen, "
            "but it is not fabrication validation, material metrology, experimental observation, or CanonState authority."
        ),
    }
    result["result_sha256"] = sha256(result)
    receipt_core = {
        "schema": "OMEGA_SOVEREIGN_RCWA_RECEIPT_R175",
        "revision": "R175",
        "input_sha256": result["numerical_identity"]["input_sha256"],
        "result_sha256": result["result_sha256"],
        "solver": result["solver"],
        "solver_family": result["solver_family"],
        "solver_version": result["solver_version"],
        "converged": result["converged"],
        "convergence_metrics": result["convergence_metrics"],
        "native_execution": True,
        "independent_solver_family_claim": True,
        "external_measurement_claim": False,
        "canonical_mutation": False,
    }
    result["receipt"] = {**receipt_core, "receipt_sha256": sha256(receipt_core)}
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="OMEGA R175 native independent RCWA solver")
    parser.add_argument("--input-json")
    parser.add_argument("--probe", action="store_true")
    args = parser.parse_args()
    if args.probe:
        print(json.dumps(dependency_status(), sort_keys=True))
        return 0
    if not args.input_json:
        parser.error("--input-json is required unless --probe is used")
    try:
        job = json.loads(args.input_json)
        result = solve(job)
        print(json.dumps(result, sort_keys=True))
        return 0 if result.get("converged") else 3
    except Exception as exc:
        failure = {
            "schema": RESULT_SCHEMA,
            "revision": "R175",
            "solver": "rcwa",
            "solver_family": SOLVER_FAMILY,
            "converged": False,
            "native_execution": False,
            "independent_solver_family_claim": False,
            "external_measurement_claim": False,
            "canonical_mutation": False,
            "error": str(exc),
            "truth_boundary": "No RCWA success is claimed for this failed R175 solver invocation.",
        }
        print(json.dumps(failure, sort_keys=True))
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
