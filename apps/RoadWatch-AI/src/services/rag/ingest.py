"""RAG ingestion utilities: chunking, embedding, and vector store upsert.

This scaffold provides an in-memory vector store fallback for local smoke tests
and a pluggable `embed_texts` function that uses `sentence-transformers` when
available.
"""
from __future__ import annotations

import math
import uuid
from typing import List, Iterable, Optional, Tuple

import numpy as np

try:
    from sentence_transformers import SentenceTransformer
    _HAS_ST = True
except Exception:
    SentenceTransformer = None  # type: ignore
    _HAS_ST = False


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    tokens = text.split()
    if len(tokens) <= chunk_size:
        return [text]
    chunks = []
    i = 0
    while i < len(tokens):
        chunk = tokens[i : i + chunk_size]
        chunks.append(" ".join(chunk))
        i += chunk_size - overlap
    return chunks


def embed_texts(texts: Iterable[str], model_name: str = "all-MiniLM-L6-v2") -> List[np.ndarray]:
    texts = list(texts)
    if _HAS_ST:
        model = SentenceTransformer(model_name)
        embs = model.encode(texts, convert_to_numpy=True)
        return [np.asarray(e, dtype=np.float32) for e in embs]
    # fallback: random unit vectors (deterministic seed for reproducibility)
    rng = np.random.default_rng(42)
    dim = 384
    embs = rng.standard_normal((len(texts), dim)).astype(np.float32)
    # normalize
    embs /= np.linalg.norm(embs, axis=1, keepdims=True)
    return [emb for emb in embs]


class InMemoryVectorStore:
    def __init__(self, dim: int = 384):
        self.dim = dim
        self._ids: List[str] = []
        self._embs: List[np.ndarray] = []
        self._metas: List[dict] = []

    def upsert(self, ids: List[str], embeddings: List[np.ndarray], metadatas: Optional[List[dict]] = None):
        metadatas = metadatas or [{} for _ in ids]
        for i, _id in enumerate(ids):
            self._ids.append(_id)
            self._embs.append(np.asarray(embeddings[i], dtype=np.float32))
            self._metas.append(metadatas[i])

    def similarity_search(self, query_emb: np.ndarray, top_k: int = 5) -> List[Tuple[str, float, dict]]:
        if len(self._embs) == 0:
            return []
        embs = np.vstack(self._embs)
        q = query_emb / (np.linalg.norm(query_emb) + 1e-12)
        embs_norm = embs / (np.linalg.norm(embs, axis=1, keepdims=True) + 1e-12)
        scores = embs_norm @ q
        idx = np.argsort(-scores)[:top_k]
        return [(self._ids[i], float(scores[i]), self._metas[i]) for i in idx]


def ingest_documents(docs: List[dict], store: Optional[InMemoryVectorStore] = None, chunk_size: int = 200, overlap: int = 50) -> InMemoryVectorStore:
    """Ingest a list of documents into the provided store (or in-memory store).

    Each doc is expected to be a dict with keys: `id` (optional), `text`, and `meta` (optional).
    """
    store = store or InMemoryVectorStore()
    all_texts = []
    metas = []
    ids = []
    for doc in docs:
        doc_id = doc.get("id") or str(uuid.uuid4())
        text = doc.get("text", "")
        meta = doc.get("meta", {})
        chunks = chunk_text(text, chunk_size=chunk_size, overlap=overlap)
        for i, ch in enumerate(chunks):
            all_texts.append(ch)
            metas.append({**meta, "source_id": doc_id, "chunk_index": i})
            ids.append(f"{doc_id}:{i}")

    embeddings = embed_texts(all_texts)
    store.upsert(ids, embeddings, metas)
    return store
