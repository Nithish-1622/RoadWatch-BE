from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Dict, Any
from .service import analyze_bytes

router = APIRouter(prefix='/ocr')


@router.post('/parse')
async def parse_file(file: UploadFile = File(...)) -> Dict[str, Any]:
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail='Empty file')
    res = analyze_bytes(content, filename=file.filename)
    return res
