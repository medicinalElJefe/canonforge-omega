from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any

from .capabilities import CAPABILITIES
from .provenance import load_catalog, validate_catalog
from .release import verify_manifest

SCHEMA = "omega.evolution.policy.v1"
ALLOWED_CHECKS = {"file", "capability", "provenance", "selfbuild", "external_evidence"}


@dataclass(frozen=True)
class EvolutionPolicy:
    schema: str
    authority: str
    source_mutation_mode: str
    promotion_mode: str
    require_strict_improvement: bool
    interval_seconds: int
    objectives: list[dict[str, Any]]


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_policy(root: Path) -> EvolutionPolicy:
    raw = json.loads((Path(root) / "config" / "evolution_policy.json").read_text(encoding="utf-8"))
    policy = EvolutionPolicy(**raw)
    if policy.schema != SCHEMA:
        raise ValueError("unsupported evolution policy schema")
    if policy.authority != "OMEGA Cloud governed continuous-evolution authority":
        raise ValueError("evolution authority mismatch")
    if policy.source_mutation_mode != "candidate_only":
        raise ValueError("continuous evolution may not directly rewrite canonical source")
    if policy.promotion_mode != "proof_gated":
        raise ValueError("evolution promotion must be proof_gated")
    if policy.interval_seconds < 60:
        raise ValueError("evolution interval must be at least 60 seconds")
    ids: set[str] = set()
    for objective in policy.objectives:
        objective_id = str(objective.get("id", "")).strip()
        if not objective_id or objective_id in ids:
            raise ValueError("evolution objective ids must be non-empty and unique")
        ids.add(objective_id)
        priority = objective.get("priority")
        if not isinstance(priority, int) or not 1 <= priority <= 100:
            raise ValueError(f"{objective_id}: priority must be 1..100")
        checks = objective.get("checks")
        if not isinstance(checks, list) or not checks:
            raise ValueError(f"{objective_id}: checks required")
        for check in checks:
            if check.get("type") not in ALLOWED_CHECKS:
                raise ValueError(f"{objective_id}: unsupported check type {check.get('type')}")
    return policy


def _read_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
        return value if isinstance(value, dict) else {}
    except Exception:
        return {}


def _capability_map() -> dict[str, dict[str, Any]]:
    return {str(row["id"]): dict(row) for row in CAPABILITIES}


def _provenance_capabilities(catalog: dict[str, Any]) -> set[str]:
    out: set[str] = set()
    for source in catalog.get("sources") or []:
        for capability in source.get("capabilities") or []:
            out.add(str(capability).strip().upper())
    return out


def _evaluate_check(root: Path, data_dir: Path, check: dict[str, Any], capability_map: dict[str, dict[str, Any]], provenance_caps: set[str]) -> dict[str, Any]:
    kind = check["type"]
    result: dict[str, Any] = {"type": kind, "status": "FAIL"}

    if kind == "file":
        rel = str(check.get("path", "")).strip()
        path = (root / rel).resolve()
        inside = path == root or root in path.parents
        passed = bool(rel and inside and path.is_file())
        result.update({"status": "PASS" if passed else "FAIL", "path": rel})
        return result

    if kind == "capability":
        capability_id = str(check.get("id", "")).strip()
        allowed = {str(x) for x in check.get("allowed_statuses") or []}
        row = capability_map.get(capability_id)
        actual = row.get("status") if row else None
        passed = bool(row and actual in allowed)
        result.update({"status": "PASS" if passed else "FAIL", "id": capability_id, "actual": actual, "allowed": sorted(allowed)})
        return result

    if kind == "provenance":
        capability = str(check.get("capability", "")).strip().upper()
        passed = capability in provenance_caps
        result.update({"status": "PASS" if passed else "FAIL", "capability": capability})
        return result

    if kind == "selfbuild":
        path = data_dir / "self-build" / "status.json"
        payload = _read_json(path)
        actual = payload.get("decision")
        allowed = {str(x) for x in check.get("allowed") or ["PASS"]}
        passed = actual in allowed
        result.update({"status": "PASS" if passed else "FAIL", "actual": actual, "allowed": sorted(allowed), "evidence_path": str(path)})
        return result

    if kind == "external_evidence":
        key = str(check.get("key", "")).strip()
        path = data_dir / "evolution" / "evidence" / f"{key}.json"
        payload = _read_json(path)
        actual = payload.get("status")
        allowed = {str(x) for x in check.get("allowed") or ["PASS"]}
        passed = actual in allowed
        result.update({
            "status": "PASS" if passed else "BOUNDARY",
            "key": key,
            "actual": actual,
            "allowed": sorted(allowed),
            "evidence_path": str(path),
            "boundary": "external evidence must be observed; it is never synthesized to satisfy an objective",
        })
        return result

    raise ValueError(f"unsupported check type: {kind}")


def build_snapshot(root: Path, data_dir: Path) -> dict[str, Any]:
    root = Path(root).resolve()
    data_dir = Path(data_dir).resolve()
    policy = load_policy(root)
    catalog = load_catalog(root)
    provenance = validate_catalog(catalog)
    manifest = verify_manifest(root)
    capability_map = _capability_map()
    provenance_caps = _provenance_capabilities(catalog)

    objective_rows: list[dict[str, Any]] = []
    total_weight = 0
    achieved_weight = 0
    for objective in policy.objectives:
        checks = [_evaluate_check(root, data_dir, check, capability_map, provenance_caps) for check in objective["checks"]]
        passed = sum(1 for item in checks if item["status"] == "PASS")
        boundaries = sum(1 for item in checks if item["status"] == "BOUNDARY")
        failed = len(checks) - passed - boundaries
        fraction = passed / len(checks)
        priority = int(objective["priority"])
        total_weight += priority
        if passed == len(checks):
            status = "ACHIEVED"
            achieved_weight += priority
        elif failed == 0 and boundaries:
            status = "BLOCKED_EXTERNAL"
        else:
            status = "GAP"

        objective_rows.append({
            "id": objective["id"],
            "name": objective["name"],
            "status": status,
            "priority": priority,
            "progress": round(fraction, 6),
            "gap_score": round(priority * (1.0 - fraction), 6),
            "source": objective.get("source"),
            "next_action": objective.get("next_action"),
            "acceptance": list(objective.get("acceptance") or []),
            "checks": checks,
        })

    core_caps = sum(1 for row in capability_map.values() if row.get("status") == "LIVE_CORE")
    adapter_caps = sum(1 for row in capability_map.values() if row.get("status") == "ADAPTER")
    achieved = sum(1 for row in objective_rows if row["status"] == "ACHIEVED")
    blocked = sum(1 for row in objective_rows if row["status"] == "BLOCKED_EXTERNAL")
    backlog = [row for row in objective_rows if row["status"] != "ACHIEVED"]
    backlog.sort(key=lambda row: (-row["gap_score"], -row["priority"], row["id"]))

    return {
        "schema": "omega.evolution.snapshot.v1",
        "authority": policy.authority,
        "observed_at": utc_now(),
        "source_mutation_mode": policy.source_mutation_mode,
        "promotion_mode": policy.promotion_mode,
        "quality_vector": {
            "manifest_integrity": 1 if manifest.get("status") == "PASS" else 0,
            "provenance_integrity": 1 if provenance.get("status") == "PASS" else 0,
            "live_core_capabilities": core_caps,
            "adapter_capabilities": adapter_caps,
            "capability_total": len(capability_map),
            "objective_total": len(objective_rows),
            "objectives_achieved": achieved,
            "objectives_blocked_external": blocked,
            "weighted_progress": round(achieved_weight / total_weight, 6) if total_weight else 0.0,
            "weighted_gap": round(1.0 - (achieved_weight / total_weight), 6) if total_weight else 1.0,
        },
        "objectives": objective_rows,
        "backlog": backlog,
        "manifest": {"status": manifest.get("status"), "errors": list(manifest.get("errors") or [])},
        "provenance": provenance,
        "boundary": "Continuous evolution means measurable no-regression improvement. OMEGA may generate and prioritize candidate work continuously, but canonical source changes must be built as candidates and pass the proof-gated acceptance vector before promotion.",
    }


def candidate_decision(baseline: dict[str, Any], candidate: dict[str, Any], *, require_strict: bool = True) -> dict[str, Any]:
    errors: list[str] = []
    b = baseline.get("quality_vector") or {}
    c = candidate.get("quality_vector") or {}

    if c.get("manifest_integrity") != 1:
        errors.append("candidate_manifest_invalid")
    if c.get("provenance_integrity") != 1:
        errors.append("candidate_provenance_invalid")

    for key in ("live_core_capabilities", "capability_total", "objectives_achieved", "weighted_progress"):
        if c.get(key, 0) < b.get(key, 0):
            errors.append(f"regression:{key}")

    if c.get("weighted_gap", 1.0) > b.get("weighted_gap", 1.0):
        errors.append("regression:weighted_gap")

    strict = (
        c.get("live_core_capabilities", 0) > b.get("live_core_capabilities", 0)
        or c.get("objectives_achieved", 0) > b.get("objectives_achieved", 0)
        or c.get("weighted_progress", 0.0) > b.get("weighted_progress", 0.0)
        or c.get("weighted_gap", 1.0) < b.get("weighted_gap", 1.0)
    )
    if require_strict and not strict:
        errors.append("no_measurable_improvement")

    return {
        "status": "PROMOTE_CANDIDATE" if not errors else "QUARANTINE",
        "strict_improvement": strict,
        "errors": errors,
        "baseline": b,
        "candidate": c,
        "boundary": "promotion decision supplements, never replaces, compile/test/release/deployment proof gates",
    }
