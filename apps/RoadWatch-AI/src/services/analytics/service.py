import asyncio
import time
from typing import Any, Dict

from services.analytics.ingest import generate_time_series
from services.analytics.pipeline import rolling_window
from services.analytics.anomaly import detect_anomalies_zscore
from services.analytics import stream, storage
from services.analytics import engine


async def analyze(params: Dict[str, Any]) -> Dict[str, Any]:
    """Async entrypoint for analytics.

    If `params.get('stream')` is truthy the event will be queued for
    background processing. Otherwise the pipeline runs synchronously and
    anomalies are persisted before returning.
    """
    request_id = params.get("request_id") or "unknown"

    if params.get("stream"):
        # enqueue and return quickly
        await stream.publish_event({"request_id": request_id, "n": params.get("n", 100), "seed": params.get("seed", 42)})
        return {"service": "analytics", "request_id": request_id, "queued": True}

    loop = asyncio.get_event_loop()
    data = await loop.run_in_executor(None, generate_time_series, params.get("n", 100), params.get("seed", 42))
    smoothed = await loop.run_in_executor(None, rolling_window, data, params.get("window", 5))
    # anomalies from simple detector
    anomalies = await loop.run_in_executor(None, detect_anomalies_zscore, smoothed, params.get("threshold", 3.0))

    # enrich with engine processing using synthetic records converted from series
    # convert series to lightweight record objects for engine
    records = []
    for i, v in enumerate(smoothed):
        records.append({
            "road_id": f"road_{i%5}",
            "contractor": f"contractor_{i%3}",
            "complaint": True if (i % 20 == 0) else False,
            "failure": True if (i % 33 == 0) else False,
            "budget_spent": max(0.0, v * 1000),
            "budget_allocated": 1000.0,
            "quality_score": max(0.0, 5.0 - abs(v)),
            "lat": 0.0 + (i % 10) * 0.0001,
            "lon": 0.0 + (i % 7) * 0.0001,
            "timestamp": time.time() - (len(smoothed) - i) * 3600,
        })

    engine_out = await loop.run_in_executor(None, engine.process, records)

    # persist anomalies list and engine anomalies
    await loop.run_in_executor(None, storage.save_anomalies, request_id, anomalies if anomalies else [])
    # also persist engine anomalies summary
    await loop.run_in_executor(None, storage.save_anomalies, request_id + "_engine", engine_out.get("anomalies", {}))

    return {"service": "analytics", "request_id": request_id, "anomalies": anomalies, "engine": engine_out}

