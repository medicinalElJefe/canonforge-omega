from __future__ import annotations
from dataclasses import dataclass, asdict
from math import asin, atan2, cos, degrees, radians, sin, sqrt
from ..calculus import quantize_heading, form_value

EARTH_MEAN_RADIUS_M=6_371_008.8

@dataclass(frozen=True, slots=True)
class GeoPoint:
    lat: float
    lon: float
    crs: str = "EPSG:4326"
    def __post_init__(self):
        if not -90<=self.lat<=90: raise ValueError("latitude out of range")
        if not -180<=self.lon<=180: raise ValueError("longitude out of range")

def destination(start: GeoPoint, bearing_rad: float, distance_m: float) -> GeoPoint:
    br=quantize_heading(bearing_rad); d=max(0.0,float(distance_m))/EARTH_MEAN_RADIUS_M
    p1,l1=radians(start.lat),radians(start.lon)
    p2=asin(sin(p1)*cos(d)+cos(p1)*sin(d)*cos(br))
    l2=l1+atan2(sin(br)*sin(d)*cos(p1),cos(d)-sin(p1)*sin(p2))
    lon=(degrees(l2)+540)%360-180
    return GeoPoint(degrees(p2),lon)

def haversine_m(a:GeoPoint,b:GeoPoint)->float:
    p1,p2=radians(a.lat),radians(b.lat); dp=p2-p1; dl=radians(b.lon-a.lon)
    h=sin(dp/2)**2+cos(p1)*cos(p2)*sin(dl/2)**2
    return 2*EARTH_MEAN_RADIUS_M*asin(min(1.0,sqrt(h)))

def traversal_packet(start:GeoPoint,bearing_rad:float,distance_m:float,scale_radius:float)->dict:
    target=destination(start,bearing_rad,distance_m)
    return {"start":asdict(start),"target":asdict(target),"distance_m":distance_m,"heading_rad":quantize_heading(bearing_rad),"form_value":form_value(scale_radius),"stages":["Earth","Region","City","Street","Ground"],"evidence_rule":"Ground pixels require returned source evidence; missing coverage => HOLD/NO_EVIDENCE."}
