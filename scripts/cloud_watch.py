from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from omega_genesis.autodeploy import (
    deployment_decision,
    fetch_promotion,
    load_policy,
    read_active_image,
    utc_epoch,
    validate_promotion,
)
from omega_genesis.deployment import append_jsonl, atomic_json


def _read_json(path: Path) -> dict:
    if not path.is_file():
        return {}
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
        return value if isinstance(value, dict) else {}
    except Exception:
        return {}


def _run_deployer(script: Path, candidate: str, state_dir: Path, health_url: str) -> subprocess.CompletedProcess[str]:
    command = [
        sys.executable,
        str(script),
        "--image", candidate,
        "--state-dir", str(state_dir),
        "--health-url", health_url,
    ]
    print("+", " ".join(command), flush=True)
    return subprocess.run(
        command,
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
    )


def run_cycle() -> dict:
    policy = load_policy(ROOT)
    state_dir = Path(os.environ.get("OMEGA_DEPLOY_STATE_DIR", policy.state_dir)).expanduser().resolve()
    health_url = os.environ.get("OMEGA_DEPLOY_HEALTH_URL", policy.health_url)
    state_dir.mkdir(parents=True, exist_ok=True)
    watch_status = state_dir / "watch-status.json"
    watch_journal = state_dir / "watch-journal.jsonl"

    try:
        promotion = fetch_promotion(policy.promotion_url)
        validation = validate_promotion(promotion, policy.expected_image_repository)
        if validation["status"] != "PASS":
            raise RuntimeError("governed promotion invalid: " + ",".join(validation["errors"]))

        candidate = str(validation["image"])
        current = read_active_image(state_dir / "current.json")
        previous_watch = _read_json(watch_status)
        decision, detail = deployment_decision(
            candidate,
            current,
            previous_watch.get("failed_candidate"),
            previous_watch.get("failed_at_epoch"),
            utc_epoch(),
            policy.failure_backoff_seconds,
        )

        if decision != "DEPLOY":
            record = {
                "schema": "omega.cloud.autodeploy-watch.v1",
                "status": decision,
                "candidate_image": candidate,
                "active_image": current,
                "promotion_digest": validation["promotion_digest"],
                "source_sha": validation["source_sha"],
                "observed_at_epoch": utc_epoch(),
                "detail": detail,
                "failed_candidate": previous_watch.get("failed_candidate"),
                "failed_at_epoch": previous_watch.get("failed_at_epoch"),
            }
            atomic_json(watch_status, record)
            append_jsonl(watch_journal, record)
            print(json.dumps(record, indent=2))
            return record

        deploy_script = (ROOT / policy.deployment_script).resolve()
        if ROOT not in deploy_script.parents or not deploy_script.is_file():
            raise RuntimeError("deployment script is missing or outside repository root")

        result = _run_deployer(deploy_script, candidate, state_dir, health_url)
        if result.stdout:
            print(result.stdout, end="" if result.stdout.endswith("\n") else "\n")
        if result.returncode:
            record = {
                "schema": "omega.cloud.autodeploy-watch.v1",
                "status": "QUARANTINE",
                "candidate_image": candidate,
                "active_image": current,
                "promotion_digest": validation["promotion_digest"],
                "source_sha": validation["source_sha"],
                "observed_at_epoch": utc_epoch(),
                "failed_candidate": candidate,
                "failed_at_epoch": utc_epoch(),
                "detail": f"immutable deploy transaction failed with exit {result.returncode}",
            }
        else:
            active = read_active_image(state_dir / "current.json")
            if active != candidate:
                raise RuntimeError("deployer returned success without activating candidate digest")
            record = {
                "schema": "omega.cloud.autodeploy-watch.v1",
                "status": "PROMOTED",
                "candidate_image": candidate,
                "active_image": active,
                "promotion_digest": validation["promotion_digest"],
                "source_sha": validation["source_sha"],
                "observed_at_epoch": utc_epoch(),
                "failed_candidate": None,
                "failed_at_epoch": None,
                "detail": "governed promotion deployed and live health/proof/replay/provenance gate passed",
            }

        atomic_json(watch_status, record)
        append_jsonl(watch_journal, record)
        print(json.dumps(record, indent=2))
        return record
    except Exception as exc:
        record = {
            "schema": "omega.cloud.autodeploy-watch.v1",
            "status": "QUARANTINE",
            "observed_at_epoch": utc_epoch(),
            "detail": f"{type(exc).__name__}: {exc}",
        }
        atomic_json(watch_status, record)
        append_jsonl(watch_journal, record)
        print(json.dumps(record, indent=2))
        return record


def main() -> int:
    parser = argparse.ArgumentParser(description="OMEGA host pull-based governed cloud deployment watcher")
    parser.add_argument("--once", action="store_true")
    parser.add_argument("--watch", action="store_true")
    parser.add_argument("--interval", type=int, default=None)
    args = parser.parse_args()

    policy = load_policy(ROOT)
    interval = max(60, args.interval or policy.poll_seconds)
    if args.once or not args.watch:
        record = run_cycle()
        return 0 if record.get("status") in {"PROMOTED", "SKIP_CURRENT", "BACKOFF"} else 1

    while True:
        run_cycle()
        time.sleep(interval)


if __name__ == "__main__":
    raise SystemExit(main())
