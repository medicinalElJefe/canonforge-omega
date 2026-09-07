from __future__ import annotations

"""OMEGA sovereign heartbeat + R199 governed workstation executor.

This is the production-token transport agent served by /api/hybrid/agent.  It keeps the
existing authenticated heartbeat/lease/result API while repairing the execution plane:
projects are discovered beneath the approved root, heavy work is resource-gated and
sequential, subprocesses run below-normal priority on Windows, and command failures can
never be reported as VERIFIED.  It never installs dependencies, opens an arbitrary shell,
or performs registry/service/power-plan "optimization".
"""

import argparse
import ctypes
import hashlib
import json
import os
import platform
import re
import shutil
import socket
from pathlib import Path
import subprocess
import sys
import time
import urllib.error
import urllib.request

from omega_runtime.agent_sai_r179 import SAI_JOB_KINDS, execute_sai_job, sai_capabilities

CROSS_RUNTIME_CHALLENGE_SCHEMA = "OMEGA_CROSS_RUNTIME_CHALLENGE_R173"
INDEPENDENT_SOLVER_CHALLENGE_SCHEMA = "OMEGA_INDEPENDENT_SOLVER_CHALLENGE_R175"
AGENT_REVISION = "R199"
RUNTIME_VERSION = "r199-project-aware-sovereign-agent"

SAFE_KINDS = {
    "convergence_scan",
    "inspect_workspace",
    "inspect_runtime",
    "compute_truth_suite",
    "cross_runtime_validate",
    "run_tests",
    "build_vite",
    "wrangler_dry_run",
    "capture_screenshot",
    "prepare_candidate",
    "verify_candidate",
    "cleanup_candidate",
} | SAI_JOB_KINDS

SKIP_DIRS = {
    ".git", "node_modules", "dist", "build", ".venv", "venv", "__pycache__", ".wrangler",
    ".omega_hybrid", ".pytest_cache", ".mypy_cache", ".ruff_cache", ".next", ".cache",
    "coverage", "$recycle.bin", "system volume information",
}
PROJECT_MARKERS = {
    "pyproject.toml": 24,
    "package.json": 18,
    "wrangler.toml": 22,
    "requirements.txt": 8,
    "cargo.toml": 18,
    "go.mod": 18,
    "pom.xml": 16,
    "build.gradle": 16,
    "build.gradle.kts": 16,
}
MAX_DISCOVERY_DIRS = 6000
MAX_DISCOVERY_DEPTH = 7
DISCOVERY_TIME_BUDGET = 12.0
MIN_FREE_DISK_BYTES = 3 * 1024**3
MIN_AVAILABLE_MEMORY_BYTES = int(1.5 * 1024**3)


def canonical_json(value) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, default=str)


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def request_json(base: str, path: str, token: str, payload: dict | None = None, timeout: int = 30) -> dict:
    url = base.rstrip("/") + path
    data = None if payload is None else json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="GET" if payload is None else "POST")
    req.add_header("accept", "application/json")
    if data is not None:
        req.add_header("content-type", "application/json")
    if token:
        req.add_header("x-omega-agent-token", token)
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def normalize_root(raw: str) -> Path:
    cleaned = str(raw or ".").strip().strip('"').strip("'")
    if len(cleaned) == 2 and cleaned[1] == ":":
        cleaned += "\\"
    return Path(cleaned).expanduser().resolve()


def _memory_status() -> dict:
    if os.name != "nt":
        return {"available_bytes": None, "total_bytes": None, "source": "UNAVAILABLE_STDLIB"}

    class MemoryStatus(ctypes.Structure):
        _fields_ = [
            ("dwLength", ctypes.c_ulong), ("dwMemoryLoad", ctypes.c_ulong),
            ("ullTotalPhys", ctypes.c_ulonglong), ("ullAvailPhys", ctypes.c_ulonglong),
            ("ullTotalPageFile", ctypes.c_ulonglong), ("ullAvailPageFile", ctypes.c_ulonglong),
            ("ullTotalVirtual", ctypes.c_ulonglong), ("ullAvailVirtual", ctypes.c_ulonglong),
            ("ullAvailExtendedVirtual", ctypes.c_ulonglong),
        ]

    status = MemoryStatus()
    status.dwLength = ctypes.sizeof(MemoryStatus)
    if not ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(status)):
        return {"available_bytes": None, "total_bytes": None, "source": "WIN32_FAILED"}
    return {
        "available_bytes": int(status.ullAvailPhys),
        "total_bytes": int(status.ullTotalPhys),
        "memory_load_percent": int(status.dwMemoryLoad),
        "source": "WIN32_GLOBAL_MEMORY_STATUS",
    }


def host_health(root: Path, discovery: dict | None = None) -> dict:
    disk = shutil.disk_usage(root)
    memory = _memory_status()
    available = memory.get("available_bytes")
    disk_ok = disk.free >= MIN_FREE_DISK_BYTES
    memory_ok = available is None or available >= MIN_AVAILABLE_MEMORY_BYTES
    return {
        "schema": "OMEGA_PC_RESOURCE_GUARD_R199",
        "platform": platform.platform(),
        "python": sys.version.split()[0],
        "approved_root": str(root),
        "disk": {
            "free_bytes": disk.free,
            "total_bytes": disk.total,
            "minimum_free_bytes": MIN_FREE_DISK_BYTES,
            "ok": disk_ok,
        },
        "memory": {
            **memory,
            "minimum_available_bytes": MIN_AVAILABLE_MEMORY_BYTES,
            "ok": memory_ok,
        },
        "ready_for_heavy_work": bool(disk_ok and memory_ok),
        "heavy_operations_sequential": True,
        "subprocess_priority": "BELOW_NORMAL_ON_WINDOWS",
        "implicit_dependency_install": False,
        "uncontrolled_system_optimization": False,
        "arbitrary_shell": False,
        "project_discovery": {
            "candidate_count": (discovery or {}).get("candidate_count"),
            "selected": (discovery or {}).get("selected"),
        },
    }


def require_heavy_budget(root: Path, discovery: dict | None = None) -> dict:
    health = host_health(root, discovery)
    if not health["ready_for_heavy_work"]:
        raise RuntimeError("RESOURCE_GUARD_BLOCKED: insufficient free disk or available memory for heavy work")
    return health


def marker_score(path: Path, names: set[str]) -> tuple[int, list[str]]:
    low = {name.lower() for name in names}
    score = 0
    markers: list[str] = []
    for marker, weight in PROJECT_MARKERS.items():
        if marker in low:
            score += weight
            markers.append(marker)
    if any(name.endswith(".sln") for name in low):
        score += 20
        markers.append("*.sln")
    if any(name.endswith(".csproj") for name in low):
        score += 16
        markers.append("*.csproj")
    if any(name.startswith("vite.config.") for name in low):
        score += 12
        markers.append("vite.config.*")
    if "omega_runtime" in low:
        score += 20
        markers.append("omega_runtime/")
    if "cloudflare" in low:
        score += 8
        markers.append("cloudflare/")
    label = path.as_posix().lower()
    if "canonforge-omega" in label:
        score += 32
    if "omega" in path.name.lower():
        score += 12
    return score, sorted(set(markers))


def discover_projects(root: Path) -> dict:
    root = root.resolve()
    started = time.monotonic()
    queue: list[tuple[Path, int]] = [(root, 0)]
    visited = 0
    candidates: list[dict] = []
    truncated = False
    while queue:
        if visited >= MAX_DISCOVERY_DIRS or time.monotonic() - started >= DISCOVERY_TIME_BUDGET:
            truncated = True
            break
        path, depth = queue.pop(0)
        visited += 1
        try:
            entries = list(os.scandir(path))
        except OSError:
            continue
        score, markers = marker_score(path, {entry.name for entry in entries})
        if score >= 16:
            candidates.append({
                "path": str(path),
                "relative_path": path.relative_to(root).as_posix() or ".",
                "score": score,
                "markers": markers,
                "depth": depth,
            })
        if depth >= MAX_DISCOVERY_DEPTH:
            continue
        children = []
        for entry in entries:
            try:
                if entry.is_dir(follow_symlinks=False) and entry.name.lower() not in SKIP_DIRS:
                    children.append(Path(entry.path))
            except OSError:
                pass
        queue.extend((child, depth + 1) for child in sorted(children, key=lambda p: p.name.lower()))
    candidates.sort(key=lambda row: (-row["score"], row["depth"], row["relative_path"].lower()))
    selected = candidates[0] if candidates else None
    confidence = "NONE"
    if selected:
        lead = selected["score"] - (candidates[1]["score"] if len(candidates) > 1 else 0)
        confidence = "HIGH" if selected["score"] >= 40 and lead >= 6 else "MEDIUM" if selected["score"] >= 24 else "LOW"
    return {
        "schema": "OMEGA_PROJECT_DISCOVERY_R199",
        "approved_root": str(root),
        "selected": selected,
        "candidates": candidates[:24],
        "candidate_count": len(candidates),
        "directories_visited": visited,
        "truncated": truncated,
        "confidence": confidence,
        "elapsed_seconds": round(time.monotonic() - started, 3),
    }


def selected_project(root: Path, discovery: dict) -> Path:
    selected = discovery.get("selected")
    if not selected:
        raise RuntimeError("PROJECT_NOT_FOUND: no buildable project discovered beneath approved root")
    path = Path(selected["path"]).resolve()
    path.relative_to(root.resolve())
    return path


def find_project_with(root: Path, discovery: dict, relative_marker: str) -> Path | None:
    for candidate in discovery.get("candidates", []):
        path = Path(candidate["path"]).resolve()
        if (path / relative_marker).exists():
            path.relative_to(root.resolve())
            return path
    return None


def _tool_exists(executable: str, cwd: Path) -> bool:
    if executable.startswith("./") or executable.startswith(".\\"):
        return (cwd / executable[2:]).exists()
    return shutil.which(executable) is not None


def run(cmd: list[str], cwd: Path, timeout: int = 300, *, heavy: bool = False, root: Path | None = None, discovery: dict | None = None) -> dict:
    if heavy:
        require_heavy_budget(root or cwd, discovery)
    if not cmd or not _tool_exists(cmd[0], cwd):
        return {
            "command": cmd,
            "exit_code": 127,
            "stdout_tail": "",
            "stderr_tail": f"DEPENDENCY_MISSING_NO_INSTALL: {cmd[0] if cmd else 'command'}",
            "elapsed_seconds": 0.0,
            "priority": "NOT_STARTED",
        }
    flags = getattr(subprocess, "BELOW_NORMAL_PRIORITY_CLASS", 0) if os.name == "nt" and heavy else 0
    env = os.environ.copy()
    env.setdefault("CI", "1")
    env.setdefault("npm_config_audit", "false")
    env.setdefault("npm_config_fund", "false")
    started = time.monotonic()
    proc = subprocess.run(
        cmd,
        cwd=str(cwd),
        capture_output=True,
        text=True,
        timeout=timeout,
        shell=False,
        creationflags=flags,
        env=env,
    )
    return {
        "command": cmd,
        "exit_code": proc.returncode,
        "stdout_tail": proc.stdout[-18000:],
        "stderr_tail": proc.stderr[-12000:],
        "elapsed_seconds": round(time.monotonic() - started, 3),
        "priority": "BELOW_NORMAL" if flags else "NORMAL",
        "implicit_dependency_install": False,
    }


def require_success(result: dict, label: str) -> dict:
    if int(result.get("exit_code", 1)) != 0:
        raise RuntimeError(f"{label} failed with exit code {result.get('exit_code')}: {result.get('stderr_tail', '')[-1500:]}")
    return result


def inspect_workspace(root: Path, project: Path, discovery: dict) -> dict:
    entries = sorted(p.name for p in project.iterdir())[:500]
    git = run(["git", "status", "--short", "--branch"], project, timeout=60) if (project / ".git").exists() else None
    return {
        "approved_root": str(root),
        "project": str(project),
        "project_relative": project.relative_to(root).as_posix() or ".",
        "entries": entries,
        "git": git,
        "discovery": discovery,
    }


def project_preflight(root: Path, project: Path, discovery: dict) -> dict:
    worker = project / "cloudflare" / "omega-v6-worker"
    checks = {
        "python": sys.executable,
        "git": shutil.which("git"),
        "node": shutil.which("node"),
        "npm": shutil.which("npm"),
        "npx": shutil.which("npx"),
        "dotnet": shutil.which("dotnet"),
        "cargo": shutil.which("cargo"),
        "go": shutil.which("go"),
    }
    return {
        "schema": "OMEGA_PROJECT_PREFLIGHT_R199",
        "project": str(project),
        "project_relative": project.relative_to(root).as_posix() or ".",
        "worker_path": str(worker) if worker.is_dir() else None,
        "toolchain": checks,
        "resource_guard": host_health(root, discovery),
        "implicit_dependency_install": False,
        "uncontrolled_system_optimization": False,
    }


def convergence_scan(root: Path, project: Path, discovery: dict) -> dict:
    tool = project / "tools" / "omega_convergence_cycle.py"
    if not tool.exists():
        return {
            "kind": "convergence_scan",
            "blocked": True,
            "reason": f"missing convergence tool in selected project: {tool}",
            "discovery": discovery,
        }
    out = project / "convergence" / "latest.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    execution = run([
        sys.executable, str(tool),
        "--canonical-ref", "omega-v6-full-convergence",
        "--genesis-ref", "omega-genesis-v1-full",
        "--output", str(out),
    ], project, timeout=360, heavy=True, root=root, discovery=discovery)
    require_success(execution, "convergence scan")
    snapshot = None
    try:
        snapshot = json.loads(out.read_text(encoding="utf-8")) if out.exists() else None
    except (OSError, json.JSONDecodeError):
        snapshot = None
    return {"kind": "convergence_scan", "result": execution, "snapshot": snapshot, "snapshot_path": str(out), "blocked": False}


def compute_truth_suite(root: Path, project: Path, discovery: dict) -> dict:
    execution = run([sys.executable, "-m", "omega_runtime.advanced_computation"], project, timeout=180, heavy=True, root=root, discovery=discovery)
    require_success(execution, "R170 computation truth suite")
    try:
        parsed = json.loads(execution["stdout_tail"])
    except json.JSONDecodeError as exc:
        raise RuntimeError("R170 computation truth suite did not return JSON") from exc
    if parsed.get("passed") is not True or not parsed.get("receipt_sha256"):
        raise RuntimeError("R170 computation truth suite did not return a passing hash-receipted result")
    return {
        "kind": "compute_truth_suite",
        "result": execution,
        "truth_suite": parsed,
        "blocked": False,
        "authority": "DERIVED_REFERENCE_COMPUTATION_NOT_CANON",
        "native_execution": True,
        "physical_dimension_claim": False,
        "fabrication_grade_optical_claim": False,
    }


def rcwa_dependency_status(project: Path) -> dict:
    execution = run([sys.executable, "-m", "omega_runtime.rcwa_solver", "--probe"], project, timeout=60)
    try:
        parsed = json.loads(execution["stdout_tail"])
    except json.JSONDecodeError:
        parsed = None
    return {
        "available": bool(execution["exit_code"] == 0 and parsed and parsed.get("available") is True),
        "probe": parsed,
        "exit_code": execution["exit_code"],
    }


def cross_runtime_validate(job: dict, root: Path, project: Path, discovery: dict) -> dict:
    payload = job.get("payload") if isinstance(job.get("payload"), dict) else {}
    if payload.get("schema") == INDEPENDENT_SOLVER_CHALLENGE_SCHEMA:
        canonical_queue = payload.get("queue_job_canonical_json")
        queue_sha = payload.get("queue_job_sha256")
        if not isinstance(canonical_queue, str) or sha256_text(canonical_queue) != queue_sha:
            raise RuntimeError("R175 canonical full-wave queue hash mismatch")
        deps = rcwa_dependency_status(project)
        if not deps["available"]:
            return {"kind": "cross_runtime_validate", "blocked": True, "reason": "R175 RCWA dependencies unavailable; no fallback permitted", "dependency_status": deps}
        execution = run([sys.executable, "-m", "omega_runtime.rcwa_solver", "--input-json", canonical_queue], project, timeout=900, heavy=True, root=root, discovery=discovery)
        require_success(execution, "R175 RCWA")
        try:
            result = json.loads(execution["stdout_tail"])
        except json.JSONDecodeError as exc:
            raise RuntimeError("R175 RCWA returned non-JSON output") from exc
        if result.get("converged") is not True or result.get("solver_family") != "MAXWELL_RCWA":
            raise RuntimeError("R175 RCWA did not return a converged MAXWELL_RCWA receipt")
        identity = result.get("numerical_identity") or {}
        receipt = result.get("receipt") or {}
        if identity.get("input_sha256") != queue_sha or receipt.get("input_sha256") != queue_sha:
            raise RuntimeError("R175 RCWA returned input identity mismatch")
        return {
            "kind": "cross_runtime_validate",
            "schema": "OMEGA_SOVEREIGN_INDEPENDENT_SOLVER_RESULT_R199",
            "blocked": False,
            "native_execution": True,
            "native_result": result,
            "native_receipt": receipt,
            "dependency_status": deps,
            "authority": "AUTHENTICATED_INDEPENDENT_SOLVER_RECEIPT_NOT_CANON",
            "physical_dimension_claim": False,
        }

    if payload.get("schema") != CROSS_RUNTIME_CHALLENGE_SCHEMA:
        return {"kind": "cross_runtime_validate", "blocked": True, "reason": "R173 challenge schema is missing or invalid"}
    path = payload.get("path")
    canonical_input = payload.get("input_canonical_json")
    input_sha = payload.get("input_sha256")
    if not isinstance(path, str) or not path.startswith("/api/compute/") or not isinstance(canonical_input, str):
        raise RuntimeError("R173 challenge payload is incomplete")
    if sha256_text(canonical_input) != input_sha:
        raise RuntimeError("R173 canonical input hash mismatch")
    execution = run([
        sys.executable, "-m", "omega_runtime.cross_runtime_cli",
        "--path", path, "--input-json", canonical_input,
    ], project, timeout=240, heavy=True, root=root, discovery=discovery)
    require_success(execution, "R173 cross-runtime validation")
    try:
        receipt = json.loads(execution["stdout_tail"])
    except json.JSONDecodeError as exc:
        raise RuntimeError("R173 reference execution returned non-JSON output") from exc
    if receipt.get("input_sha256") != input_sha:
        raise RuntimeError("R173 native input hash does not match challenge")
    return {
        "kind": "cross_runtime_validate",
        "schema": "OMEGA_SOVEREIGN_CROSS_RUNTIME_RESULT_R199",
        "blocked": False,
        "native_execution": True,
        "input_sha256": input_sha,
        "native_receipt": receipt,
        "authority": "AUTHENTICATED_NATIVE_EXECUTION_RECEIPT_NOT_CANON",
    }


def _worker_path(project: Path) -> Path:
    direct = project / "cloudflare" / "omega-v6-worker"
    if direct.is_dir():
        return direct
    if (project / "wrangler.toml").exists() and (project / "package.json").exists():
        return project
    raise RuntimeError("CLOUDFLARE_PROJECT_NOT_FOUND: no omega-v6-worker/wrangler project under selected project")


def run_tests(root: Path, project: Path, discovery: dict) -> dict:
    result = run([sys.executable, "-m", "pytest", "-q"], project, timeout=1200, heavy=True, root=root, discovery=discovery)
    require_success(result, "Python test suite")
    return {"kind": "run_tests", "result": result, "blocked": False}


def build_vite(root: Path, project: Path, discovery: dict) -> dict:
    worker = _worker_path(project)
    scripts = {}
    try:
        scripts = json.loads((worker / "package.json").read_text(encoding="utf-8")).get("scripts", {})
    except Exception:
        pass
    script = "typecheck" if "typecheck" in scripts else "check" if "check" in scripts else "build" if "build" in scripts else None
    if not script:
        raise RuntimeError("NODE_BUILD_SCRIPT_NOT_FOUND: expected typecheck/check/build script")
    result = run(["npm", "run", script], worker, timeout=900, heavy=True, root=root, discovery=discovery)
    require_success(result, f"npm run {script}")
    return {"kind": "build_vite", "project": str(worker), "script": script, "result": result, "blocked": False}


def wrangler_dry_run(root: Path, project: Path, discovery: dict) -> dict:
    worker = _worker_path(project)
    result = run(["npx", "wrangler", "deploy", "--dry-run"], worker, timeout=900, heavy=True, root=root, discovery=discovery)
    require_success(result, "wrangler dry-run")
    return {"kind": "wrangler_dry_run", "project": str(worker), "result": result, "blocked": False, "deployment_authorized": False}


def screenshot(root: Path) -> dict:
    if os.name != "nt":
        return {"kind": "capture_screenshot", "blocked": True, "reason": "Windows screen capture is unavailable on this host"}
    out_dir = root / ".omega_hybrid" / "screens"
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / (time.strftime("%Y%m%d_%H%M%S") + ".png")
    script = "$ErrorActionPreference='Stop';Add-Type -AssemblyName System.Windows.Forms;Add-Type -AssemblyName System.Drawing;$b=[Windows.Forms.Screen]::PrimaryScreen.Bounds;$i=New-Object Drawing.Bitmap $b.Width,$b.Height;$g=[Drawing.Graphics]::FromImage($i);$g.CopyFromScreen($b.Location,[Drawing.Point]::Empty,$b.Size);$i.Save($args[0],[Drawing.Imaging.ImageFormat]::Png);$g.Dispose();$i.Dispose()"
    result = run(["powershell.exe", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script, str(out)], root, timeout=45)
    require_success(result, "screen capture")
    if not out.exists():
        raise RuntimeError("screen capture returned success but produced no artifact")
    return {"kind": "capture_screenshot", "blocked": False, "path": str(out), "sha256": hashlib.sha256(out.read_bytes()).hexdigest(), "local_only": True}


def verify_candidate(root: Path, project: Path, discovery: dict) -> dict:
    tests = run_tests(root, project, discovery)
    computation = compute_truth_suite(root, project, discovery)
    worker = None
    build = None
    try:
        worker = _worker_path(project)
        build = build_vite(root, project, discovery)
    except RuntimeError as exc:
        # A Python-only project is valid; an OMEGA project with a worker is not allowed to skip it.
        if (project / "cloudflare").exists() or (project / "wrangler.toml").exists():
            raise
        build = {"skipped": True, "reason": str(exc)}
    git = run(["git", "status", "--short", "--branch"], project, timeout=60) if (project / ".git").exists() else None
    return {
        "kind": "verify_candidate",
        "blocked": False,
        "tests": tests,
        "computation_truth": computation,
        "build": build,
        "worker": str(worker) if worker else None,
        "git": git,
    }


def execute_job(job: dict, root: Path, discovery: dict) -> dict:
    kind = job.get("kind")
    if kind not in SAFE_KINDS:
        raise RuntimeError(f"unsupported governed job kind: {kind}")
    project = selected_project(root, discovery)
    if kind in SAI_JOB_KINDS:
        # SAI implementation already performs its own exact-release proof.  Execute it from the
        # selected OMEGA project rather than the outer drive root.
        result = execute_sai_job(kind, job, project)
        if result.get("blocked"):
            return result
        return result
    if kind == "convergence_scan":
        return convergence_scan(root, project, discovery)
    if kind == "inspect_workspace":
        return {"kind": kind, "blocked": False, "inspection": inspect_workspace(root, project, discovery)}
    if kind == "inspect_runtime":
        return {"kind": kind, "blocked": False, "preflight": project_preflight(root, project, discovery)}
    if kind == "compute_truth_suite":
        return compute_truth_suite(root, project, discovery)
    if kind == "cross_runtime_validate":
        return cross_runtime_validate(job, root, project, discovery)
    if kind == "run_tests":
        return run_tests(root, project, discovery)
    if kind == "build_vite":
        return build_vite(root, project, discovery)
    if kind == "wrangler_dry_run":
        return wrangler_dry_run(root, project, discovery)
    if kind == "capture_screenshot":
        return screenshot(root)
    if kind == "verify_candidate":
        return verify_candidate(root, project, discovery)
    if kind in {"prepare_candidate", "cleanup_candidate"}:
        return {
            "kind": kind,
            "blocked": True,
            "reason": "R199 refuses implicit candidate mutation/cleanup without an explicit hash-bound mutation plan",
            "canonical_mutation": False,
        }
    return {"kind": kind, "blocked": True, "reason": "executor capability not installed on this host"}


def evidence_envelope(job: dict, result: dict, root: Path, discovery: dict, health: dict, agent_id: str, heartbeat_sequence: int) -> dict:
    core = {
        "schema": "OMEGA_SOVEREIGN_JOB_EVIDENCE_CORE_R199",
        "job_id": job.get("id"),
        "job_kind": job.get("kind"),
        "agent_id": agent_id,
        "heartbeat_sequence": heartbeat_sequence,
        "approved_root": str(root),
        "project_discovery": discovery,
        "resource_guard": health,
        "result": result,
        "blocked": bool(result.get("blocked")),
        "agent_revision": AGENT_REVISION,
        "runtime_version": RUNTIME_VERSION,
        "safety_policy": {
            "root_confined_execution": True,
            "heavy_operations_sequential": True,
            "below_normal_priority_on_windows": True,
            "implicit_dependency_install": False,
            "uncontrolled_system_optimization": False,
            "arbitrary_shell": False,
        },
    }
    canonical = canonical_json(core)
    return {
        **core,
        "return_receipt": {
            "schema": "OMEGA_SOVEREIGN_RETURN_RECEIPT_R199",
            "canonical_json": canonical,
            "sha256": sha256_text(canonical),
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="OMEGA sovereign heartbeat + R199 project-aware development agent")
    parser.add_argument("--server", default=os.getenv("OMEGA_SERVER", "https://omegav6.jeffdeweyeljefe.workers.dev"))
    parser.add_argument("--token", default=os.getenv("OMEGA_AGENT_TOKEN", ""))
    parser.add_argument("--root", default=os.getenv("OMEGA_APPROVED_ROOT", str(Path.cwd())))
    parser.add_argument("--agent-id", default=os.getenv("OMEGA_AGENT_ID", os.environ.get("COMPUTERNAME", socket.gethostname() or "omega-pc")))
    parser.add_argument("--interval", type=float, default=8.0)
    args = parser.parse_args()

    if not args.token:
        print("PAIRING REQUIRED: no OMEGA agent credential was supplied.", file=sys.stderr)
        return 3
    try:
        root = normalize_root(args.root)
    except OSError as exc:
        print(f"ROOT PATH INVALID: {args.root!r}: {exc}", file=sys.stderr)
        return 2
    if not root.exists() or not root.is_dir():
        print(f"ROOT REJECTED: {root}", file=sys.stderr)
        return 2

    print(f"OMEGA sovereign agent {AGENT_REVISION} starting: {args.agent_id}")
    print(f"Canonical server: {args.server}")
    print(f"Approved root: {root}")
    print("OMEGA sovereign heartbeat and execution policy: project-aware, root-confined, resource-gated, reversible-by-design.")
    print("No implicit dependency installation. No arbitrary shell. No registry/service/power-plan optimization.")

    discovery = discover_projects(root)
    if not discovery.get("selected"):
        print("PROJECT DISCOVERY: no buildable project found yet. Heartbeat will stay active and discovery will retry.")
    else:
        print("PROJECT DISCOVERY:", discovery["selected"]["relative_path"], "confidence", discovery["confidence"])
    health = host_health(root, discovery)
    print("RESOURCE GUARD:", "READY" if health["ready_for_heavy_work"] else "HEAVY WORK BLOCKED")

    capabilities = [
        "heartbeat", "project_discovery_r199", "resource_guard_r199", "convergence_scan",
        "inspect_workspace", "inspect_runtime", "compute_truth_suite", "cross_runtime_validate",
        "run_tests", "build_vite", "wrangler_dry_run", "verify_candidate", "capture_screenshot",
    ]
    project = None
    try:
        project = selected_project(root, discovery)
    except Exception:
        project = None
    if project:
        rcwa_probe = rcwa_dependency_status(project)
        if rcwa_probe.get("available"):
            capabilities.extend(["independent_fullwave_rcwa", "maxwell_rcwa_grcwa"])
        else:
            capabilities.append("rcwa_dependency_probe")
        try:
            sai_caps, sai_probe = sai_capabilities(project)
            capabilities.extend(sai_caps)
            print("SAI B059 state:", sai_probe.get("state", "UNKNOWN"))
        except Exception as exc:
            print("SAI probe unavailable:", exc)

    last_job_id = None
    sequence_seen = 0
    last_discovery_at = 0.0
    failures = 0
    while True:
        try:
            if time.monotonic() - last_discovery_at >= 60:
                discovery = discover_projects(root)
                health = host_health(root, discovery)
                last_discovery_at = time.monotonic()

            hb = request_json(args.server, "/api/device/heartbeat", args.token, {
                "agent_id": args.agent_id,
                "approved_root": str(root),
                "capabilities": sorted(set(capabilities)),
                "runtime_version": RUNTIME_VERSION,
                "last_job_id": last_job_id,
            }, timeout=20)
            proof = hb.get("proof") or {}
            sequence_seen = int(proof.get("sequence") or sequence_seen)
            state = hb.get("state", "UNKNOWN")
            age = hb.get("heartbeat_age_seconds")
            if failures or sequence_seen <= 1:
                print(f"heartbeat #{sequence_seen}: {state} age={age}s")
            failures = 0

            leased = request_json(args.server, "/api/development/lease", args.token, {"agent_id": args.agent_id}, timeout=30)
            job = leased.get("job")
            if job:
                last_job_id = job["id"]
                print(f"job {last_job_id} · {job.get('kind')} · LEASED")
                request_json(args.server, f"/api/development/jobs/{last_job_id}/result", args.token, {
                    "state": "RUNNING",
                    "evidence": {
                        "schema": "OMEGA_HOST_EXECUTION_START_R199",
                        "agent_id": args.agent_id,
                        "heartbeat_sequence": sequence_seen,
                        "project_discovery": discovery,
                        "resource_guard": health,
                    },
                }, timeout=30)
                try:
                    result = execute_job(job, root, discovery)
                    health_after = host_health(root, discovery)
                    evidence = evidence_envelope(job, result, root, discovery, health_after, args.agent_id, sequence_seen)
                    blocked = bool(result.get("blocked"))
                    request_json(args.server, f"/api/development/jobs/{last_job_id}/result", args.token, {
                        "state": "BLOCKED" if blocked else "VERIFIED",
                        "evidence": evidence,
                        "error": result.get("reason") if blocked else None,
                    }, timeout=60)
                    print(f"job {last_job_id} · {job.get('kind')} · {'BLOCKED' if blocked else 'VERIFIED'} · receipt {evidence['return_receipt']['sha256'][:16]}…")
                except Exception as exc:
                    failure_core = {
                        "schema": "OMEGA_SOVEREIGN_JOB_FAILURE_R199",
                        "job_id": last_job_id,
                        "job_kind": job.get("kind"),
                        "agent_id": args.agent_id,
                        "heartbeat_sequence": sequence_seen,
                        "project_discovery": discovery,
                        "resource_guard": host_health(root, discovery),
                        "error": str(exc)[:12000],
                    }
                    failure_canonical = canonical_json(failure_core)
                    failure_core["return_receipt"] = {
                        "schema": "OMEGA_SOVEREIGN_RETURN_RECEIPT_R199",
                        "canonical_json": failure_canonical,
                        "sha256": sha256_text(failure_canonical),
                    }
                    request_json(args.server, f"/api/development/jobs/{last_job_id}/result", args.token, {
                        "state": "FAILED",
                        "evidence": failure_core,
                        "error": str(exc)[:12000],
                    }, timeout=60)
                    print(f"job {last_job_id} · {job.get('kind')} · FAILED: {exc}", file=sys.stderr)
        except urllib.error.HTTPError as exc:
            failures += 1
            if exc.code in {401, 403}:
                print("AUTHENTICATION REJECTED: download a fresh canonical launcher to rotate pairing.", file=sys.stderr)
            else:
                print(f"HTTP error: {exc.code} {exc.reason}", file=sys.stderr)
        except (urllib.error.URLError, TimeoutError, OSError, json.JSONDecodeError) as exc:
            failures += 1
            print(f"connection error: {exc}", file=sys.stderr)
        except KeyboardInterrupt:
            print("Hybrid Link stopped by user. PC ONLINE will age to HEARTBEAT STALE.")
            return 0
        time.sleep(min(20.0, max(3.0, args.interval) + max(0, failures - 1) * 2.0))


if __name__ == "__main__":
    raise SystemExit(main())
