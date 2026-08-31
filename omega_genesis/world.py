from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime
from hashlib import sha256
import json
import math
from typing import Any

from .schema import EvidenceClass


@dataclass(frozen=True)
class WorldObservation:
    source_id: str
    authority: str
    evidence_class: EvidenceClass
    observed_at: str
    frame: str
    units: str
    x: float
    y: float
    z: float
    sigma: float = 1.0

    @classmethod
    def from_dict(cls, raw: dict[str, Any]) -> "WorldObservation":
        source_id = str(raw.get("source_id", "")).strip()
        authority = str(raw.get("authority", "")).strip()
        observed_at = str(raw.get("observed_at", "")).strip()
        frame = str(raw.get("frame", "")).strip()
        units = str(raw.get("units", "")).strip()
        if not source_id or not authority or not observed_at or not frame or not units:
            raise ValueError("source_id, authority, observed_at, frame, and units are required")
        try:
            datetime.fromisoformat(observed_at.replace("Z", "+00:00"))
        except Exception as exc:
            raise ValueError("observed_at must be ISO-8601") from exc

        values = [float(raw[name]) for name in ("x", "y", "z")]
        sigma = float(raw.get("sigma", 1.0))
        if not all(math.isfinite(v) for v in values):
            raise ValueError("coordinates must be finite")
        if not math.isfinite(sigma) or sigma <= 0:
            raise ValueError("sigma must be finite and > 0")
        return cls(
            source_id=source_id,
            authority=authority,
            evidence_class=EvidenceClass(raw.get("evidence_class", "IMPORTED")),
            observed_at=observed_at,
            frame=frame,
            units=units,
            x=values[0],
            y=values[1],
            z=values[2],
            sigma=sigma,
        )


def _canonical_digest(value: Any) -> str:
    raw = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return sha256(raw).hexdigest()


def reconstruct_points(
    observations: list[WorldObservation],
    *,
    canonical_digest: str,
    target_frame: str | None = None,
    target_units: str | None = None,
) -> dict[str, Any]:
    if len(observations) < 2:
        raise ValueError("at least two source-bound observations are required")
    canonical_digest = str(canonical_digest).strip().lower()
    if len(canonical_digest) != 64 or any(ch not in "0123456789abcdef" for ch in canonical_digest):
        raise ValueError("canonical_digest must be a lowercase SHA-256")

    observations = sorted(
        observations,
        key=lambda row: (
            row.source_id,
            row.observed_at,
            row.authority,
            row.evidence_class.value,
            row.frame,
            row.units,
            row.x,
            row.y,
            row.z,
            row.sigma,
        ),
    )

    frames = {row.frame for row in observations}
    units = {row.units for row in observations}
    if len(frames) != 1:
        raise ValueError("mixed coordinate frames require an explicit transform; none is synthesized")
    if len(units) != 1:
        raise ValueError("mixed units require an explicit conversion; none is synthesized")

    frame = next(iter(frames))
    unit = next(iter(units))
    if target_frame is not None and str(target_frame) != frame:
        raise ValueError("requested target frame differs from source frame; transform evidence required")
    if target_units is not None and str(target_units) != unit:
        raise ValueError("requested target units differ from source units; conversion evidence required")

    weights = [1.0 / (row.sigma * row.sigma) for row in observations]
    total_weight = sum(weights)
    centroid = {
        "x": sum(w * row.x for w, row in zip(weights, observations)) / total_weight,
        "y": sum(w * row.y for w, row in zip(weights, observations)) / total_weight,
        "z": sum(w * row.z for w, row in zip(weights, observations)) / total_weight,
    }

    residuals = []
    for row in observations:
        distance = math.sqrt(
            (row.x - centroid["x"]) ** 2
            + (row.y - centroid["y"]) ** 2
            + (row.z - centroid["z"]) ** 2
        )
        residuals.append({
            "source_id": row.source_id,
            "distance": distance,
            "normalized": distance / row.sigma,
        })

    rms = math.sqrt(sum(row["distance"] ** 2 for row in residuals) / len(residuals))
    normalized_rms = math.sqrt(sum(row["normalized"] ** 2 for row in residuals) / len(residuals))
    source_rows = [
        {
            **asdict(row),
            "evidence_class": row.evidence_class.value,
        }
        for row in observations
    ]
    evidence_counts: dict[str, int] = {}
    for row in observations:
        key = row.evidence_class.value
        evidence_counts[key] = evidence_counts.get(key, 0) + 1

    observed_times = sorted(row.observed_at for row in observations)
    source_digest = _canonical_digest(source_rows)
    reconstruction = {
        "schema": "omega.world.reconstruction.v1",
        "status": "PASS",
        "method": "inverse-variance weighted point reconstruction",
        "frame": frame,
        "units": unit,
        "centroid": centroid,
        "residual_rms": rms,
        "normalized_residual_rms": normalized_rms,
        "sample_count": len(observations),
        "time_bounds": {"first": observed_times[0], "last": observed_times[-1]},
        "evidence_counts": evidence_counts,
        "sources": source_rows,
        "source_set_digest": source_digest,
        "canonical_digest": canonical_digest,
        "evidence_class": EvidenceClass.DERIVED.value,
        "source_bound": True,
        "synthetic_transform_used": False,
        "boundary": (
            "This reconstructs only the geometry supported by supplied observations in one declared frame and unit system. "
            "It does not infer missing transforms, terrain, objects, motion, or current-world truth."
        ),
    }
    reconstruction["reconstruction_digest"] = _canonical_digest(reconstruction)
    return reconstruction
