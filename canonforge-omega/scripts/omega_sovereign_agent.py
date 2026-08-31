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

SAFE_KINDS = {
    "inspect_workspace",
    "inspect_runtime",
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
        req.add_header("x-omega-gateway-token", token)
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


def execute_job(job: dict, root: Path) -> dict:
    kind = job.get("kind")
    if kind not in SAFE_KINDS:
        raise RuntimeError(f"unsupported governed job kind: {kind}")
    if kind in {"inspect_workspace", "inspect_runtime"}:
        return {"kind": kind, "inspection": inspect_workspace(root)}
    if kind == "run_tests":
        return {"kind": kind, "result": run([sys.executable, "-m", "pytest", "-q"], root)}
    if kind == "build_vite":
        web = root / "cloudflare" / "omega-v6-worker"
        return {"kind": kind, "result": run(["npm", "run", "typecheck"], web)}
    if kind == "wrangler_dry_run":
        web = root / "cloudflare" / "omega-v6-worker"
        return {"kind": kind, "result": run(["npx", "wrangler", "deploy", "--dry-run"], web)}
    if kind == "verify_candidate":
        return {
            "kind": kind,
            "tests": run([sys.executable, "-m", "pytest", "-q"], root),
            "git": run(["git", "status", "--short", "--branch"], root, timeout=60),
        }
    # These remain bounded placeholders until a browser/screenshot or worktree executor is installed.
    return {"kind": kind, "blocked": True, "reason": "executor capability not installed on this host yet"}


def main() -> int:
    parser = argparse.ArgumentParser(description="OMEGA sovereign heartbeat + bounded development agent")
    parser.add_argument("--server", default=os.getenv("OMEGA_SERVER", "http://127.0.0.1:8000"))
    parser.add_argument("--token", default=os.getenv("OMEGA_GATEWAY_TOKEN", ""))
    parser.add_argument("--root", default=os.getenv("OMEGA_APPROVED_ROOT", str(Path.cwd())))
    parser.add_argument("--agent-id", default=os.getenv("OMEGA_AGENT_ID", os.environ.get("COMPUTERNAME", "omega-pc")))
    parser.add_argument("--interval", type=float, default=10.0)
    args = parser.parse_args()

    root = Path(args.root).expanduser().resolve()
    if not root.exists() or not root.is_dir():
        print(f"ROOT REJECTED: {root}", file=sys.stderr)
        return 2

    capabilities = ["heartbeat", "inspect_workspace", "inspect_runtime", "run_tests", "build_vite", "wrangler_dry_run", "verify_candidate"]
    last_job_id = None
    print(f"OMEGA agent online candidate: {args.agent_id} root={root}")
    while True:
        try:
            hb = request_json(args.server, "/api/device/heartbeat", args.token, {
                "agent_id": args.agent_id,
                "approved_root": str(root),
                "capabilities": capabilities,
                "runtime_version": "r77-heartbeat-build-agent",
                "last_job_id": last_job_id,
            })
            state = hb.get("state", hb.get("device", {}).get("state", "UNKNOWN"))
            print(f"heartbeat: {state}")

            leased = request_json(args.server, "/api/development/lease", args.token, {"agent_id": args.agent_id})
            job = leased.get("job")
            if job:
                last_job_id = job["id"]
                request_json(args.server, f"/api/development/jobs/{last_job_id}/result", args.token, {
                    "state": "RUNNING", "evidence": {"agent_id": args.agent_id, "root": str(root)}
                })
                try:
                    evidence = execute_job(job, root)
                    blocked = bool(evidence.get("blocked"))
                    request_json(args.server, f"/api/development/jobs/{last_job_id}/result", args.token, {
                        "state": "BLOCKED" if blocked else "VERIFIED",
                        "evidence": evidence,
                        "error": evidence.get("reason") if blocked else None,
                    })
                    print(f"job {last_job_id} {job.get('kind')}: {'BLOCKED' if blocked else 'VERIFIED'}")
                except Exception as exc:
                    request_json(args.server, f"/api/development/jobs/{last_job_id}/result", args.token, {
                        "state": "FAILED", "evidence": {"agent_id": args.agent_id}, "error": str(exc)
                    })
                    print(f"job {last_job_id} failed: {exc}", file=sys.stderr)
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, OSError, json.JSONDecodeError) as exc:
            print(f"connection error: {exc}", file=sys.stderr)
        time.sleep(max(3.0, args.interval))


if __name__ == "__main__":
    raise SystemExit(main())
