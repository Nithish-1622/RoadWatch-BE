from fastapi import APIRouter, Query, HTTPException
from typing import Dict, Any
from .service import analyze

router = APIRouter(prefix='/geo')


@router.get('/lookup')
async def lookup(lat: float = Query(...), lon: float = Query(...)) -> Dict[str, Any]:
    if lat is None or lon is None:
        raise HTTPException(status_code=400, detail='lat and lon required')
    res = await analyze({'lat': lat, 'lon': lon})
    return res
