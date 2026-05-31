from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Dict
from .service import analyze

router = APIRouter(prefix='/rag')


class RAGRequest(BaseModel):
    text: str
    docs: list | None = None
    ocr: dict | None = None
    geo: dict | None = None
    analytics: dict | None = None


@router.post('/query')
async def query(req: RAGRequest) -> Dict[str, Any]:
    ctx = req.dict()
    if not ctx.get('text'):
        raise HTTPException(status_code=400, detail='text required')
    res = await analyze(ctx)
    return res
