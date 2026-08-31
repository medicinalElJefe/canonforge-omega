from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
import re
from typing import Mapping

_DOMAIN = re.compile(
    r"^(?=.{1,253}\.?$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[A-Za-z]{2,63}$"
)


def validate_domain(domain: str) -> str:
    value = str(domain).strip().lower().rstrip(".")
    if "://" in value or "/" in value or not _DOMAIN.fullmatch(value):
        raise ValueError("domain must be a DNS hostname such as omega.example.com")
    return value


def validate_install_root(path: Path) -> Path:
    root = Path(path).expanduser().resolve()
    text = str(root)
    if not root.is_absolute() or root == Path("/") or any(ch in text for ch in ("\n", "\r", "\x00")):
        raise ValueError("install root must be a safe absolute directory other than /")
    if any(ch.isspace() for ch in text):
        raise ValueError("install root may not contain whitespace")
    return root


def parse_env_text(text: str) -> dict[str, str]:
    out: dict[str, str] = {}
    for line_no, raw in enumerate(str(text).splitlines(), start=1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            raise ValueError(f"invalid environment line {line_no}")
        key, value = line.split("=", 1)
        key = key.strip()
        if not key or not re.fullmatch(r"[A-Z][A-Z0-9_]*", key):
            raise ValueError(f"invalid environment key on line {line_no}")
        if key in out:
            raise ValueError(f"duplicate environment key: {key}")
        if any(ch in value for ch in ("\n", "\r", "\x00")):
            raise ValueError(f"invalid environment value for {key}")
        out[key] = value
    return out


def watcher_environment(env: Mapping[str, str], *, health_url: str, state_dir: str) -> str:
    gateway = str(env.get("OMEGA_GATEWAY_TOKEN", "")).strip()
    if not gateway or gateway == "replace-me":
        raise ValueError("OMEGA_GATEWAY_TOKEN is missing")
    if any(ch.isspace() for ch in gateway):
        raise ValueError("OMEGA_GATEWAY_TOKEN may not contain whitespace")
    if not str(health_url).startswith("http://127.0.0.1"):
        raise ValueError("watcher health URL must use host loopback")
    state = str(Path(state_dir).expanduser())
    if any(ch.isspace() for ch in state):
        raise ValueError("deployment state directory may not contain whitespace")
    return (
        f"OMEGA_GATEWAY_TOKEN={gateway}\n"
        f"OMEGA_DEPLOY_HEALTH_URL={health_url}\n"
        f"OMEGA_DEPLOY_STATE_DIR={state}\n"
    )


def render_systemd_unit(install_root: Path, watcher_env_path: Path) -> str:
    root = validate_install_root(install_root)
    env_path = Path(watcher_env_path).expanduser().resolve()
    if any(ch.isspace() for ch in str(env_path)):
        raise ValueError("watcher environment path may not contain whitespace")
    return f"""[Unit]
Description=OMEGA governed cloud promotion watcher
After=docker.service network-online.target
Wants=network-online.target
Requires=docker.service

[Service]
Type=simple
WorkingDirectory={root}
Environment=PYTHONUNBUFFERED=1
EnvironmentFile=-{env_path}
ExecStart=/usr/bin/python3 {root}/scripts/cloud_watch.py --watch
Restart=always
RestartSec=10
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
"""


@dataclass(frozen=True)
class BootstrapRecord:
    status: str
    domain: str
    install_root: str
    state_dir: str
    branch: str
    source_sha: str
    watcher_enabled: bool
    completed_at: str
    boundary: str

    def public(self) -> dict[str, object]:
        return asdict(self)


def bootstrap_record(
    *,
    domain: str,
    install_root: Path,
    state_dir: Path,
    branch: str,
    source_sha: str,
    watcher_enabled: bool,
) -> dict[str, object]:
    if not re.fullmatch(r"[0-9a-f]{40}", source_sha):
        raise ValueError("source SHA must be a full Git SHA-1")
    record = BootstrapRecord(
        status="PASS",
        domain=validate_domain(domain),
        install_root=str(validate_install_root(install_root)),
        state_dir=str(Path(state_dir).expanduser().resolve()),
        branch=str(branch),
        source_sha=source_sha,
        watcher_enabled=bool(watcher_enabled),
        completed_at=datetime.now(timezone.utc).isoformat(),
        boundary="bootstrap proves host initialization only; public DNS/TLS reachability requires separate live verification",
    )
    return record.public()
