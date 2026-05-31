from fastapi import APIRouter
from .redis_client import ping_health
from .cache import invalidate_key, invalidate_pattern
from pydantic import BaseModel


class InvalidateKeyReq(BaseModel):
    key: str


class InvalidatePatternReq(BaseModel):
    pattern: str

router = APIRouter(prefix="/storage", tags=["storage"])


@router.get("/redis/health")
def redis_health():
    h = ping_health()
    return {"redis": h}


@router.post('/redis/invalidate/key')
def invalidate_key_endpoint(req: InvalidateKeyReq):
    ok = invalidate_key(req.key)
    return {"invalidated": ok, "key": req.key}


@router.post('/redis/invalidate/pattern')
def invalidate_pattern_endpoint(req: InvalidatePatternReq):
    count = invalidate_pattern(req.pattern)
    return {"invalidated_count": count, "pattern": req.pattern}
