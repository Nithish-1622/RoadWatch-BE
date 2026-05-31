from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Dict
from .service import aggregate

router = APIRouter(prefix='/aggregator')


class AggregatorRequest(BaseModel):
    services: Dict[str, Any]


@router.post('/aggregate')
async def aggregate_endpoint(req: AggregatorRequest):
    if not req.services:
        raise HTTPException(status_code=400, detail='services required')
    out = aggregate(req.services)
    return out
