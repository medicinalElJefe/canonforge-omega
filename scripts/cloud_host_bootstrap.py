from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from omega_genesis.deployment import atomic_json
from omega_genesis.host_bootstrap import (
    bootstrap_record,
    parse_env_text,
    render_systemd_unit,
    validate_domain,
    watcher_environment,
)


def run(command: list[str], *, cwd: Path = ROOT, env: dict[str, str] | None = None) -> subprocess.CompletedProcess[str]:
    print("+", " ".join(command), flush=True)
    result = subprocess.run(
        command,
        cwd=cwd,
        env=env,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
    )
    if result.stdout:
        print(result.stdout, end="" if result.stdout.endswith("\n") else "\n")
    return result


def require(command: list[str], *, cwd: Path = ROOT, env: dict[str, str] | None = None) -> str:
    result = run(command, cwd=cwd, env=env)
    if result.returncode:
        raise RuntimeError(f"command failed ({result.returncode}): {' '.join(command)}")
    return result.stdout or ""


def command_required(name: str) -> None:
    if not shutil.which(name):
        raise RuntimeError(f"required host command is missing: {name}")


def current_branch() -> str:
    return require(["git", "rev-parse", "--abbrev-ref", "HEAD"]).strip()


def current_sha() -> str:
    return require(["git", "rev-parse", "HEAD"]).strip()


def ensure_clean_tracked_tree() -> None:
    dirty = require(["git", "status", "--porcelain", "--untracked-files=no"]).strip()
    if dirty:
        raise RuntimeError("tracked repository files are modified; refusing cloud bootstrap")


def ensure_current_branch(branch: str) -> None:
    active = current_branch()
    if active != branch:
        raise RuntimeError(f"bootstrap requires branch {branch}; current branch is {active}")
    ensure_clean_tracked_tree()
    require(["git", "fetch", "origin", branch])
    require(["git", "merge", "--ff-only", f"origin/{branch}"])
    ensure_clean_tracked_tree()


def ensure_cloud_env(domain: str) -> tuple[Path, dict[str, str]]:
    env_path = ROOT / "cloud" / "omega-cloud" / ".env.cloud"
    if not env_path.is_file():
        require([sys.executable, "scripts/cloud_bootstrap.py", "--domain", domain])
    parsed = parse_env_text(env_path.read_text(encoding="utf-8"))
    configured_domain = validate_domain(parsed.get("OMEGA_DOMAIN", ""))
    if configured_domain != domain:
        raise RuntimeError(
            f"existing cloud environment is for {configured_domain}, not requested {domain}; refusing silent secret replacement"
        )
    try:
        env_path.chmod(0o600)
    except OSError:
        pass
    return env_path, parsed


def main() -> int:
    parser = argparse.ArgumentParser(description="One-time OMEGA canonical cloud-host bootstrap")
    parser.add_argument("--domain", required=True)
    parser.add_argument("--branch", default="omega-genesis-v1-full")
    parser.add_argument("--state-dir", default="/var/lib/omega-deploy")
    parser.add_argument("--watch-env", default="/etc/omega/omega-cloud-watch.env")
    parser.add_argument("--unit-path", default="/etc/systemd/system/omega-cloud-watch.service")
    parser.add_argument("--health-url", default="http://127.0.0.1:8127/api/health")
    parser.add_argument("--no-systemd", action="store_true")
    args = parser.parse_args()

    domain = validate_domain(args.domain)
    if hasattr(os, "geteuid") and os.geteuid() != 0:
        raise SystemExit("cloud host bootstrap must run as root (use sudo)")

    for command in ("git", "docker", "python3"):
        command_required(command)
    if not args.no_systemd:
        command_required("systemctl")

    require(["docker", "version"])
    require(["docker", "compose", "version"])
    ensure_current_branch(args.branch)

    (ROOT / "cloud" / "omega-cloud" / "workspace").mkdir(parents=True, exist_ok=True)
    _, cloud_env = ensure_cloud_env(domain)

    state_dir = Path(args.state_dir).expanduser().resolve()
    state_dir.mkdir(parents=True, exist_ok=True)

    watch_env_path = Path(args.watch_env).expanduser().resolve()
    watch_env_path.parent.mkdir(parents=True, exist_ok=True)
    watch_env_path.write_text(
        watcher_environment(cloud_env, health_url=args.health_url, state_dir=str(state_dir)),
        encoding="utf-8",
    )
    try:
        watch_env_path.chmod(0o600)
    except OSError:
        pass

    child_env = os.environ.copy()
    child_env.update(parse_env_text(watch_env_path.read_text(encoding="utf-8")))
    initial = run(
        [sys.executable, "scripts/cloud_watch.py", "--once"],
        env=child_env,
    )
    if initial.returncode:
        raise RuntimeError("initial governed cloud deployment/recovery cycle failed")

    watcher_enabled = False
    if not args.no_systemd:
        unit_path = Path(args.unit_path).expanduser().resolve()
        unit_path.parent.mkdir(parents=True, exist_ok=True)
        unit_path.write_text(render_systemd_unit(ROOT, watch_env_path), encoding="utf-8")
        require(["systemctl", "daemon-reload"])
        require(["systemctl", "enable", "--now", unit_path.name])
        require(["systemctl", "is-active", "--quiet", unit_path.name])
        watcher_enabled = True

    record = bootstrap_record(
        domain=domain,
        install_root=ROOT,
        state_dir=state_dir,
        branch=args.branch,
        source_sha=current_sha(),
        watcher_enabled=watcher_enabled,
    )
    atomic_json(state_dir / "bootstrap.json", record)
    print(json.dumps(record, indent=2))
    print()
    print("OMEGA Cloud bootstrap completed.")
    print("Public DNS/TLS reachability is intentionally not claimed until verified from outside this host.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
