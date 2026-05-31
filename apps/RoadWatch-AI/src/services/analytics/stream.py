"""Streaming ETL skeleton for analytics.

Provides a simple asyncio queue and worker that runs the lightweight
analytics pipeline and persists results via `storage`.
"""
import asyncio
from typing import Any, Dict

from services.analytics import storage
from services.analytics.ingest import generate_time_series
from services.analytics.pipeline import rolling_window
from services.analytics.anomaly import detect_anomalies_zscore

QUEUE: asyncio.Queue = asyncio.Queue()


async def publish_event(event: Dict[str, Any]) -> None:
    await QUEUE.put(event)


async def _worker_once() -> None:
    ev = await QUEUE.get()
    request_id = ev.get("request_id", "unknown")
    loop = asyncio.get_event_loop()
    data = await loop.run_in_executor(None, generate_time_series, ev.get("n", 100), ev.get("seed", 42))
    smoothed = await loop.run_in_executor(None, rolling_window, data, ev.get("window", 5))
    anomalies = await loop.run_in_executor(None, detect_anomalies_zscore, smoothed, ev.get("threshold", 3.0))
    await loop.run_in_executor(None, storage.save_anomalies, request_id, anomalies)
    QUEUE.task_done()


async def worker() -> None:
    while True:
        try:
            await _worker_once()
        except asyncio.CancelledError:
            break
        except Exception:
            # swallow errors in worker to avoid crash; in prod log and alert.
            await asyncio.sleep(0.1)


async def start_processor(workers: int = 1) -> None:
    for _ in range(workers):
        asyncio.create_task(worker())
