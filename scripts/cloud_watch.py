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
    fetch_health,
    fetch_promotion,
    load_policy,
    read_active_image,
    read_deployment_state,
    recovery_target,
    utc_epoch,
    validate_promotion,
)
from omega_genesis.deployment import append_jsonl, atomic_json, validate_health_payload


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


def _record_base(candidate: str, current: str | None, validation: dict, detail: str) -> dict:
    return {
        "schema": "omega.cloud.autodeploy-watch.v1",
        "candidate_image": candidate,
        "active_image": current,
        "promotion_digest": validation["promotion_digest"],
        "source_sha": validation["source_sha"],
        "observed_at_epoch": utc_epoch(),
        "detail": detail,
    }


def _recover_active(
    candidate: str,
    current: str,
    validation: dict,
    state_dir: Path,
    health_url: str,
    deploy_script: Path,
    health_errors: list[str],
) -> dict:
    state = read_deployment_state(state_dir / "current.json")
    target, recovery_mode = recovery_target(state, current)
    result = _run_deployer(deploy_script, target, state_dir, health_url)
    if result.stdout:
        print(result.stdout, end="" if result.stdout.endswith("\n") else "\n")

    if result.returncode:
        record = _record_base(
            candidate,
            current,
            validation,
            "active cloud health failed (" + ",".join(health_errors) + ") and recovery transaction failed",
        )
        record.update({
            "status": "QUARANTINE",
            "recovery_mode": recovery_mode,
            "recovery_target": target,
            "failed_candidate": current,
            "failed_at_epoch": utc_epoch(),
        })
        return record

    active = read_active_image(state_dir / "current.json")
    if active != target:
        raise RuntimeError("recovery deployer returned success without activating recovery target")

    post_health = fetch_health(health_url, os.environ.get("OMEGA_GATEWAY_TOKEN", ""))
    post_ok, post_errors = validate_health_payload(post_health)
    if not post_ok:
        record = _record_base(
            candidate,
            active,
            validation,
            "recovery target activated but post-recovery proof/replay health failed: " + ",".join(post_errors),
        )
        record.update({
            "status": "QUARANTINE",
            "recovery_mode": recovery_mode,
            "recovery_target": target,
            "failed_candidate": active,
            "failed_at_epoch": utc_epoch(),
        })
        return record

    status = "RECOVERED_PREVIOUS" if recovery_mode == "ROLLBACK_PREVIOUS" else "RECONCILED_CURRENT"
    record = _record_base(
        candidate,
        active,
        validation,
        "active cloud health failed (" + ",".join(health_errors) + ") and bounded recovery passed live proof/replay health",
    )
    record.update({
        "status": status,
        "recovery_mode": recovery_mode,
        "recovery_target": target,
        "health": post_health,
        "failed_candidate": current if recovery_mode == "ROLLBACK_PREVIOUS" else None,
        "failed_at_epoch": utc_epoch() if recovery_mode == "ROLLBACK_PREVIOUS" else None,
    })
    return record


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

        deploy_script = (ROOT / policy.deployment_script).resolve()
        if ROOT not in deploy_script.parents or not deploy_script.is_file():
            raise RuntimeError("deployment script is missing or outside repository root")

        if decision == "SKIP_CURRENT" and current:
            try:
                observed_health = fetch_health(health_url, os.environ.get("OMEGA_GATEWAY_TOKEN", ""))
                health_ok, health_errors = validate_health_payload(observed_health)
            except Exception as exc:
                observed_health = {"status": "UNREACHABLE", "error": f"{type(exc).__name__}: {exc}"}
                health_ok, health_errors = False, ["health_unreachable"]

            if health_ok:
                record = _record_base(candidate, current, validation, "active immutable generation re-verified live")
                record.update({
                    "status": "VERIFIED_CURRENT",
                    "health": observed_health,
                    "failed_candidate": None,
                    "failed_at_epoch": None,
                })
            else:
                record = _recover_active(
                    candidate,
                    current,
                    validation,
                    state_dir,
                    health_url,
                    deploy_script,
                    health_errors,
                )

            atomic_json(watch_status, record)
            append_jsonl(watch_journal, record)
            print(json.dumps(record, indent=2))
            return record

        if decision != "DEPLOY":
            record = _record_base(candidate, current, validation, detail)
            record.update({
                "status": decision,
                "failed_candidate": previous_watch.get("failed_candidate"),
                "failed_at_epoch": previous_watch.get("failed_at_epoch"),
            })
            atomic_json(watch_status, record)
            append_jsonl(watch_journal, record)
            print(json.dumps(record, indent=2))
            return record

        result = _run_deployer(deploy_script, candidate, state_dir, health_url)
        if result.stdout:
            print(result.stdout, end="" if result.stdout.endswith("\n") else "\n")
        if result.returncode:
            record = _record_base(candidate, current, validation, f"immutable deploy transaction failed with exit {result.returncode}")
            record.update({
                "status": "QUARANTINE",
                "failed_candidate": candidate,
                "failed_at_epoch": utc_epoch(),
            })
        else:
            active = read_active_image(state_dir / "current.json")
            if active != candidate:
                raise RuntimeError("deployer returned success without activating candidate digest")
            record = _record_base(
                candidate,
                active,
                validation,
                "governed promotion deployed and live health/proof/replay/provenance gate passed",
            )
            record.update({
                "status": "PROMOTED",
                "failed_candidate": None,
                "failed_at_epoch": None,
            })

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
    parser = argparse.ArgumentParser(description="OMEGA host pull-based governed cloud deployment and recovery watcher")
    parser.add_argument("--once", action="store_true")
    parser.add_argument("--watch", action="store_true")
    parser.add_argument("--interval", type=int, default=None)
    args = parser.parse_args()

    policy = load_policy(ROOT)
    interval = max(60, args.interval or policy.poll_seconds)
    if args.once or not args.watch:
        record = run_cycle()
        return 0 if record.get("status") in {
            "PROMOTED",
            "VERIFIED_CURRENT",
            "RECOVERED_PREVIOUS",
            "RECONCILED_CURRENT",
            "BACKOFF",
        } else 1

    while True:
        run_cycle()
        time.sleep(interval)


if __name__ == "__main__":
    raise SystemExit(main())
