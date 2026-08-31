from __future__ import annotations

from dataclasses import asdict, dataclass
from hashlib import sha256
import json
from math import asin, atan2, cos, degrees, radians, sin, sqrt
import re
from typing import Iterable

from ..calculus import form_value, quantize_heading

EARTH_MEAN_RADIUS_M = 6_371_008.8
_HEX64 = re.compile(r"^[0-9a-f]{64}$")
_ALLOWED_DATASET_KINDS = {"GIS_VECTOR", "DEM_RASTER", "OSM_VECTOR"}
_ALLOWED_SOURCE_CLASSES = {
    "CANONICAL_EVIDENCE",
    "EXECUTABLE_AUTHORITY",
    "ACCEPTED_DONOR",
    "DERIVED_VIEW",
    "HISTORICAL",
    "QUARANTINE",
}


def _canonical(value: dict) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


@dataclass(frozen=True, slots=True)
class GeoPoint:
    lat: float
    lon: float
    crs: str = "EPSG:4326"

    def __post_init__(self) -> None:
        if not -90 <= self.lat <= 90:
            raise ValueError("latitude out of range")
        if not -180 <= self.lon <= 180:
            raise ValueError("longitude out of range")
        if self.crs != "EPSG:4326":
            raise ValueError("Earth traversal currently accepts EPSG:4326 points only")


@dataclass(frozen=True, slots=True)
class EarthSource:
    """Sanitized provenance contract for a caller-supplied Earth dataset.

    This descriptor proves what dataset bytes and coverage a traversal result is
    bound to. It does not fetch a source, verify an external publisher, or turn
    unobserved/synthetic content into observed evidence.
    """

    source_id: str
    dataset_kind: str
    source_class: str
    content_sha256: str
    min_lat: float
    min_lon: float
    max_lat: float
    max_lon: float
    crs: str = "EPSG:4326"

    def __post_init__(self) -> None:
        source_id = self.source_id.strip()
        if source_id != self.source_id or not source_id or len(source_id) > 128 or not re.fullmatch(r"[A-Za-z0-9._:-]+", source_id):
            raise ValueError("source_id must be a sanitized 1..128 character logical identifier")
        if self.dataset_kind not in _ALLOWED_DATASET_KINDS:
            raise ValueError(f"dataset_kind must be one of {sorted(_ALLOWED_DATASET_KINDS)}")
        if self.source_class not in _ALLOWED_SOURCE_CLASSES:
            raise ValueError("source_class is not admitted by the Genesis source-class contract")
        if not _HEX64.fullmatch(self.content_sha256):
            raise ValueError("content_sha256 must be a lowercase SHA-256 digest")
        if self.crs != "EPSG:4326":
            raise ValueError("Earth source coverage currently requires EPSG:4326")
        if not (-90 <= self.min_lat <= self.max_lat <= 90):
            raise ValueError("latitude coverage bounds are invalid")
        if not (-180 <= self.min_lon <= self.max_lon <= 180):
            raise ValueError("longitude coverage bounds are invalid")

    def covers(self, point: GeoPoint) -> bool:
        return (
            point.crs == self.crs
            and self.min_lat <= point.lat <= self.max_lat
            and self.min_lon <= point.lon <= self.max_lon
        )

    def envelope(self) -> dict:
        value = {
            "schema": "omega.earth.source.v1",
            "source_id": self.source_id,
            "dataset_kind": self.dataset_kind,
            "source_class": self.source_class,
            "content_sha256": self.content_sha256,
            "coverage": {
                "min_lat": self.min_lat,
                "min_lon": self.min_lon,
                "max_lat": self.max_lat,
                "max_lon": self.max_lon,
                "crs": self.crs,
            },
            "external_authority_verified": False,
            "private_locator_published": False,
            "boundary": "descriptor binds supplied dataset bytes and declared coverage only; publisher authenticity and live dataset deployment require external evidence",
        }
        value["binding_sha256"] = sha256(_canonical(value)).hexdigest()
        return value


def destination(start: GeoPoint, bearing_rad: float, distance_m: float) -> GeoPoint:
    br = quantize_heading(bearing_rad)
    d = max(0.0, float(distance_m)) / EARTH_MEAN_RADIUS_M
    p1, l1 = radians(start.lat), radians(start.lon)
    p2 = asin(sin(p1) * cos(d) + cos(p1) * sin(d) * cos(br))
    l2 = l1 + atan2(sin(br) * sin(d) * cos(p1), cos(d) - sin(p1) * sin(p2))
    lon = (degrees(l2) + 540) % 360 - 180
    return GeoPoint(degrees(p2), lon)


def haversine_m(a: GeoPoint, b: GeoPoint) -> float:
    p1, p2 = radians(a.lat), radians(b.lat)
    dp = p2 - p1
    dl = radians(b.lon - a.lon)
    h = sin(dp / 2) ** 2 + cos(p1) * cos(p2) * sin(dl / 2) ** 2
    return 2 * EARTH_MEAN_RADIUS_M * asin(min(1.0, sqrt(h)))


def _source_evidence(start: GeoPoint, target: GeoPoint, sources: Iterable[EarthSource]) -> dict:
    envelopes = []
    coverage_ids = []
    for source in sorted(sources, key=lambda item: (item.source_id, item.content_sha256)):
        envelope = source.envelope()
        envelopes.append(envelope)
        if source.covers(start) and source.covers(target):
            coverage_ids.append(source.source_id)

    if coverage_ids:
        status = "SOURCE_BOUND"
        decision = "PASS"
    else:
        status = "NO_EVIDENCE"
        decision = "HOLD"

    return {
        "decision": decision,
        "status": status,
        "covering_source_ids": coverage_ids,
        "sources": envelopes,
        "observed_ground_claim": False,
        "boundary": "SOURCE_BOUND means the deterministic traversal is bound to supplied dataset metadata with matching declared coverage; it is not proof of live retrieval, publisher authenticity, or observed ground pixels",
    }


def traversal_packet(
    start: GeoPoint,
    bearing_rad: float,
    distance_m: float,
    scale_radius: float,
    *,
    sources: Iterable[EarthSource] = (),
) -> dict:
    target = destination(start, bearing_rad, distance_m)
    evidence = _source_evidence(start, target, sources)
    packet = {
        "schema": "omega.earth.traversal.v2",
        "start": asdict(start),
        "target": asdict(target),
        "distance_m": float(distance_m),
        "computed_geodesic_m": haversine_m(start, target),
        "heading_rad": quantize_heading(bearing_rad),
        "form_value": form_value(scale_radius),
        "stages": ["Earth", "Region", "City", "Street", "Ground"],
        "geometry_evidence": "DERIVED_VIEW",
        "ground_evidence": evidence,
        "evidence_rule": "Ground pixels/observations require separate returned source evidence; missing coverage => HOLD/NO_EVIDENCE.",
        "canonical_mutation": False,
    }
    packet["packet_sha256"] = sha256(_canonical(packet)).hexdigest()
    return packet
