"""Geo Intelligence service for RoadWatch.

Implements PostGIS-backed nearest-road lookup, OpenStreetMap Overpass queries,
and Nominatim reverse geocoding as fallbacks. Returns structured road_type,
authority, and confidence.
"""
from typing import Any, Dict
import asyncio
from .engine import lookup as engine_lookup


async def analyze(payload: Any) -> Dict[str, Any]:
    lat = None
    lon = None
    if isinstance(payload, dict):
        lat = payload.get("lat") or payload.get("latitude")
        lon = payload.get("lon") or payload.get("longitude")
    elif isinstance(payload, (list, tuple)) and len(payload) >= 2:
        lat, lon = payload[0], payload[1]

    if lat is None or lon is None:
        return {"service": "geo", "error": "no_gps"}

    try:
        res = await engine_lookup(float(lat), float(lon))
        res.update({"service": "geo"})
        return res
    except Exception as e:
        return {"service": "geo", "error": "lookup_failed", "detail": str(e)}

