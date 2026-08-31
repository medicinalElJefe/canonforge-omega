from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import re
import tempfile
from typing import Any

_DIGEST_REF = re.compile(r"^.+@sha256:[0-9a-f]{64}$")


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def require_immutable_image(image: str) -> str:
    image = str(image).strip()
    if not _DIGEST_REF.fullmatch(image):
        raise ValueError("deployment image must be digest-pinned as <registry>/<image>@sha256:<64 hex>")
    return image


def compose_image_override(image: str) -> str:
    image = require_immutable_image(image)
    return (
        "services:\n"
        "  omega:\n"
        f"    image: {image}\n"
        "  selfbuilder:\n"
        f"    image: {image}\n"
        "  evolver:\n"
        f"    image: {image}\n"
        "  backup:\n"
        f"    image: {image}\n"
    )


def validate_health_payload(payload: dict[str, Any]) -> tuple[bool, list[str]]:
    errors: list[str] = []
    if payload.get("status") != "OK":
        errors.append("runtime_status_not_ok")
    proof = payload.get("proof") or {}
    replay = payload.get("replay") or {}
    if proof.get("valid") is not True:
        errors.append("proof_invalid")
    if replay.get("valid") is not True:
        errors.append("replay_invalid")
    digest = payload.get("canonical_digest")
    if not isinstance(digest, str) or not digest:
        errors.append("canonical_digest_missing")
    state_id = payload.get("state_id")
    if not isinstance(state_id, int) or state_id < 1:
        errors.append("state_id_invalid")
    provenance = payload.get("provenance") or {}
    if provenance.get("status") != "PASS":
        errors.append("provenance_invalid")
    catalog_digest = provenance.get("catalog_digest")
    if not isinstance(catalog_digest, str) or not re.fullmatch(r"[0-9a-f]{64}", catalog_digest):
        errors.append("provenance_digest_invalid")
    if provenance.get("privacy_pass") is not True:
        errors.append("provenance_privacy_invalid")
    return (not errors, errors)


def atomic_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_name = tempfile.mkstemp(prefix=path.name + ".", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump(payload, fh, indent=2, sort_keys=True)
            fh.write("\n")
            fh.flush()
            os.fsync(fh.fileno())
        os.replace(tmp_name, path)
    finally:
        try:
            os.unlink(tmp_name)
        except FileNotFoundError:
            pass


def append_jsonl(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(payload, sort_keys=True, separators=(",", ":")) + "\n")
        fh.flush()
        os.fsync(fh.fileno())


@dataclass(frozen=True)
class DeploymentRecord:
    candidate_image: str
    previous_image: str | None
    decision: str
    started_at: str
    completed_at: str
    health: dict[str, Any] | None
    rollback_health: dict[str, Any] | None = None
    detail: str = ""

    def public(self) -> dict[str, Any]:
        return asdict(self)


def deployment_state(candidate_image: str, previous_image: str | None, health: dict[str, Any]) -> dict[str, Any]:
    candidate = require_immutable_image(candidate_image)
    if previous_image:
        previous_image = require_immutable_image(previous_image)
    ok, errors = validate_health_payload(health)
    if not ok:
        raise ValueError("cannot promote unhealthy deployment: " + ",".join(errors))
    return {
        "schema": "omega.cloud.deployment-state.v1",
        "active_image": candidate,
        "previous_image": previous_image,
        "promoted_at": utc_now(),
        "canonical_digest": health["canonical_digest"],
        "state_id": health["state_id"],
        "provenance_catalog_digest": health["provenance"]["catalog_digest"],
    }
