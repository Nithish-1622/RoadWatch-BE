import asyncio
import os
from typing import Any

from services.rag import ingest as rag_ingest
from services.rag.hybrid import HybridRetriever
from services.rag.reranker import ReRanker
from services.rag.generator import synthesize_answer
from storage.cache import sync_get, make_key
import hashlib


async def analyze(context: dict) -> dict[str, Any]:
    """Perform a RAG-style retrieval given `context`.

    Behavior:
    - If a Postgres `DATABASE_URL` and `psycopg` are available, query pgvector via the
      helper in `services.rag.pgvector_store`.
    - Otherwise fall back to an in-memory vector store built from provided `context['docs']`
      or small built-in examples.
    """
    query = (context or {}).get("text") or (context or {}).get("query") or ""
    if not query:
        await asyncio.sleep(0.02)
        return {
            "service": "rag",
            "answer": None,
            "sources": [],
            "confidence": 0.0,
            "note": "no query provided",
        }

    # Build document pool from provided docs and integrated services
    docs = []
    # integrate OCR outputs (if present)
    if context and isinstance(context, dict):
        if 'ocr' in context and isinstance(context['ocr'], dict):
            o = context['ocr']
            docs.append({'id': 'ocr_doc', 'text': o.get('extracted_text', ''), 'meta': {'source': 'ocr', 'metadata': o.get('metadata', {})}})
        if 'geo' in context and isinstance(context['geo'], dict):
            g = context['geo']
            docs.append({'id': 'geo_doc', 'text': f"Road type: {g.get('road_type')} authority: {g.get('authority')}", 'meta': {'source': 'geo', 'raw': g}})
        if 'analytics' in context and isinstance(context['analytics'], dict):
            a = context['analytics']
            docs.append({'id': 'analytics_doc', 'text': str(a), 'meta': {'source': 'analytics'}})
        # include any explicit docs
        if isinstance(context.get('docs'), list):
            docs.extend(context.get('docs'))

    # fallback small set
    if not docs:
        docs = [
            {"id": "doc1", "text": "Pothole reported on Main St near the 3rd traffic light.", "meta": {"source": "user_report"}},
            {"id": "doc2", "text": "Graffiti observed on the north wall of 5th avenue underpass.", "meta": {"source": "camera"}},
            {"id": "doc3", "text": "Fallen tree blocking the bicycle lane on River Road after the bridge.", "meta": {"source": "sensor"}},
        ]

    # Build hybrid retriever
    retriever = HybridRetriever(docs)
    candidates = retriever.retrieve(query, top_k=10, alpha=0.6)

    # retrieval cache metadata
    try:
        rkey = make_key('rag:retrieval', hashlib.sha256(query.encode('utf-8')).hexdigest())
        rmeta = sync_get(rkey)
        retrieval_cache = {'cache_hit': bool(rmeta.get('cache_hit')), 'cache_key': rkey, 'ttl': rmeta.get('ttl')}
    except Exception:
        retrieval_cache = {'cache_hit': False, 'cache_key': None, 'ttl': None}

    # Cross-encoder re-rank
    reranker = ReRanker()
    reranked = reranker.rerank(query, candidates)

    # prepare evidence meta for generator: ensure meta includes original text
    enriched = []
    for cid, score, meta in reranked:
        # attach text to meta if missing
        if not meta.get('text'):
            # find in docs
            for d in docs:
                if d.get('id') == cid:
                    meta['text'] = d.get('text')
                    break
        enriched.append((cid, score, meta))

    # Synthesize answer using LLM or conservative synthesizer
    gen = synthesize_answer(query, enriched, max_snippets=5)

    # Build citations list from top-k
    citations = []
    for cid, score, meta in enriched[:5]:
        citations.append({"id": cid, "score": float(score), "source": meta.get('meta', meta.get('source') or meta.get('source_id'))})

    return {"service": "rag", "answer": gen.get('answer'), "citations": citations, "sources": gen.get('sources'), "confidence": float(sum([c[1] for c in enriched[:5]]) / (len(enriched[:5]) or 1)), "retrieval_cache": retrieval_cache}
