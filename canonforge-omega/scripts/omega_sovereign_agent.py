from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request

from omega_runtime.agent_sai_r179 import SAI_JOB_KINDS, execute_sai_job, sai_capabilities

CROSS_RUNTIME_CHALLENGE_SCHEMA = "OMEGA_CROSS_RUNTIME_CHALLENGE_R173"
INDEPENDENT_SOLVER_CHALLENGE_SCHEMA = "OMEGA_INDEPENDENT_SOLVER_CHALLENGE_R175"
RCWA_REQUIRED_PACKAGES = ("numpy>=1.24", "grcwa==0.1.2")

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

BASE_CAPABILITIES = [
    "heartbeat", "convergence_scan", "inspect_workspace", "inspect_runtime", "compute_truth_suite",
    "cross_runtime_validate", "lorentz_reference", "tmm_reference", "conservative_continuity", "scalar_wave_fdtd_1d",
    "atlas_reference_diffusion_20736", "run_tests", "build_vite", "wrangler_dry_run", "verify_candidate",
]


def request_json(base: str, path: str, token: str, payload: dict | None = None) -> dict:
    url = base.rstrip("/") + path
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="GET" if payload is None else "POST")
    req.add_header("accept", "application/json")
    if data is not None:
        req.add_header("content-type", "application/json")
    if token:
        req.add_header("x-omega-agent-token", token)
    with urllib.request.urlopen(req, timeout=20) as response:
        return json.loads(response.read().decode("utf-8"))


def run(cmd: list[str], cwd: Path, timeout: int = 300) -> dict:
    started = time.time()
    try:
        proc = subprocess.run(cmd, cwd=str(cwd), capture_output=True, text=True, timeout=timeout)
        return {
            "command": cmd,
            "exit_code": proc.returncode,
            "stdout_tail": proc.stdout[-12000:],
            "stderr_tail": proc.stderr[-12000:],
            "elapsed_seconds": round(time.time() - started, 3),
            "timed_out": False,
        }
    except subprocess.TimeoutExpired as exc:
        stdout = exc.stdout.decode("utf-8", errors="replace") if isinstance(exc.stdout, bytes) else (exc.stdout or "")
        stderr = exc.stderr.decode("utf-8", errors="replace") if isinstance(exc.stderr, bytes) else (exc.stderr or "")
        return {
            "command": cmd,
            "exit_code": 124,
            "stdout_tail": stdout[-12000:],
            "stderr_tail": stderr[-12000:],
            "elapsed_seconds": round(time.time() - started, 3),
            "timed_out": True,
            "reason": f"command exceeded bounded timeout of {timeout}s",
        }
    except OSError as exc:
        return {
            "command": cmd,
            "exit_code": 127,
            "stdout_tail": "",
            "stderr_tail": str(exc),
            "elapsed_seconds": round(time.time() - started, 3),
            "timed_out": False,
            "reason": f"host executable unavailable: {exc}",
        }


def canonical_json(value) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, default=str)


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def inspect_workspace(root: Path) -> dict:
    entries = sorted(p.name for p in root.iterdir())[:500]
    git = run(["git", "status", "--short", "--branch"], root, timeout=60) if (root / ".git").exists() else None
    return {
        "root": str(root),
        "exists": root.exists(),
        "is_dir": root.is_dir(),
        "entries": entries,
        "git": git,
    }


def convergence_scan(root: Path) -> dict:
    tool = root / "tools" / "omega_convergence_cycle.py"
    if not tool.exists():
        return {"kind": "convergence_scan", "blocked": True, "reason": f"missing convergence tool: {tool}"}
    fetch = run(["git", "fetch", "origin", "--prune"], root, timeout=180)
    result = run([
        sys.executable,
        str(tool),
        "--canonical-ref", "omega-v6-full-convergence",
        "--genesis-ref", "omega-genesis-v1-full",
        "--output", str(root / "convergence" / "latest.json"),
    ], root, timeout=300)
    snapshot_path = root / "convergence" / "latest.json"
    snapshot = None
    if snapshot_path.exists():
        try:
            snapshot = json.loads(snapshot_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            snapshot = None
    return {
        "kind": "convergence_scan",
        "fetch": fetch,
        "result": result,
        "snapshot": snapshot,
        "snapshot_path": str(snapshot_path),
    }


def compute_truth_suite(root: Path) -> dict:
    result = run([sys.executable, "-m", "omega_runtime.advanced_computation"], root, timeout=120)
    parsed = None
    if result["exit_code"] == 0:
        try:
            parsed = json.loads(result["stdout_tail"])
        except json.JSONDecodeError:
            parsed = None
    passed = bool(parsed and parsed.get("passed") is True and parsed.get("receipt_sha256"))
    return {
        "kind": "compute_truth_suite",
        "result": result,
        "truth_suite": parsed,
        "blocked": not passed,
        "reason": None if passed else "R170 computation truth suite did not return a passing hash-receipted result",
        "authority": "DERIVED_REFERENCE_COMPUTATION_NOT_CANON",
        "native_execution": True,
        "physical_dimension_claim": False,
        "fabrication_grade_optical_claim": False,
    }


def rcwa_dependency_status(root: Path) -> dict:
    execution = run([sys.executable, "-m", "omega_runtime.rcwa_solver", "--probe"], root, timeout=60)
    parsed = None
    try:
        parsed = json.loads(execution["stdout_tail"])
    except json.JSONDecodeError:
        parsed = None
    return {
        "available": bool(execution["exit_code"] == 0 and parsed and parsed.get("available") is True),
        "probe": parsed,
        "exit_code": execution["exit_code"],
        "executor": execution,
    }


def repair_rcwa_dependencies(root: Path) -> dict:
    """Bounded, exact self-repair for the only native RCWA packages OMEGA requires.

    This is dependency preparation, not solver execution and never becomes a proof
    receipt. A fresh --probe is mandatory after installation.
    """
    before = rcwa_dependency_status(root)
    if before["available"]:
        return {"attempted": False, "repaired": True, "before": before, "after": before, "install": None}
    install = run(
        [sys.executable, "-m", "pip", "install", "--disable-pip-version-check", *RCWA_REQUIRED_PACKAGES],
        root,
        timeout=300,
    )
    after = rcwa_dependency_status(root)
    return {
        "attempted": True,
        "repaired": bool(install["exit_code"] == 0 and after["available"]),
        "before": before,
        "after": after,
        "install": install,
        "packages": list(RCWA_REQUIRED_PACKAGES),
        "fallback": False,
    }


def runtime_capabilities(root: Path) -> tuple[list[str], dict, dict]:
    rcwa_probe = rcwa_dependency_status(root)
    capabilities = list(BASE_CAPABILITIES)
    if rcwa_probe["available"]:
        capabilities.extend(["independent_fullwave_rcwa", "maxwell_rcwa_grcwa"])
    else:
        capabilities.append("rcwa_dependency_probe")
    sai_caps, sai_probe = sai_capabilities(root)
    capabilities.extend(sai_caps)
    return sorted(set(capabilities)), rcwa_probe, sai_probe


def independent_fullwave_validate(job: dict, root: Path) -> dict:
    payload = job.get("payload") if isinstance(job.get("payload"), dict) else {}
    canonical_queue = payload.get("queue_job_canonical_json")
    queue_sha = payload.get("queue_job_sha256")
    challenge_sha = payload.get("challenge_sha256")
    challenge_id = payload.get("challenge_id")
    if payload.get("schema") != INDEPENDENT_SOLVER_CHALLENGE_SCHEMA:
        return {"kind": "cross_runtime_validate", "blocked": True, "reason": "R175 independent solver challenge schema is missing or invalid"}
    if not isinstance(canonical_queue, str) or not canonical_queue:
        return {"kind": "cross_runtime_validate", "blocked": True, "reason": "R175 canonical full-wave queue is missing"}
    if not all(isinstance(value, str) and len(value) == 64 for value in (queue_sha, challenge_sha)):
        return {"kind": "cross_runtime_validate", "blocked": True, "reason": "R175 challenge hashes are incomplete"}
    if sha256_text(canonical_queue) != queue_sha:
        return {"kind": "cross_runtime_validate", "blocked": True, "reason": "R175 canonical full-wave queue hash mismatch"}
    try:
        queue_job = json.loads(canonical_queue)
    except json.JSONDecodeError:
        return {"kind": "cross_runtime_validate", "blocked": True, "reason": "R175 canonical full-wave queue is not valid JSON"}
    if queue_job.get("schema") != "OMEGA_FULLWAVE_QUEUE_v1" or str(queue_job.get("solver", "")).lower() != "rcwa":
        return {"kind": "cross_runtime_validate", "blocked": True, "reason": "R175 challenge is not an RCWA full-wave queue"}

    dependencies = rcwa_dependency_status(root)
    dependency_repair = None
    if not dependencies["available"]:
        dependency_repair = repair_rcwa_dependencies(root)
        dependencies = dependency_repair["after"]
    if not dependencies["available"]:
        return {
            "kind": "cross_runtime_validate",
            "schema": "OMEGA_SOVEREIGN_INDEPENDENT_SOLVER_RESULT_R175",
            "blocked": True,
            "reason": "R175 RCWA dependencies remain unavailable after bounded exact repair on the authenticated Sovereign host; no fallback is permitted",
            "challenge_id": challenge_id,
            "challenge_sha256": challenge_sha,
            "queue_job_sha256": queue_sha,
            "dependency_status": dependencies,
            "dependency_repair": dependency_repair,
            "independent_solver_family_claim": False,
            "native_execution": False,
            "canonical_mutation": False,
        }

    execution = run([
        sys.executable,
        "-m", "omega_runtime.rcwa_solver",
        "--input-json",
        canonical_queue,
    ], root, timeout=600)
    try:
        result = json.loads(execution["stdout_tail"])
    except json.JSONDecodeError:
        return {
            "kind": "cross_runtime_validate",
            "schema": "OMEGA_SOVEREIGN_INDEPENDENT_SOLVER_RESULT_R175",
            "blocked": True,
            "reason": "native R175 RCWA execution did not return a JSON result",
            "native_executor": execution,
            "dependency_status": dependencies,
            "dependency_repair": dependency_repair,
            "independent_solver_family_claim": False,
            "native_execution": False,
            "canonical_mutation": False,
        }
    if execution["exit_code"] != 0 or result.get("converged") is not True:
        return {
            "kind": "cross_runtime_validate",
            "schema": "OMEGA_SOVEREIGN_INDEPENDENT_SOLVER_RESULT_R175",
            "blocked": True,
            "reason": "native R175 RCWA execution failed or did not converge",
            "challenge_id": challenge_id,
            "challenge_sha256": challenge_sha,
            "queue_job_sha256": queue_sha,
            "native_result": result,
            "native_executor": {"exit_code": execution["exit_code"], "elapsed_seconds": execution["elapsed_seconds"], "timed_out": execution.get("timed_out", False)},
            "dependency_status": dependencies,
            "dependency_repair": dependency_repair,
            "independent_solver_family_claim": False,
            "native_execution": False,
            "canonical_mutation": False,
        }
    identity = result.get("numerical_identity") or {}
    receipt = result.get("receipt") or {}
    if identity.get("input_sha256") != queue_sha or receipt.get("input_sha256") != queue_sha:
        return {
            "kind": "cross_runtime_validate",
            "blocked": True,
            "reason": "native R175 RCWA input hash does not match the persisted full-wave challenge",
            "native_result": result,
            "dependency_repair": dependency_repair,
            "independent_solver_family_claim": False,
            "native_execution": False,
            "canonical_mutation": False,
        }
    if result.get("solver") != "rcwa" or result.get("solver_family") != "MAXWELL_RCWA" or not str(result.get("solver_version", "")).startswith("grcwa:"):
        return {
            "kind": "cross_runtime_validate",
            "blocked": True,
            "reason": "native R175 result is not a grcwa Maxwell-RCWA receipt",
            "native_result": result,
            "dependency_repair": dependency_repair,
            "independent_solver_family_claim": False,
            "native_execution": False,
            "canonical_mutation": False,
        }
    return {
        "kind": "cross_runtime_validate",
        "schema": "OMEGA_SOVEREIGN_INDEPENDENT_SOLVER_RESULT_R175",
        "challenge_id": challenge_id,
        "challenge_sha256": challenge_sha,
        "queue_job_sha256": queue_sha,
        "native_result": result,
        "native_receipt": receipt,
        "native_executor": {"exit_code": execution["exit_code"], "elapsed_seconds": execution["elapsed_seconds"], "timed_out": execution.get("timed_out", False)},
        "dependency_status": dependencies,
        "dependency_repair": dependency_repair,
        "native_execution": True,
        "blocked": False,
        "authority": "AUTHENTICATED_INDEPENDENT_SOLVER_RECEIPT_NOT_CANON",
        "canonical_mutation": False,
        "independent_solver_family_claim": True,
        "external_measurement_claim": False,
        "physical_dimension_claim": False,
        "approved_root": str(root),
    }


def cross_runtime_validate(job: dict, root: Path) -> dict:
    payload = job.get("payload") if isinstance(job.get("payload"), dict) else {}
    if payload.get("schema") == INDEPENDENT_SOLVER_CHALLENGE_SCHEMA:
        return independent_fullwave_validate(job, root)
    if payload.get("schema") != CROSS_RUNTIME_CHALLENGE_SCHEMA:
        return {"kind": "cross_runtime_validate", "blocked": True, "reason": "R173 challenge schema is missing or invalid"}
    path = payload.get("path")
    canonical_input = payload.get("input_canonical_json")
    input_sha = payload.get("input_sha256")
    challenge_sha = payload.get("challenge_sha256")
    cloud_result_sha = payload.get("cloud_result_sha256")
    cloud_receipt_sha = payload.get("cloud_receipt_sha256")
    challenge_id = payload.get("challenge_id")
    if not isinstance(path, str) or not path.startswith("/api/compute/"):
        return {"kind": "cross_runtime_validate", "blocked": True, "reason": "R173 challenge path is invalid"}
    if not isinstance(canonical_input, str) or not canonical_input:
        return {"kind": "cross_runtime_validate", "blocked": True, "reason": "R173 canonical input is missing"}
    if not all(isinstance(value, str) and len(value) == 64 for value in (input_sha, challenge_sha, cloud_result_sha, cloud_receipt_sha)):
        return {"kind": "cross_runtime_validate", "blocked": True, "reason": "R173 challenge hashes are incomplete"}

    execution = run([
        sys.executable,
        "-m",
        "omega_runtime.cross_runtime_cli",
        "--path",
        path,
        "--input-json",
        canonical_input,
    ], root, timeout=180)
    if execution["exit_code"] != 0:
        return {
            "kind": "cross_runtime_validate",
            "blocked": True,
            "reason": "native R173 reference execution failed",
            "native_executor": execution,
        }
    try:
        receipt = json.loads(execution["stdout_tail"])
    except json.JSONDecodeError:
        return {
            "kind": "cross_runtime_validate",
            "blocked": True,
            "reason": "native R173 reference execution did not return a JSON receipt",
            "native_executor": execution,
        }
    if receipt.get("input_sha256") != input_sha:
        return {"kind": "cross_runtime_validate", "blocked": True, "reason": "native input hash does not match the cloud challenge", "native_receipt": receipt}
    return {
        "kind": "cross_runtime_validate",
        "schema": "OMEGA_SOVEREIGN_CROSS_RUNTIME_RESULT_R173",
        "challenge_id": challenge_id,
        "challenge_sha256": challenge_sha,
        "path": path,
        "input_sha256": input_sha,
        "cloud_result_sha256": cloud_result_sha,
        "cloud_receipt_sha256": cloud_receipt_sha,
        "native_receipt": receipt,
        "native_executor": {"exit_code": execution["exit_code"], "elapsed_seconds": execution["elapsed_seconds"]},
        "native_execution": True,
        "blocked": False,
        "authority": "AUTHENTICATED_NATIVE_EXECUTION_RECEIPT_NOT_CANON",
        "canonical_mutation": False,
        "independent_solver_family_claim": False,
        "physical_dimension_claim": False,
        "approved_root": str(root),
    }


def execute_job(job: dict, root: Path) -> dict:
    kind = job.get("kind")
    if kind not in SAFE_KINDS:
        raise RuntimeError(f"unsupported governed job kind: {kind}")
    if kind in SAI_JOB_KINDS:
        return execute_sai_job(kind, job, root)
    if kind == "convergence_scan":
        return convergence_scan(root)
    if kind in {"inspect_workspace", "inspect_runtime"}:
        return {"kind": kind, "inspection": inspect_workspace(root)}
    if kind == "compute_truth_suite":
        return compute_truth_suite(root)
    if kind == "cross_runtime_validate":
        return cross_runtime_validate(job, root)
    if kind == "run_tests":
        return {"kind": kind, "result": run([sys.executable, "-m", "pytest", "-q"], root)}
    if kind == "build_vite":
        web = root / "cloudflare" / "omega-v6-worker"
        return {"kind": kind, "result": run(["npm", "run", "typecheck"], web)}
    if kind == "wrangler_dry_run":
        web = root / "cloudflare" / "omega-v6-worker"
        return {"kind": kind, "result": run(["npx", "wrangler", "deploy", "--dry-run"], web)}
    if kind == "verify_candidate":
        convergence_path = root / "convergence" / "latest.json"
        convergence = None
        if convergence_path.exists():
            try:
                convergence = json.loads(convergence_path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                convergence = None
        computation = compute_truth_suite(root)
        return {
            "kind": kind,
            "tests": run([sys.executable, "-m", "pytest", "-q"], root),
            "computation_truth": computation,
            "git": run(["git", "status", "--short", "--branch"], root, timeout=60),
            "convergence": convergence,
        }
    return {"kind": kind, "blocked": True, "reason": "executor capability not installed on this host yet"}


def normalize_root(raw: str) -> Path:
    cleaned = raw.strip().strip('"').strip("'")
    if len(cleaned) == 2 and cleaned[1] == ":":
        cleaned += "\\"
    return Path(cleaned).expanduser().resolve()


def main() -> int:
    parser = argparse.ArgumentParser(description="OMEGA sovereign heartbeat + bounded recursive development agent")
    parser.add_argument("--server", default=os.getenv("OMEGA_SERVER", "https://omegav6.jeffdeweyeljefe.workers.dev"))
    parser.add_argument("--token", default=os.getenv("OMEGA_AGENT_TOKEN", ""))
    parser.add_argument("--root", default=os.getenv("OMEGA_APPROVED_ROOT", str(Path.cwd())))
    parser.add_argument("--agent-id", default=os.getenv("OMEGA_AGENT_ID", os.environ.get("COMPUTERNAME", "omega-pc")))
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

    initial_rcwa_repair = repair_rcwa_dependencies(root)
    capabilities, rcwa_probe, sai_probe = runtime_capabilities(root)
    last_job_id = None
    sequence_seen = 0
    heartbeat_lock = threading.Lock()
    heartbeat_interval = max(3.0, min(float(args.interval), 12.0))

    print(f"OMEGA sovereign agent starting: {args.agent_id}")
    print(f"Canonical server: {args.server}")
    print(f"Approved root: {root}")
    print("Recursive convergence is bounded: archive/branch discovery may propose candidates but cannot silently promote production.")
    print("R173 cross-runtime parity is receipt-bound: cloud challenges become L3 validation only after authenticated native execution is persisted and numerically compared.")
    print("R175 independent-solver validation is no-fallback: L4 requires current authenticated native grcwa RCWA execution, numerical convergence, persisted receipt identity, and proof admission.")
    print("R175 RCWA bounded dependency repair: " + ("READY" if rcwa_probe["available"] else "FAILED / NO FALLBACK"))
    if initial_rcwa_repair["attempted"]:
        print("R175 RCWA startup repair attempted: " + ("PASS" if initial_rcwa_repair["repaired"] else "BLOCKED"))
    print("R179 SAI B059 state: " + str(sai_probe.get("state", "UNKNOWN")))
    print("R179 training law: B059 is fully trained only inside its declared deterministic source-grounded corpus scope after exact release hash + runtime selftest proof; external provider-model weights remain separately pretrained.")
    print("PC ONLINE remains heartbeat-backed during long training/RCWA execution; a running bounded job must not make the host look offline.")

    def heartbeat_once() -> dict:
        nonlocal sequence_seen
        with heartbeat_lock:
            hb = request_json(args.server, "/api/device/heartbeat", args.token, {
                "agent_id": args.agent_id,
                "approved_root": str(root),
                "capabilities": capabilities,
                "runtime_version": "r221-train-rcwa-continuity-agent",
                "rcwa": rcwa_probe,
                "sai_b059": sai_probe,
                "last_job_id": last_job_id,
            })
        proof = hb.get("proof") or hb.get("device", {}).get("proof") or {}
        sequence_seen = int(proof.get("sequence") or sequence_seen)
        return hb

    def keepalive(stop: threading.Event) -> None:
        while not stop.wait(heartbeat_interval):
            try:
                hb = heartbeat_once()
                state = hb.get("state", hb.get("device", {}).get("state", "UNKNOWN"))
                print(f"job heartbeat #{sequence_seen}: {state}")
            except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, OSError, json.JSONDecodeError) as exc:
                print(f"job heartbeat warning: {exc}", file=sys.stderr)

    while True:
        try:
            hb = heartbeat_once()
            age = hb.get("heartbeat_age_seconds")
            state = hb.get("state", hb.get("device", {}).get("state", "UNKNOWN"))
            print(f"heartbeat #{sequence_seen}: {state} age={age}s")

            leased = request_json(args.server, "/api/development/lease", args.token, {"agent_id": args.agent_id})
            job = leased.get("job")
            if job:
                last_job_id = job["id"]
                request_json(args.server, f"/api/development/jobs/{last_job_id}/result", args.token, {
                    "state": "RUNNING", "evidence": {"agent_id": args.agent_id, "root": str(root), "heartbeat_sequence": sequence_seen}
                })
                stop = threading.Event()
                keeper = threading.Thread(target=keepalive, args=(stop,), name="omega-job-heartbeat", daemon=True)
                keeper.start()
                try:
                    evidence = execute_job(job, root)
                    evidence["agent_id"] = args.agent_id
                    evidence["heartbeat_sequence"] = sequence_seen
                    blocked = bool(evidence.get("blocked"))
                    request_json(args.server, f"/api/development/jobs/{last_job_id}/result", args.token, {
                        "state": "BLOCKED" if blocked else "VERIFIED",
                        "evidence": evidence,
                        "error": evidence.get("reason") if blocked else None,
                    })
                    print(f"job {last_job_id} {job.get('kind')}: {'BLOCKED' if blocked else 'VERIFIED'}")
                except Exception as exc:
                    request_json(args.server, f"/api/development/jobs/{last_job_id}/result", args.token, {
                        "state": "FAILED", "evidence": {"agent_id": args.agent_id, "heartbeat_sequence": sequence_seen}, "error": str(exc)
                    })
                    print(f"job {last_job_id} failed: {exc}", file=sys.stderr)
                finally:
                    stop.set()
                    keeper.join(timeout=max(heartbeat_interval + 2.0, 5.0))
                    capabilities, rcwa_probe, sai_probe = runtime_capabilities(root)
                    try:
                        heartbeat_once()
                    except Exception as exc:
                        print(f"post-job heartbeat warning: {exc}", file=sys.stderr)
        except urllib.error.HTTPError as exc:
            if exc.code in {401, 403}:
                print("AUTHENTICATION REJECTED: rotate pairing by downloading a fresh launcher.", file=sys.stderr)
            else:
                print(f"HTTP error: {exc.code} {exc.reason}", file=sys.stderr)
        except (urllib.error.URLError, TimeoutError, OSError, json.JSONDecodeError) as exc:
            print(f"connection error: {exc}", file=sys.stderr)
        time.sleep(max(3.0, args.interval))


if __name__ == "__main__":
    raise SystemExit(main())
