"""Hybrid retrieval: dense (vector) + sparse (BM25) fusion.
"""
from typing import List, Tuple, Dict, Any, Iterable
import json
import os
import hashlib
from storage.cache import sync_get, sync_set, make_key
import numpy as np
from .ingest import embed_texts, InMemoryVectorStore

try:
    from rank_bm25 import BM25Okapi
except Exception:
    BM25Okapi = None


class HybridRetriever:
    def __init__(self, docs: List[dict]):
        # docs: list of {id, text, meta}
        self.docs = docs
        self.store = InMemoryVectorStore()
        self._texts = []
        for d in docs:
            self._texts.append(d.get('text', ''))
        # build BM25
        if BM25Okapi:
            tokenized = [t.split() for t in self._texts]
            self.bm25 = BM25Okapi(tokenized)
        else:
            self.bm25 = None
        # build dense store
        chunks = []
        metas = []
        ids = []
        for d in docs:
            doc_id = d.get('id')
            text = d.get('text', '')
            meta = d.get('meta', {})
            chunks.append(text)
            metas.append(meta)
            ids.append(doc_id)
        embeddings = embed_texts(chunks)
        self.store.upsert(ids, embeddings, metas)

    def retrieve(self, query: str, top_k: int = 5, alpha: float = 0.6) -> List[Tuple[str, float, dict]]:
        """Return fused ranking combining dense (alpha) and BM25 (1-alpha).
        Returns list of tuples (doc_id, score, meta)
        """
        # attempt cache
        try:
            key = make_key('rag:retrieval', hashlib.sha256(query.encode('utf-8')).hexdigest())
        except Exception:
            import hashlib
            key = make_key('rag:retrieval', __import__('hashlib').sha256(query.encode('utf-8')).hexdigest())
        try:
            cached = sync_get(key)
            if cached.get('cache_hit') and isinstance(cached.get('value'), list):
                return [(c[0], float(c[1]), c[2]) for c in cached.get('value')][:top_k]
        except Exception:
            cached = None

        # dense scores
        q_emb = embed_texts([query])[0]
        dense_results = self.store.similarity_search(q_emb, top_k=top_k*3)
        dense_dict = {r[0]: r[1] for r in dense_results}

        # bm25 scores
        bm25_scores = {}
        if self.bm25:
            tokens = query.split()
            scores = self.bm25.get_scores(tokens)
            for i, s in enumerate(scores):
                bm25_scores[self.docs[i].get('id')] = float(s)

        # normalize bm25
        bm_vals = list(bm25_scores.values()) if bm25_scores else [0]
        bm_min, bm_max = (min(bm_vals), max(bm_vals)) if bm_vals else (0, 1)

        fused = {}
        # consider union of ids in dense and bm25
        ids = set(list(dense_dict.keys()) + list(bm25_scores.keys()))
        for _id in ids:
            d = dense_dict.get(_id, 0.0)
            b = bm25_scores.get(_id, 0.0)
            # normalize b
            if bm_max - bm_min > 1e-6:
                b_norm = (b - bm_min) / (bm_max - bm_min)
            else:
                b_norm = 0.0
            score = alpha * d + (1 - alpha) * b_norm
            fused[_id] = score

        # assemble results with meta
        ranked = sorted(fused.items(), key=lambda x: -x[1])[:top_k]
        out = []
        for _id, sc in ranked:
            # retrieve meta from store
            for i, did in enumerate(self.store._ids):
                if did == _id:
                    meta = self.store._metas[i]
                    break
            else:
                meta = {}
            out.append((_id, float(sc), meta))

        # cache results
        try:
            ttl = int(os.environ.get('RAG_RETRIEVAL_CACHE_TTL', '3600'))
            sync_set(key, out, ttl=ttl)
        except Exception:
            pass
        return out
