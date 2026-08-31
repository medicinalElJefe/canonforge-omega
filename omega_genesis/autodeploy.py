from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from hashlib import sha256
import json
from pathlib import Path
import re
from typing import Any
from urllib.request import Request, urlopen

from .deployment import require_immutable_image

_SHA40 = re.compile(r"^[0-9a-f]{40}$")
_SHA64 = re.compile(r"^[0-9a-f]{64}$")


@dataclass(frozen=True)
class HostAutodeployPolicy:
    schema_version: int
    authority: str
    promotion_url: str
    expected_image_repository: str
    poll_seconds: int
    failure_backoff_seconds: int
    state_dir: str
    health_url: str
    deployment_script: str
    require_governed_promotion: bool
    require_immutable_image: bool


def utc_epoch() -> int:
    return int(datetime.now(timezone.utc).timestamp())


def _canonical(value: Any) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def promotion_digest(payload: dict[str, Any]) -> str:
    return sha256(_canonical(payload)).hexdigest()


def load_policy(root: Path) -> HostAutodeployPolicy:
    path = Path(root) / "config" / "cloud_autodeploy_policy.json"
    raw = json.loads(path.read_text(encoding="utf-8"))
    policy = HostAutodeployPolicy(**raw)
    if policy.schema_version != 1:
        raise ValueError("unsupported cloud autodeploy policy version")
    if policy.authority != "OMEGA Cloud host autonomous deployment authority":
        raise ValueError("cloud autodeploy authority mismatch")
    if not policy.promotion_url.startswith("https://"):
        raise ValueError("promotion URL must use HTTPS")
    if not policy.expected_image_repository.startswith("ghcr.io/"):
        raise ValueError("expected image repository must be GHCR")
    if policy.poll_seconds < 60:
        raise ValueError("poll interval must be at least 60 seconds")
    if policy.failure_backoff_seconds < policy.poll_seconds:
        raise ValueError("failure backoff must be at least the poll interval")
    return policy


def fetch_promotion(url: str, timeout: int = 15) -> dict[str, Any]:
    if not str(url).startswith("https://"):
        raise ValueError("promotion fetch requires HTTPS")
    request = Request(url, headers={"Accept": "application/json", "User-Agent": "OMEGA-Cloud-Watcher/1"})
    with urlopen(request, timeout=timeout) as response:
        if response.status != 200:
            raise RuntimeError(f"promotion fetch HTTP {response.status}")
        payload = json.loads(response.read().decode("utf-8"))
    if not isinstance(payload, dict):
        raise ValueError("promotion payload must be an object")
    return payload


def validate_promotion(payload: dict[str, Any], expected_repository: str) -> dict[str, Any]:
    errors: list[str] = []
    if payload.get("schema") != "omega.cloud.promotion.v1":
        errors.append("schema_mismatch")
    if payload.get("decision") != "PROMOTE":
        errors.append("decision_not_promote")

    image = str(payload.get("image", "")).strip()
    try:
        immutable = require_immutable_image(image)
        repository = immutable.split("@sha256:", 1)[0]
        if repository != expected_repository:
            errors.append("image_repository_mismatch")
    except Exception:
        errors.append("image_not_immutable")

    for field in ("source_sha", "trigger_sha"):
        if not _SHA40.fullmatch(str(payload.get(field, ""))):
            errors.append(f"{field}_invalid")
    for field in ("manifest_sha256", "release_sha256"):
        if not _SHA64.fullmatch(str(payload.get(field, ""))):
            errors.append(f"{field}_invalid")
    if not str(payload.get("workflow_run_id", "")).isdigit():
        errors.append("workflow_run_id_invalid")
    if not str(payload.get("boundary", "")).strip():
        errors.append("boundary_missing")

    return {
        "status": "PASS" if not errors else "FAIL",
        "errors": errors,
        "image": image if not errors else None,
        "source_sha": payload.get("source_sha"),
        "promotion_digest": promotion_digest(payload),
    }


def read_active_image(path: Path) -> str | None:
    if not Path(path).is_file():
        return None
    raw = json.loads(Path(path).read_text(encoding="utf-8"))
    image = raw.get("active_image")
    return require_immutable_image(image) if image else None


def deployment_decision(
    candidate: str,
    current: str | None,
    failed_candidate: str | None,
    failed_at_epoch: int | None,
    now_epoch: int,
    failure_backoff_seconds: int,
) -> tuple[str, str]:
    candidate = require_immutable_image(candidate)
    if current:
        current = require_immutable_image(current)
    if candidate == current:
        return "SKIP_CURRENT", "candidate already active"
    if failed_candidate == candidate and failed_at_epoch is not None:
        elapsed = max(0, int(now_epoch) - int(failed_at_epoch))
        if elapsed < int(failure_backoff_seconds):
            return "BACKOFF", f"candidate quarantined for {failure_backoff_seconds - elapsed}s"
    return "DEPLOY", "new governed immutable candidate"
