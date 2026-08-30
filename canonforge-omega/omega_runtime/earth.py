from __future__ import annotations

from dataclasses import dataclass
from math import atan2, cos, degrees, radians, sin, sqrt

# WGS84 constants. This module only transforms supplied coordinates; it does not claim live GIS state.
A = 6378137.0
F = 1.0 / 298.257223563
E2 = F * (2.0 - F)


@dataclass(frozen=True, slots=True)
class GeoPoint:
    lat_deg: float
    lon_deg: float
    alt_m: float = 0.0
    source_id: str = "user_or_import"
    observed_at: str | None = None

    def validate(self) -> "GeoPoint":
        if not -90.0 <= self.lat_deg <= 90.0:
            raise ValueError("latitude must be within [-90, 90]")
        if not -180.0 <= self.lon_deg <= 180.0:
            raise ValueError("longitude must be within [-180, 180]")
        return self


@dataclass(frozen=True, slots=True)
class ECEFPoint:
    x_m: float
    y_m: float
    z_m: float


def geodetic_to_ecef(point: GeoPoint) -> ECEFPoint:
    point.validate()
    lat, lon = radians(point.lat_deg), radians(point.lon_deg)
    sl, cl = sin(lat), cos(lat)
    n = A / sqrt(1.0 - E2 * sl * sl)
    return ECEFPoint(
        (n + point.alt_m) * cl * cos(lon),
        (n + point.alt_m) * cl * sin(lon),
        (n * (1.0 - E2) + point.alt_m) * sl,
    )


def local_enu(origin: GeoPoint, target: GeoPoint) -> tuple[float, float, float]:
    """Return east/north/up metres from origin to target using an ECEF tangent frame."""
    o, t = geodetic_to_ecef(origin), geodetic_to_ecef(target)
    dx, dy, dz = t.x_m-o.x_m, t.y_m-o.y_m, t.z_m-o.z_m
    lat, lon = radians(origin.lat_deg), radians(origin.lon_deg)
    east = -sin(lon)*dx + cos(lon)*dy
    north = -sin(lat)*cos(lon)*dx - sin(lat)*sin(lon)*dy + cos(lat)*dz
    up = cos(lat)*cos(lon)*dx + cos(lat)*sin(lon)*dy + sin(lat)*dz
    return east, north, up


def traversal_summary(origin: GeoPoint, target: GeoPoint) -> dict[str, object]:
    e, n, u = local_enu(origin, target)
    horizontal = sqrt(e*e+n*n)
    return {
        "origin": origin,
        "target": target,
        "east_m": e, "north_m": n, "up_m": u,
        "horizontal_m": horizontal,
        "bearing_deg": (degrees(atan2(e, n)) + 360.0) % 360.0 if horizontal else 0.0,
        "evidence_boundary": "coordinate transform only; terrain, roads, buildings, weather and live motion require timestamped external sources",
    }
