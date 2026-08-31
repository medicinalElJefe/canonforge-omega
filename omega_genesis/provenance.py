from __future__ import annotations

from hashlib import sha256
import json
from pathlib import Path
import re
from typing import Any

SCHEMA = "omega.provenance.catalog.v1"
FORBIDDEN_KEYS = {
    "drive_id",
    "file_id",
    "parent_id",
    "parent_ids",
    "url",
    "email",
    "email_address",
    "token",
    "access_token",
    "refresh_token",
}
ALLOWED_DISPOSITIONS = {"KEEP", "MERGE", "DONOR", "QUARANTINE"}
_DIGEST = re.compile(r"^[0-9a-f]{64}$")


def _canonical(value: Any) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def _walk_forbidden(value: Any, path: str = "$") -> list[str]:
    errors: list[str] = []
    if isinstance(value, dict):
        for key, child in value.items():
            key_norm = str(key).strip().lower()
            if key_norm in FORBIDDEN_KEYS:
                errors.append(f"private key forbidden at {path}.{key}")
            errors.extend(_walk_forbidden(child, f"{path}.{key}"))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            errors.extend(_walk_forbidden(child, f"{path}[{index}]"))
    return errors


def load_catalog(root: Path) -> dict[str, Any]:
    path = Path(root) / "config" / "provenance_sources.json"
    return json.loads(path.read_text(encoding="utf-8"))


def validate_catalog(catalog: dict[str, Any]) -> dict[str, Any]:
    errors: list[str] = []
    if catalog.get("schema") != SCHEMA:
        errors.append("schema_mismatch")
    if catalog.get("authority") != "OMEGA Cloud lineage/provenance registry":
        errors.append("authority_mismatch")
    errors.extend(_walk_forbidden(catalog))

    sources = catalog.get("sources")
    if not isinstance(sources, list) or not sources:
        errors.append("sources_missing")
        sources = []

    ids: set[str] = set()
    capabilities: set[str] = set()
    for index, source in enumerate(sources):
        prefix = f"source[{index}]"
        if not isinstance(source, dict):
            errors.append(f"{prefix}_not_object")
            continue
        source_id = str(source.get("id", "")).strip()
        if not source_id:
            errors.append(f"{prefix}_id_missing")
        elif source_id in ids:
            errors.append(f"{prefix}_duplicate_id")
        ids.add(source_id)

        if not str(source.get("name", "")).strip():
            errors.append(f"{prefix}_name_missing")
        if source.get("disposition") not in ALLOWED_DISPOSITIONS:
            errors.append(f"{prefix}_disposition_invalid")
        authority = source.get("authority")
        if not isinstance(authority, int) or not 0 <= authority <= 100:
            errors.append(f"{prefix}_authority_invalid")

        digest = str(source.get("contract_digest_sha256", ""))
        if not _DIGEST.fullmatch(digest):
            errors.append(f"{prefix}_contract_digest_invalid")
        else:
            calculated = sha256(_canonical(source.get("contracts", {}))).hexdigest()
            if calculated != digest:
                errors.append(f"{prefix}_contract_digest_mismatch")

        caps = source.get("capabilities")
        if not isinstance(caps, list) or not caps:
            errors.append(f"{prefix}_capabilities_missing")
        else:
            for capability in caps:
                if not isinstance(capability, str) or not capability.strip():
                    errors.append(f"{prefix}_capability_invalid")
                else:
                    capabilities.add(capability.strip().upper())

        if not str(source.get("boundary", "")).strip():
            errors.append(f"{prefix}_boundary_missing")

    required = {
        "drive-software-universe-v22",
        "drive-implementation-canon-v2",
        "drive-v31r1-integration-report",
    }
    missing = sorted(required - ids)
    if missing:
        errors.append("required_sources_missing:" + ",".join(missing))

    digest = sha256(_canonical(catalog)).hexdigest()
    return {
        "status": "PASS" if not errors else "FAIL",
        "schema": catalog.get("schema"),
        "source_count": len(sources),
        "capability_count": len(capabilities),
        "catalog_digest": digest,
        "privacy_pass": not any("private key forbidden" in error for error in errors),
        "errors": errors,
    }


def summary(root: Path) -> dict[str, Any]:
    return validate_catalog(load_catalog(root))


def public_catalog(root: Path) -> dict[str, Any]:
    catalog = load_catalog(root)
    report = validate_catalog(catalog)
    return {
        "summary": report,
        "authority": catalog.get("authority"),
        "privacy_boundary": catalog.get("privacy_boundary"),
        "admission_rules": list(catalog.get("admission_rules") or []),
        "sources": list(catalog.get("sources") or []),
    }


def capability_sources(root: Path, capability: str) -> dict[str, Any]:
    wanted = str(capability).strip().upper()
    catalog = load_catalog(root)
    matches = []
    for source in catalog.get("sources") or []:
        caps = {str(x).strip().upper() for x in source.get("capabilities") or []}
        if wanted and wanted in caps:
            matches.append(source)
    matches.sort(key=lambda row: (-int(row.get("authority", 0)), str(row.get("name", ""))))
    return {
        "status": "PASS",
        "capability": wanted,
        "matches": matches,
        "count": len(matches),
        "catalog_digest": validate_catalog(catalog)["catalog_digest"],
        "boundary": "Source relation is provenance evidence, not automatic proof that a capability is implemented in the current runtime.",
    }
