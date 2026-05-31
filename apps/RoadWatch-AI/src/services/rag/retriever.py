"""Simple retriever wrapper around the in-memory vector store."""
from typing import List, Tuple

import numpy as np

from services.rag.ingest import InMemoryVectorStore, embed_texts


class Retriever:
    def __init__(self, store: InMemoryVectorStore):
        self.store = store

    def retrieve(self, query: str, top_k: int = 5):
        q_emb = embed_texts([query])[0]
        return self.store.similarity_search(q_emb, top_k=top_k)
