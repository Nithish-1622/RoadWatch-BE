"""Geo intelligence engine for RoadWatch.

Resolves nearest roads, administrative boundaries, road ownership and authority
mappings using PostGIS when available, and falls back to OpenStreetMap reverse
geocoding / Overpass lookups when database data is missing.
"""

import asyncio
import os
from typing import Optional, Dict, Any

from storage.cache import async_get, async_set, make_key

try:
    import asyncpg
except Exception:
    asyncpg = None

try:
    import aiohttp
except Exception:
    aiohttp = None

try:
    from cachetools import TTLCache
    GEO_CACHE = TTLCache(maxsize=4096, ttl=300)
except Exception:
    GEO_CACHE = {}

POSTGIS_DSN = os.environ.get("POSTGIS_DSN")
GIS_ROADS_TABLE = os.environ.get("GIS_ROADS_TABLE", "roads")
GIS_BOUNDARIES_TABLE = os.environ.get("GIS_BOUNDARIES_TABLE", "geo.admin_boundaries")
GIS_ROAD_OWNERSHIP_TABLE = os.environ.get("GIS_ROAD_OWNERSHIP_TABLE", "geo.road_ownership")
GIS_AUTHORITY_MAP_TABLE = os.environ.get("GIS_AUTHORITY_MAP_TABLE", "geo.authority_mappings")


def _round_key(lat: float, lon: float, prec: int = 5) -> str:
    return f"{round(lat, prec)}:{round(lon, prec)}"


async def _query_postgis_nearest(lat: float, lon: float, radius_m: int = 50) -> Optional[Dict[str, Any]]:
    if not POSTGIS_DSN or not asyncpg:
        return None
    try:
        conn = await asyncpg.connect(POSTGIS_DSN)
        sql = f"""
        SELECT id, name, tags->'highway' AS highway, tags->'operator' AS operator, tags->'maintainer' AS maintainer,
               ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS dist_m
        FROM {GIS_ROADS_TABLE}
        WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
        ORDER BY dist_m ASC
        LIMIT 1
        """
        rec = await conn.fetchrow(sql, lon, lat, radius_m)
        await conn.close()
        if not rec:
            return None
        return {
            "source": "postgis",
            "id": rec["id"],
            "name": rec["name"],
            "highway": rec["highway"],
            "operator": rec["operator"],
            "maintainer": rec["maintainer"],
            "distance_m": float(rec["dist_m"]),
        }
    except Exception:
        return None


async def _query_admin_boundary(lat: float, lon: float) -> Optional[Dict[str, Any]]:
    if not POSTGIS_DSN or not asyncpg:
        return None
    try:
        conn = await asyncpg.connect(POSTGIS_DSN)
        sql = f"""
        SELECT boundary_code, boundary_name, boundary_level, parent_code, authority_name, owner_name, admin_code, confidence,
               ST_Area(geom::geography) AS area_m2
        FROM {GIS_BOUNDARIES_TABLE}
        WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326))
        ORDER BY ST_Area(geom::geography) ASC
        LIMIT 1
        """
        rec = await conn.fetchrow(sql, lon, lat)
        await conn.close()
        if not rec:
            return None
        return {
            "source": "postgis_boundary",
            "boundary_code": rec["boundary_code"],
            "boundary_name": rec["boundary_name"],
            "boundary_level": rec["boundary_level"],
            "parent_code": rec["parent_code"],
            "authority_name": rec["authority_name"],
            "owner_name": rec["owner_name"],
            "admin_code": rec["admin_code"],
            "confidence": float(rec["confidence"] or 0.0),
            "area_m2": float(rec["area_m2"] or 0.0),
        }
    except Exception:
        return None


async def _query_road_ownership(road_name: Optional[str], road_type: Optional[str], admin_code: Optional[str]) -> Optional[Dict[str, Any]]:
    if not POSTGIS_DSN or not asyncpg:
        return None
    if not road_name and not admin_code:
        return None
    try:
        conn = await asyncpg.connect(POSTGIS_DSN)
        clauses = []
        params = []
        if road_name:
            params.append(road_name)
            clauses.append(f"road_name ILIKE ${len(params)}")
        if road_type:
            params.append(road_type)
            clauses.append(f"(road_type = ${len(params)} OR road_class = ${len(params)})")
        if admin_code:
            params.append(admin_code)
            clauses.append(f"admin_code = ${len(params)}")
        where_sql = " AND ".join(clauses) if clauses else "TRUE"
        sql = f"""
        SELECT road_name, road_type, authority_name, owner_name, jurisdiction_level, admin_code, confidence, tags
        FROM {GIS_ROAD_OWNERSHIP_TABLE}
        WHERE {where_sql}
        ORDER BY confidence DESC
        LIMIT 1
        """
        rec = await conn.fetchrow(sql, *params)
        await conn.close()
        if not rec:
            return None
        return {
            "source": "postgis_ownership",
            "road_name": rec["road_name"],
            "road_type": rec["road_type"],
            "authority_name": rec["authority_name"],
            "owner_name": rec["owner_name"],
            "jurisdiction_level": rec["jurisdiction_level"],
            "admin_code": rec["admin_code"],
            "confidence": float(rec["confidence"] or 0.0),
            "tags": rec["tags"],
        }
    except Exception:
        return None


async def _query_authority_mapping(admin_code: Optional[str], boundary_level: Optional[str], road_class: Optional[str]) -> Optional[Dict[str, Any]]:
    if not POSTGIS_DSN or not asyncpg:
        return None
    if not admin_code and not boundary_level and not road_class:
        return None
    try:
        conn = await asyncpg.connect(POSTGIS_DSN)
        clauses = ["active = TRUE"]
        params = []
        if admin_code:
            params.append(admin_code)
            clauses.append(f"(admin_code = ${len(params)} OR admin_code IS NULL)")
        if boundary_level:
            params.append(boundary_level)
            clauses.append(f"(boundary_level = ${len(params)} OR boundary_level IS NULL)")
        if road_class:
            params.append(road_class)
            clauses.append(f"(road_class = ${len(params)} OR road_class IS NULL)")
        sql = f"""
        SELECT admin_code, boundary_level, road_class, authority_name, owner_name, owner_type, contact_ref, confidence
        FROM {GIS_AUTHORITY_MAP_TABLE}
        WHERE {' AND '.join(clauses)}
        ORDER BY confidence DESC
        LIMIT 1
        """
        rec = await conn.fetchrow(sql, *params)
        await conn.close()
        if not rec:
            return None
        return {
            "source": "postgis_authority_map",
            "admin_code": rec["admin_code"],
            "boundary_level": rec["boundary_level"],
            "road_class": rec["road_class"],
            "authority_name": rec["authority_name"],
            "owner_name": rec["owner_name"],
            "owner_type": rec["owner_type"],
            "contact_ref": rec["contact_ref"],
            "confidence": float(rec["confidence"] or 0.0),
        }
    except Exception:
        return None


async def _reverse_geocode_nominatim(lat: float, lon: float) -> Optional[Dict[str, Any]]:
    if not aiohttp:
        return None
    url = "https://nominatim.openstreetmap.org/reverse"
    params = {"format": "jsonv2", "lat": lat, "lon": lon, "zoom": 18, "addressdetails": 1}
    headers = {"User-Agent": "RoadWatchGeo/1.0 (+https://example.com)"}
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params, headers=headers, timeout=10) as resp:
                if resp.status != 200:
                    return None
                j = await resp.json()
                return {"source": "nominatim", "raw": j, "address": j.get("address", {}), "display_name": j.get("display_name")}
    except Exception:
        return None


async def _overpass_road_lookup(lat: float, lon: float, radius: int = 100) -> Optional[Dict[str, Any]]:
    if not aiohttp:
        return None
    query = f"[out:json];(way(around:{radius},{lat},{lon})[highway];);out tags geom 1;"
    url = "https://overpass-api.de/api/interpreter"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, data=query, timeout=15) as resp:
                if resp.status != 200:
                    return None
                j = await resp.json()
                elements = j.get("elements", [])
                if not elements:
                    return None
                way = elements[0]
                tags = way.get("tags", {})
                return {"source": "overpass", "id": way.get("id"), "tags": tags}
    except Exception:
        return None


def _score_confidence(postgis_hit: Optional[Dict], overpass_hit: Optional[Dict], nominatim_hit: Optional[Dict], boundary_hit: Optional[Dict], ownership_hit: Optional[Dict], mapping_hit: Optional[Dict]) -> float:
    score = 0.0
    if postgis_hit:
        d = postgis_hit.get("distance_m", 1000)
        score = max(score, 0.9 - min(d / 1000.0, 0.5))
    if boundary_hit:
        score = max(score, float(boundary_hit.get("confidence", 0.75) or 0.75))
    if ownership_hit:
        score = max(score, float(ownership_hit.get("confidence", 0.75) or 0.75))
    if mapping_hit:
        score = max(score, float(mapping_hit.get("confidence", 0.7) or 0.7))
    if overpass_hit and score < 0.85:
        score = max(score, 0.7)
    if nominatim_hit and score < 0.6:
        score = max(score, 0.5)
    return round(float(score), 2)


async def lookup(lat: float, lon: float) -> Dict[str, Any]:
    key = _round_key(lat, lon, prec=5)

    try:
        rkey = make_key('geo:lookup', key)
        cached = await async_get(rkey)
        if cached.get('cache_hit') and isinstance(cached.get('value'), dict):
            val = cached.get('value')
            val['_cache'] = {'cache_hit': True, 'cache_key': rkey, 'ttl': cached.get('ttl')}
            return val
    except Exception:
        pass

    try:
        if key in GEO_CACHE:
            return GEO_CACHE[key]
    except Exception:
        pass

    tasks = [
        asyncio.create_task(_query_postgis_nearest(lat, lon)),
        asyncio.create_task(_query_admin_boundary(lat, lon)),
        asyncio.create_task(_overpass_road_lookup(lat, lon)),
        asyncio.create_task(_reverse_geocode_nominatim(lat, lon)),
    ]
    postgis_hit, boundary_hit, overpass_hit, nominatim_hit = await asyncio.gather(*tasks)

    road_name = None
    road_type = None
    authority = None
    owner_name = None
    admin_boundary = None

    if boundary_hit:
        admin_boundary = {
            "boundary_code": boundary_hit.get("boundary_code"),
            "boundary_name": boundary_hit.get("boundary_name"),
            "boundary_level": boundary_hit.get("boundary_level"),
            "admin_code": boundary_hit.get("admin_code"),
        }

    if postgis_hit and postgis_hit.get("name"):
        road_name = postgis_hit.get("name")
    elif overpass_hit:
        road_name = overpass_hit.get("tags", {}).get("name")
    elif nominatim_hit:
        road_name = nominatim_hit.get("address", {}).get("road")

    if postgis_hit and postgis_hit.get("highway"):
        road_type = postgis_hit.get("highway")
        authority = postgis_hit.get("operator") or postgis_hit.get("maintainer")
    elif overpass_hit:
        tags = overpass_hit.get("tags", {})
        road_type = tags.get("highway")
        authority = tags.get("operator") or tags.get("maintainer") or tags.get("authority")
    elif nominatim_hit:
        addr = nominatim_hit.get("address", {})
        road_type = addr.get("road") or addr.get("residential") or addr.get("neighbourhood")
        authority = addr.get("county") or addr.get("state")

    ownership_hit = await _query_road_ownership(road_name, road_type, boundary_hit.get("admin_code") if boundary_hit else None)
    if ownership_hit:
        owner_name = ownership_hit.get("owner_name") or ownership_hit.get("authority_name")
        authority = authority or ownership_hit.get("authority_name") or ownership_hit.get("owner_name")

    mapping_hit = await _query_authority_mapping(
        boundary_hit.get("admin_code") if boundary_hit else None,
        boundary_hit.get("boundary_level") if boundary_hit else None,
        road_type,
    )
    if mapping_hit:
        authority = mapping_hit.get("authority_name") or authority
        owner_name = owner_name or mapping_hit.get("owner_name")
        if not admin_boundary:
            admin_boundary = {
                "boundary_code": mapping_hit.get("admin_code"),
                "boundary_name": None,
                "boundary_level": mapping_hit.get("boundary_level"),
                "admin_code": mapping_hit.get("admin_code"),
            }

    confidence = _score_confidence(postgis_hit, overpass_hit, nominatim_hit, boundary_hit, ownership_hit, mapping_hit)

    out = {
        "road_type": road_type or "unknown",
        "authority": authority or "unknown",
        "road_owner": owner_name or "unknown",
        "admin_boundary": admin_boundary or {},
        "confidence": confidence,
        "sources": {},
    }
    if postgis_hit:
        out["sources"]["postgis"] = postgis_hit
    if boundary_hit:
        out["sources"]["boundary"] = boundary_hit
    if ownership_hit:
        out["sources"]["ownership"] = ownership_hit
    if mapping_hit:
        out["sources"]["authority_mapping"] = mapping_hit
    if overpass_hit:
        out["sources"]["overpass"] = overpass_hit
    if nominatim_hit:
        out["sources"]["nominatim"] = nominatim_hit

    try:
        GEO_CACHE[key] = out
    except Exception:
        GEO_CACHE[key] = out

    try:
        rkey = make_key('geo:lookup', key)
        await async_set(rkey, out, ttl=int(os.environ.get('GEO_LOOKUP_CACHE_TTL', '3600')))
    except Exception:
        pass

    return out
