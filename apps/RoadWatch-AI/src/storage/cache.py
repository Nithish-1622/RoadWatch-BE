import json
import time
import hashlib
from typing import Any, Dict, Optional, Tuple

from .redis_client import get_async_client, get_sync_client


def _make_hash(s: str) -> str:
    return hashlib.sha256(s.encode('utf-8')).hexdigest()


def make_key(prefix: str, *parts: str) -> str:
    joined = ":".join([prefix] + [p for p in parts if p is not None])
    return joined


def sync_get(key: str) -> Dict[str, Any]:
    """Synchronous get. Returns {value, cache_hit, cache_key, ttl} where value is decoded JSON."""
    client = get_sync_client()
    meta = {"cache_hit": False, "cache_key": key, "ttl": None, "value": None}
    if not client:
        return meta
    try:
        v = client.get(key)
        if v is None:
            return meta
        # try to decode JSON
        try:
            meta['value'] = json.loads(v)
        except Exception:
            meta['value'] = v
        meta['cache_hit'] = True
        try:
            ttl = client.ttl(key)
            meta['ttl'] = int(ttl) if ttl is not None else None
        except Exception:
            meta['ttl'] = None
        return meta
    except Exception:
        return meta


def sync_set(key: str, value: Any, ttl: Optional[int] = None) -> Dict[str, Any]:
    client = get_sync_client()
    meta = {"cache_key": key, "ttl": ttl}
    if not client:
        return meta
    try:
        if isinstance(value, (dict, list)):
            v = json.dumps(value)
        else:
            v = str(value)
        if ttl:
            client.set(key, v, ex=int(ttl))
        else:
            client.set(key, v)
        return meta
    except Exception:
        return meta


async def async_get(key: str) -> Dict[str, Any]:
    client = get_async_client()
    meta = {"cache_hit": False, "cache_key": key, "ttl": None, "value": None}
    if not client:
        return meta
    try:
        v = await client.get(key)
        if v is None:
            return meta
        try:
            meta['value'] = json.loads(v)
        except Exception:
            meta['value'] = v
        meta['cache_hit'] = True
        try:
            ttl = await client.ttl(key)
            meta['ttl'] = int(ttl) if ttl is not None else None
        except Exception:
            meta['ttl'] = None
        return meta
    except Exception:
        return meta


async def async_set(key: str, value: Any, ttl: Optional[int] = None) -> Dict[str, Any]:
    client = get_async_client()
    meta = {"cache_key": key, "ttl": ttl}
    if not client:
        return meta
    try:
        if isinstance(value, (dict, list)):
            v = json.dumps(value)
        else:
            v = str(value)
        if ttl:
            await client.set(key, v, ex=int(ttl))
        else:
            await client.set(key, v)
        return meta
    except Exception:
        return meta


def invalidate_pattern(pattern: str) -> int:
    client = get_sync_client()
    if not client:
        return 0
    try:
        # scan and delete
        count = 0
        cur = '0'
        while True:
            cur, keys = client.scan(cur, match=pattern, count=1000)
            if keys:
                client.delete(*keys)
                count += len(keys)
            if cur == '0' or cur == 0:
                break
        return count
    except Exception:
        return 0


def invalidate_key(key: str) -> bool:
    client = get_sync_client()
    if not client:
        return False
    try:
        return client.delete(key) > 0
    except Exception:
        return False
