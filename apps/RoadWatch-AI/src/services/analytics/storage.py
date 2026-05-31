"""Persistence layer for analytics data.

Supports Postgres via `DATABASE_URL` and falls back to a local SQLite file
when Postgres is not configured. Includes helper migration runner (see
`scripts/run_migrations.py`).
"""
import os
import json
import time
from typing import List, Dict, Any

DB_PATH = os.path.join("data", "analytics.db")


def _using_postgres() -> bool:
    url = os.environ.get("DATABASE_URL")
    return bool(url and "<" not in url and "localhost" in url or bool(url))


def _connect_pg():
    import psycopg

    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL not set")
    conn = psycopg.connect(url, autocommit=True)
    return conn


def ensure_db() -> None:
    """Create analytics table in Postgres or SQLite fallback."""
    if _using_postgres():
        try:
            conn = _connect_pg()
            cur = conn.cursor()
            cur.execute("CREATE SCHEMA IF NOT EXISTS analytics;")
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS analytics.anomalies (
                    id SERIAL PRIMARY KEY,
                    request_id TEXT,
                    timestamp DOUBLE PRECISION,
                    payload JSONB
                )
                """
            )
            cur.close()
            conn.close()
            return
        except Exception:
            # fall through to sqlite
            pass

    # SQLite fallback
    import sqlite3
    from pathlib import Path

    p = Path(DB_PATH)
    p.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(p))
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS anomalies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            request_id TEXT,
            timestamp REAL,
            payload TEXT
        )
        """
    )
    conn.commit()
    conn.close()


def save_anomalies(request_id: str, anomalies: List[Dict[str, Any]]) -> None:
    ensure_db()
    ts = time.time()
    payload = json.dumps(anomalies)

    if _using_postgres():
        try:
            conn = _connect_pg()
            # cast to jsonb on insert
            cur = conn.cursor()
            cur.execute("INSERT INTO analytics.anomalies (request_id, timestamp, payload) VALUES (%s, %s, %s::jsonb)", (request_id, ts, payload))
            cur.close()
            conn.close()
            return
        except Exception:
            # fallback to sqlite
            pass

    # sqlite path
    import sqlite3

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("INSERT INTO anomalies (request_id, timestamp, payload) VALUES (?,?,?)", (request_id, ts, payload))
    conn.commit()
    conn.close()


def get_recent(limit: int = 10) -> List[Dict[str, Any]]:
    ensure_db()
    out = []
    if _using_postgres():
        try:
            import psycopg

            conn = _connect_pg()
            cur = conn.cursor(row_factory=psycopg.rows.dict_row)
            cur.execute("SELECT id, request_id, timestamp, payload FROM analytics.anomalies ORDER BY id DESC LIMIT %s", (limit,))
            rows = cur.fetchall()
            cur.close()
            conn.close()
            for r in rows:
                payload = r.get("payload")
                try:
                    payload = json.loads(payload) if isinstance(payload, str) else payload
                except Exception:
                    pass
                out.append({"id": r.get("id"), "request_id": r.get("request_id"), "timestamp": r.get("timestamp"), "payload": payload})
            return out
        except Exception:
            pass

    # sqlite fallback
    import sqlite3

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT id, request_id, timestamp, payload FROM anomalies ORDER BY id DESC LIMIT ?", (limit,))
    rows = cur.fetchall()
    conn.close()
    for r in rows:
        try:
            payload = json.loads(r[3])
        except Exception:
            payload = r[3]
        out.append({"id": r[0], "request_id": r[1], "timestamp": r[2], "payload": payload})
    return out
