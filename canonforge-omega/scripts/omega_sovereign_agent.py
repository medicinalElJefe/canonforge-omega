from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import time
import urllib.error
import urllib.request

from omega_runtime.cross_runtime import (
    CROSS_RUNTIME_CHALLENGE_SCHEMA,
    native_reference_receipt,
)

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
}


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
    proc = subprocess.run(cmd, cwd=str(cwd), capture_output=True, text=True, timeout=timeout)
    return {
        "command": cmd,
        "exit_code": proc.returncode,
        "stdout_tail": proc.stdout[-12000:],
        "stderr_tail": proc.stderr[-12000:],
        "elapsed_seconds": round(time.time() - started, 3),
    }


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


def cross_runtime_validate(job: dict, root: Path) -> dict:
    payload = job.get("payload") if isinstance(job.get("payload"), dict) else {}
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
    try:
        receipt = native_reference_receipt(path, canonical_input)
    except Exception as exc:
        return {"kind": "cross_runtime_validate", "blocked": True, "reason": f"native R173 reference execution failed: {exc}"}
    if receipt.get("input_sha256") != input_sha:
        return {"kind": "cross_runtime_validate", "blocked": True, "reason": "native input hash does not match the cloud challenge"}
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

    capabilities = [
        "heartbeat", "convergence_scan", "inspect_workspace", "inspect_runtime", "compute_truth_suite",
        "cross_runtime_validate", "lorentz_reference", "tmm_reference", "conservative_continuity", "scalar_wave_fdtd_1d",
        "atlas_reference_diffusion_20736", "run_tests", "build_vite", "wrangler_dry_run", "verify_candidate",
    ]
    last_job_id = None
    sequence_seen = 0
    print(f"OMEGA sovereign agent starting: {args.agent_id}")
    print(f"Canonical server: {args.server}")
    print(f"Approved root: {root}")
    print("Recursive convergence is bounded: archive/branch discovery may propose candidates but cannot silently promote production.")
    print("R173 cross-runtime parity is receipt-bound: cloud challenges become L3 validation only after authenticated native execution is persisted and numerically compared.")
    print("PC ONLINE will only be claimed after the server accepts a current authenticated heartbeat.")

    while True:
        try:
            hb = request_json(args.server, "/api/device/heartbeat", args.token, {
                "agent_id": args.agent_id,
                "approved_root": str(root),
                "capabilities": capabilities,
                "runtime_version": "r173-cross-runtime-parity-agent",
                "last_job_id": last_job_id,
            })
            proof = hb.get("proof") or hb.get("device", {}).get("proof") or {}
            sequence_seen = int(proof.get("sequence") or sequence_seen)
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
