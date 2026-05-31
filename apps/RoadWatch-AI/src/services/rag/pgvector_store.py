"""Postgres + pgvector helper for upserting embeddings and querying.

This module requires `psycopg` and a Postgres DB with the `vector` type
available via the `pgvector` extension. The helper is defensive: if the
`psycopg` package or `DATABASE_URL` env var are not present, the module
raises informative errors or allows callers to skip DB steps.
"""
from __future__ import annotations

import json
import logging
import os
from typing import List, Optional, Tuple

try:
    import psycopg
    from psycopg.rows import dict_row
except Exception:  # pragma: no cover - may not be installed in all envs
    psycopg = None  # type: ignore


logger = logging.getLogger(__name__)


def _get_db_url() -> Optional[str]:
    return os.environ.get("DATABASE_URL")


def connect():
    if psycopg is None:
        raise RuntimeError("psycopg is not installed; install psycopg[binary] to use pgvector store")
    url = _get_db_url()
    if not url:
        raise RuntimeError("DATABASE_URL not set; set to postgres://user:pass@host:port/db")
    if any(token in url for token in ("<user>", "<password>", "<db>")):
        raise RuntimeError(
            "DATABASE_URL contains placeholders. Replace <user>, <password>, and <db> with real values."
        )
    return psycopg.connect(url, autocommit=True)


def ensure_table(conn) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS rag_vectors (
                id TEXT PRIMARY KEY,
                embedding vector(384),
                metadata JSONB
            );
            """
        )


def upsert_vectors(conn, items: List[Tuple[str, List[float], dict]]):
    """Upsert items into rag_vectors. Each item: (id, embedding, metadata).

    Embeddings must be list[float] length matching the vector dim (e.g., 384).
    """
    with conn.cursor() as cur:
        for _id, emb, meta in items:
            # Ensure DB-safe payloads for vector and JSONB columns.
            emb_list = [float(x) for x in emb]
            emb_vector = "[" + ",".join(str(x) for x in emb_list) + "]"
            meta_json = json.dumps(meta or {})

            logger.debug(
                "upsert rag_vectors payload types: id=%s embedding=%s metadata=%s",
                type(_id).__name__,
                type(emb_vector).__name__,
                type(meta_json).__name__,
            )

            cur.execute(
                """
                INSERT INTO rag_vectors (id, embedding, metadata)
                VALUES (%s, %s::vector, %s::jsonb)
                ON CONFLICT (id) DO UPDATE SET embedding = EXCLUDED.embedding, metadata = EXCLUDED.metadata;
                """,
                (_id, emb_vector, meta_json),
            )


def similarity_search(conn, query_emb: List[float], top_k: int = 5):
    query_list = [float(x) for x in query_emb]
    query_vector = "[" + ",".join(str(x) for x in query_list) + "]"
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            SELECT id, metadata, embedding <=> %s::vector AS score
            FROM rag_vectors
            ORDER BY score ASC
            LIMIT %s
            """,
            (query_vector, top_k),
        )
        return cur.fetchall()
