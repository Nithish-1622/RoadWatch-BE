import os
import json
import asyncio
from typing import Optional, Dict, Any

_REDIS_ASYNC = None
_REDIS_SYNC = None


def _init_async_client() -> Optional[object]:
    global _REDIS_ASYNC
    if _REDIS_ASYNC is not None:
        return _REDIS_ASYNC
    try:
        import redis.asyncio as aioredis
        url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
        _REDIS_ASYNC = aioredis.from_url(url, decode_responses=True)
        return _REDIS_ASYNC
    except Exception:
        _REDIS_ASYNC = None
        return None


def _init_sync_client() -> Optional[object]:
    global _REDIS_SYNC
    if _REDIS_SYNC is not None:
        return _REDIS_SYNC
    try:
        import redis
        url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
        _REDIS_SYNC = redis.from_url(url, decode_responses=True)
        return _REDIS_SYNC
    except Exception:
        _REDIS_SYNC = None
        return None


def get_async_client():
    return _init_async_client()


def get_sync_client():
    return _init_sync_client()


def ping_health() -> Dict[str, Any]:
    """Check Redis health synchronously if possible, else attempt async ping."""
    client = get_sync_client()
    out = {"available": False, "detail": None}
    try:
        if client:
            pong = client.ping()
            out["available"] = bool(pong)
            out["detail"] = "sync-ping"
            return out
    except Exception as e:
        out["detail"] = str(e)

    # try async
    aclient = get_async_client()
    if not aclient:
        return out

    try:
        loop = asyncio.new_event_loop()
        try:
            pong = loop.run_until_complete(aclient.ping())
            out["available"] = bool(pong)
            out["detail"] = "async-ping"
        finally:
            loop.close()
    except Exception as e:
        out["detail"] = str(e)
    return out
