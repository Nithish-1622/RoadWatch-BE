import asyncio
import os
import aiohttp
from typing import Dict, Any, Union
from .ocr_engine import ocr_bytes, summarize_ocr_result
from storage.cache import sync_get, make_key
import hashlib


async def _fetch_url_bytes(url: str, timeout: int = 15) -> bytes:
    async with aiohttp.ClientSession() as session:
        async with session.get(url, timeout=timeout) as resp:
            resp.raise_for_status()
            return await resp.read()


async def analyze(payload: Union[str, Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze a document URL or local path or payload dict containing `document_url`.

    Returns a dict with keys: service, extracted_text, metadata, confidence
    """
    if isinstance(payload, dict):
        doc = payload.get("document_url") or payload.get("path")
    else:
        doc = payload

    if not doc:
        return {"service": "ocr", "error": "no_document"}

    # If it's a local file path
    data = None
    filename = None
    if isinstance(doc, str) and os.path.exists(doc):
        filename = os.path.basename(doc)
        try:
            with open(doc, "rb") as fh:
                data = fh.read()
        except Exception as e:
            return {"service": "ocr", "error": "read_failed", "detail": str(e)}
    else:
        # assume URL
        try:
            data = await _fetch_url_bytes(str(doc))
            # attempt to infer filename from URL
            filename = os.path.basename(str(doc).split("?")[0])
        except Exception as e:
            return {"service": "ocr", "error": "download_failed", "detail": str(e)}

    try:
        ocr_res = ocr_bytes(data, filename=filename)
        out = summarize_ocr_result(ocr_res)
        out.update({"service": "ocr"})
        # attach cache metadata if available
        try:
            key_input = (filename or '') + ':' + hashlib.sha256(data).hexdigest()
            cache_key = make_key('ocr:bytes', key_input)
            cached = sync_get(cache_key)
            out['_cache'] = {'cache_hit': bool(cached.get('cache_hit')), 'cache_key': cache_key, 'ttl': cached.get('ttl')}
        except Exception:
            pass
        return out
    except Exception as e:
        return {"service": "ocr", "error": "ocr_failed", "detail": str(e)}

