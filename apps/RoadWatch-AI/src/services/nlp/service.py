import asyncio
import hashlib
from typing import Any, Dict

from storage.cache import async_get, async_set, make_key

from .inference import infer_text


async def analyze(payload: Any) -> Dict[str, Any]:
    if isinstance(payload, dict):
        text = payload.get('text') or payload.get('query') or ''
    else:
        text = str(payload or '')

    key = make_key('nlp:infer', hashlib.sha256(text.encode('utf-8')).hexdigest())
    cached = await async_get(key)
    if cached.get('cache_hit') and isinstance(cached.get('value'), dict):
        result = cached['value']
        result['cache_meta'] = {'cache_hit': True, 'cache_key': key, 'ttl': cached.get('ttl')}
        return result

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, infer_text, text)
    result['cache_meta'] = {'cache_hit': False, 'cache_key': key, 'ttl': int(3600)}
    try:
        await async_set(key, result, ttl=3600)
    except Exception:
        pass
    return result
