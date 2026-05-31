"""Smoke script to demonstrate using `pgvector_store` if a DB is configured.

This script will skip if `psycopg` is not installed or `DATABASE_URL` is not set.
"""
import logging
import os
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
os.environ.setdefault("HF_HUB_DISABLE_PROGRESS_BARS", "1")

from services.rag.ingest import ingest_documents, embed_texts
from services.rag.pgvector_store import connect, ensure_table, upsert_vectors, similarity_search


def main():
    # Keep smoke output readable by default; enable debug with RAG_LOG_LEVEL=DEBUG.
    level_name = os.environ.get("RAG_LOG_LEVEL", "WARNING").upper()
    level = getattr(logging, level_name, logging.WARNING)
    logging.basicConfig(level=level, format="%(levelname)s %(name)s: %(message)s")

    # Silence verbose 3rd-party libraries unless debugging is explicitly requested.
    if level > logging.DEBUG:
        for noisy_logger in (
            "httpx",
            "httpcore",
            "sentence_transformers",
            "transformers",
            "urllib3",
            "huggingface_hub",
        ):
            logging.getLogger(noisy_logger).setLevel(logging.ERROR)

    if os.environ.get("DATABASE_URL") is None:
        print("DATABASE_URL not set — skipping pgvector smoke test.")
        return

    try:
        conn = connect()
    except Exception as e:
        print("Cannot connect to DB:", e)
        return

    ensure_table(conn)

    docs = [
        {"id": "doc1", "text": "Pothole reported on Main St near the 3rd traffic light.", "meta": {"source": "user_report"}},
    ]
    store = ingest_documents(docs)
    # retrieve the internal vectors to upsert
    items = []
    for _id, emb, meta in zip(store._ids, store._embs, store._metas):
        items.append((_id, emb.tolist(), meta))

    upsert_vectors(conn, items)
    q = "pothole on main street"
    q_emb = embed_texts([q])[0]
    res = similarity_search(conn, q_emb.tolist(), top_k=3)
    print("Similarity results:")
    for r in res:
        print(r)


if __name__ == "__main__":
    main()
