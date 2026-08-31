from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from omega_genesis.deployment import (
    DeploymentRecord,
    compose_image_override,
    append_jsonl,
    atomic_json,
    deployment_state,
    require_immutable_image,
    utc_now,
    validate_health_payload,
)


def run(command: list[str], *, cwd: Path) -> subprocess.CompletedProcess[str]:
    print("+", " ".join(command), flush=True)
    result = subprocess.run(command, cwd=cwd, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, check=False)
    if result.stdout:
        print(result.stdout, end="" if result.stdout.endswith("\n") else "\n")
    return result


def require(command: list[str], *, cwd: Path) -> None:
    result = run(command, cwd=cwd)
    if result.returncode:
        raise RuntimeError(f"command failed ({result.returncode}): {' '.join(command)}")


def read_current(path: Path) -> str | None:
    if not path.is_file():
        return None
    data = json.loads(path.read_text(encoding="utf-8"))
    value = data.get("active_image")
    return require_immutable_image(value) if value else None


def health(url: str, token: str, attempts: int, delay: float) -> dict:
    last: dict = {"status": "UNREACHABLE"}
    headers = {"X-Omega-Gateway-Token": token} if token else {}
    for _ in range(max(1, attempts)):
        try:
            with urlopen(Request(url, headers=headers), timeout=10) as response:
                last = json.loads(response.read().decode("utf-8"))
                status_code = response.status
            ok, _ = validate_health_payload(last)
            if status_code == 200 and ok:
                return last
        except Exception as exc:
            last = {"status": "UNREACHABLE", "error": f"{type(exc).__name__}: {exc}"}
        time.sleep(max(0.0, delay))
    return last


def override_file(image: str, directory: Path) -> Path:
    text = compose_image_override(image)
    fd, name = tempfile.mkstemp(prefix="omega-deploy-", suffix=".yml", dir=directory)
    with os.fdopen(fd, "w", encoding="utf-8") as fh:
        fh.write(text)
    return Path(name)


def apply_image(image: str, compose_dir: Path) -> None:
    override = override_file(image, compose_dir)
    try:
        require(["docker", "pull", image], cwd=compose_dir)
        require([
            "docker", "compose", "-f", "docker-compose.yml", "-f", override.name,
            "up", "-d", "--no-build", "omega", "selfbuilder", "caddy", "backup",
        ], cwd=compose_dir)
    finally:
        override.unlink(missing_ok=True)


def main() -> int:
    parser = argparse.ArgumentParser(description="Governed OMEGA Cloud immutable deploy + health rollback")
    parser.add_argument("--image", required=True, help="digest-pinned OCI image reference")
    parser.add_argument("--compose-dir", default="cloud/omega-cloud")
    parser.add_argument("--state-dir", default=os.environ.get("OMEGA_DEPLOY_STATE_DIR", "/var/lib/omega-deploy"))
    parser.add_argument("--health-url", default=os.environ.get("OMEGA_DEPLOY_HEALTH_URL", "http://127.0.0.1:8127/api/health"))
    parser.add_argument("--attempts", type=int, default=18)
    parser.add_argument("--delay", type=float, default=5.0)
    args = parser.parse_args()

    candidate = require_immutable_image(args.image)
    compose_dir = (ROOT / args.compose_dir).resolve()
    if not (compose_dir / "docker-compose.yml").is_file():
        raise SystemExit("compose directory does not contain docker-compose.yml")

    state_dir = Path(args.state_dir).expanduser().resolve()
    current_path = state_dir / "current.json"
    status_path = state_dir / "status.json"
    journal_path = state_dir / "journal.jsonl"
    state_dir.mkdir(parents=True, exist_ok=True)

    previous = read_current(current_path)
    started = utc_now()
    token = os.environ.get("OMEGA_GATEWAY_TOKEN", "")

    try:
        apply_image(candidate, compose_dir)
        observed = health(args.health_url, token, args.attempts, args.delay)
        ok, errors = validate_health_payload(observed)
        if not ok:
            raise RuntimeError("post-deploy health failed: " + ",".join(errors))

        atomic_json(current_path, deployment_state(candidate, previous, observed))
        record = DeploymentRecord(candidate, previous, "PROMOTE", started, utc_now(), observed, detail="immutable candidate passed live proof/replay health")
        atomic_json(status_path, record.public())
        append_jsonl(journal_path, record.public())
        print(json.dumps(record.public(), indent=2))
        return 0
    except Exception as exc:
        rollback_observed = None
        detail = f"{type(exc).__name__}: {exc}"
        decision = "QUARANTINE"
        if previous:
            try:
                apply_image(previous, compose_dir)
                rollback_observed = health(args.health_url, token, args.attempts, args.delay)
                rollback_ok, rollback_errors = validate_health_payload(rollback_observed)
                if rollback_ok:
                    decision = "ROLLBACK"
                    detail += "; previous immutable image restored and verified"
                else:
                    detail += "; rollback health failed: " + ",".join(rollback_errors)
            except Exception as rollback_exc:
                detail += f"; rollback exception: {type(rollback_exc).__name__}: {rollback_exc}"
        record = DeploymentRecord(candidate, previous, decision, started, utc_now(), None, rollback_observed, detail)
        atomic_json(status_path, record.public())
        append_jsonl(journal_path, record.public())
        print(json.dumps(record.public(), indent=2))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
