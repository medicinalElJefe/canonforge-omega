from __future__ import annotations

from datetime import datetime, timezone
from hashlib import sha256
import json
from math import atan2, cos, radians, sin, sqrt
from typing import Any
from urllib.parse import urlencode
from urllib.request import Request, urlopen

NOAA_IMAGES = [
    {"id":"GOES19_CONUS_GEOCOLOR","label":"GOES-19 East CONUS","url":"https://cdn.star.nesdis.noaa.gov/GOES19/ABI/CONUS/GEOCOLOR/1250x750.jpg","authority":"NOAA NESDIS / CIRA GeoColor"},
    {"id":"GOES19_FD_GEOCOLOR","label":"GOES-19 East Full Disk","url":"https://cdn.star.nesdis.noaa.gov/GOES19/ABI/FD/GEOCOLOR/1808x1808.jpg","authority":"NOAA NESDIS / CIRA GeoColor"},
    {"id":"GOES18_FD_GEOCOLOR","label":"GOES-18 West Full Disk","url":"https://cdn.star.nesdis.noaa.gov/GOES18/ABI/FD/GEOCOLOR/1808x1808.jpg","authority":"NOAA NESDIS / CIRA GeoColor"},
]
USGS_DAY = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
EONET_OPEN = "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=100"
NOAA_KP = "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json"
OPEN_METEO = "https://api.open-meteo.com/v1/forecast"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _hash(value: Any) -> str:
    return sha256(json.dumps(value,sort_keys=True,separators=(",",":"),default=str).encode("utf-8")).hexdigest()


def _json(url: str, timeout: float = 8.0) -> Any:
    req=Request(url,headers={"User-Agent":"OMEGA-Genesis/1.1 (+source-bound evidence gateway)","Accept":"application/json"})
    with urlopen(req,timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def _distance_km(lat1:float,lon1:float,lat2:float,lon2:float)->float:
    R=6371.0088; p1,p2=radians(lat1),radians(lat2); dp=radians(lat2-lat1); dl=radians(lon2-lon1)
    a=sin(dp/2)**2+cos(p1)*cos(p2)*sin(dl/2)**2
    return 2*R*atan2(sqrt(a),sqrt(max(0.0,1-a)))


def verify_noaa_alias(item: dict[str,str], timeout: float = 8.0) -> dict[str,Any]:
    req=Request(item["url"],headers={"User-Agent":"OMEGA-Genesis/1.1","Range":"bytes=0-0"})
    try:
        with urlopen(req,timeout=timeout) as r:
            ctype=r.headers.get("Content-Type",""); modified=r.headers.get("Last-Modified"); status=getattr(r,"status",200)
            evidence={"id":item["id"],"label":item["label"],"source_url":item["url"],"authority":item["authority"],"http_status":status,"content_type":ctype,"observation_at":modified,"retrieved_at":_now(),"binding":"LATEST_ALIAS_DIRECT_IMAGE","historical_playback":False,"geoColor_boundary":"NOAA/CIRA derived sensor composite; daytime simulated green; nighttime ABI bands 7/13; any city-light layer is static orientation context."}
            evidence["evidence_hash"]=_hash(evidence)
            evidence["status"]="CURRENT_VERIFIED" if 200<=status<400 and ctype.lower().startswith("image/") else "HOLD"
            return evidence
    except Exception as exc:
        return {"id":item["id"],"label":item["label"],"source_url":item["url"],"authority":item["authority"],"status":"NO_EVIDENCE","error":type(exc).__name__,"detail":str(exc),"retrieved_at":_now(),"binding":"LATEST_ALIAS_DIRECT_IMAGE"}


def _earthquakes(lat:float,lon:float)->dict[str,Any]:
    data=_json(USGS_DAY); features=data.get("features",[]); mags=[f.get("properties",{}).get("mag") for f in features]; mags=[float(x) for x in mags if isinstance(x,(int,float))]
    nearest=None
    for f in features:
        coords=(f.get("geometry") or {}).get("coordinates") or []
        if len(coords)<2: continue
        d=_distance_km(lat,lon,float(coords[1]),float(coords[0]))
        if nearest is None or d<nearest["distance_km"]:
            p=f.get("properties",{}); nearest={"distance_km":d,"magnitude":p.get("mag"),"place":p.get("place"),"time_ms":p.get("time"),"url":p.get("url")}
    out={"authority":"USGS Earthquake Hazards Program","source_url":USGS_DAY,"past_day_count":len(features),"max_magnitude":max(mags) if mags else None,"nearest":nearest,"retrieved_at":_now(),"evidence_class":"OBSERVED_EXTERNAL"};out["evidence_hash"]=_hash(out);return out


def _eonet(lat:float,lon:float)->dict[str,Any]:
    data=_json(EONET_OPEN); events=data.get("events",[]); nearest=None; categories={}
    for ev in events:
        for cat in ev.get("categories",[]): categories[cat.get("title") or cat.get("id")]=categories.get(cat.get("title") or cat.get("id"),0)+1
        for g in reversed(ev.get("geometry",[]) or []):
            coords=g.get("coordinates")
            if isinstance(coords,list) and len(coords)>=2 and all(isinstance(x,(int,float)) for x in coords[:2]):
                d=_distance_km(lat,lon,float(coords[1]),float(coords[0]))
                if nearest is None or d<nearest["distance_km"]: nearest={"distance_km":d,"id":ev.get("id"),"title":ev.get("title"),"date":g.get("date"),"link":ev.get("link")}
                break
    out={"authority":"NASA EONET v3","source_url":EONET_OPEN,"open_event_count":len(events),"categories":categories,"nearest":nearest,"retrieved_at":_now(),"evidence_class":"IMPORTED_EXTERNAL"};out["evidence_hash"]=_hash(out);return out


def _kp()->dict[str,Any]:
    rows=_json(NOAA_KP); latest=None
    if isinstance(rows,list) and rows:
        header=rows[0] if all(isinstance(x,str) for x in rows[0]) else []
        for row in reversed(rows[1:] if header else rows):
            if isinstance(row,list) and len(row)>=2:
                latest=dict(zip(header,row)) if header else {"time_tag":row[0],"kp":row[1]}
                break
    out={"authority":"NOAA Space Weather Prediction Center","source_url":NOAA_KP,"latest":latest,"retrieved_at":_now(),"evidence_class":"IMPORTED_EXTERNAL"};out["evidence_hash"]=_hash(out);return out


def _weather(lat:float,lon:float)->dict[str,Any]:
    params=urlencode({"latitude":lat,"longitude":lon,"current":"temperature_2m,wind_speed_10m,cloud_cover","timezone":"UTC"})
    url=OPEN_METEO+"?"+params; data=_json(url)
    out={"authority":"Open-Meteo","source_url":url,"current":data.get("current"),"current_units":data.get("current_units"),"retrieved_at":_now(),"evidence_class":"IMPORTED_EXTERNAL","boundary":"provider output may blend model and observational inputs; not canonical OMEGA measurement"};out["evidence_hash"]=_hash(out);return out


def earth_context(lat:float,lon:float)->dict[str,Any]:
    if not -90<=lat<=90 or not -180<=lon<=180: raise ValueError("WGS84 coordinate out of range")
    channels={}
    for name,fn in (("seismic",lambda:_earthquakes(lat,lon)),("natural_events",lambda:_eonet(lat,lon)),("space_weather",_kp),("local_conditions",lambda:_weather(lat,lon))):
        try: channels[name]=fn()
        except Exception as exc: channels[name]={"status":"NO_EVIDENCE","error":type(exc).__name__,"detail":str(exc),"retrieved_at":_now()}
    images=[verify_noaa_alias(x) for x in NOAA_IMAGES]
    # B058-compatible bounded display context. Missing channels contribute zero and remain visibly unavailable.
    mag=channels.get("seismic",{}).get("max_magnitude"); kp=(channels.get("space_weather",{}).get("latest") or {}).get("Kp") or (channels.get("space_weather",{}).get("latest") or {}).get("kp")
    wind=(channels.get("local_conditions",{}).get("current") or {}).get("wind_speed_10m"); events=channels.get("natural_events",{}).get("open_event_count")
    def num(x):
        try:return float(x)
        except:return 0.0
    context=min(1.0,0.30*min(1,num(mag)/8)+0.25*min(1,num(kp)/9)+0.20*min(1,num(wind)/100)+0.25*min(1,num(events)/100))
    result={"schema":"OMEGA_EARTH_EVIDENCE_V1","target":{"lat":lat,"lon":lon,"crs":"EPSG:4326"},"satellite":images,"channels":channels,"derived_context_index":context,"derived_context_boundary":"normalized display context only; not empirical proof, physical law or forecast","generated_pixels_substituted":False,"retrieved_at":_now()};result["packet_fingerprint"]=_hash(result);return result
