import asyncio
import time
import uuid
from typing import Any, Callable

from fastapi import FastAPI, HTTPException, Request, Response
from pydantic import BaseModel
from loguru import logger
from services.cv import api as cv_api
from services.nlp import api as nlp_api
from services.ocr import api as ocr_api
from services.geo import api as geo_api

# Prometheus metrics (optional)
try:
    from prometheus_client import Counter, generate_latest, CONTENT_TYPE_LATEST
    PROMETHEUS_AVAILABLE = True
except Exception:
    PROMETHEUS_AVAILABLE = False

# OpenTelemetry (optional)
try:
    from opentelemetry import trace
    from opentelemetry.sdk.resources import Resource
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor
    from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
    from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
    OPENTELEMETRY_AVAILABLE = True
except Exception:
    OPENTELEMETRY_AVAILABLE = False

# Simple imports assuming `src` is on PYTHONPATH when running
from services.cv.service import analyze as cv_analyze
from services.nlp.service import analyze as nlp_analyze
from services.geo.service import analyze as geo_analyze
from services.ocr.service import analyze as ocr_analyze
from services.rag.service import analyze as rag_analyze
from services.rag import api as rag_api
from services.analytics.service import analyze as analytics_analyze
from services.aggregator import api as aggregator_api
from services.aggregator.service import aggregate as aggregator_aggregate
from storage import api as storage_api

app = FastAPI(title="RoadWatch AI Orchestrator")

# include cv router
app.include_router(cv_api.router)
# include nlp router
app.include_router(nlp_api.router)
# include ocr router
app.include_router(ocr_api.router)
# include geo router
app.include_router(geo_api.router)
# include rag router
app.include_router(rag_api.router)
# include aggregator router
app.include_router(aggregator_api.router)
# include storage/redis health router
app.include_router(storage_api.router)

if PROMETHEUS_AVAILABLE:
    REQUEST_COUNTER = Counter("roadwatch_requests_total", "Total analyze requests", ["service"])

if OPENTELEMETRY_AVAILABLE:
    try:
        otel_endpoint = None
        import os

        otel_endpoint = os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT")
        resource = Resource.create({"service.name": "roadwatch-orchestrator"})
        provider = TracerProvider(resource=resource)
        exporter = OTLPSpanExporter(endpoint=otel_endpoint) if otel_endpoint else None
        if exporter:
            provider.add_span_processor(BatchSpanProcessor(exporter))
            trace.set_tracer_provider(provider)
        FastAPIInstrumentor.instrument_app(app)
    except Exception:
        pass


class AnalyzeRequest(BaseModel):
    image_url: str | None = None
    text: str | None = None
    gps: dict | None = None
    document_url: str | None = None
    request_id: str | None = None


# Per-service runtime config
SERVICE_CONFIG = {
    "computer_vision": {"timeout": 8.0, "retries": 2},
    "nlp": {"timeout": 3.0, "retries": 1},
    "geo": {"timeout": 2.0, "retries": 1},
    "ocr": {"timeout": 6.0, "retries": 1},
    "rag": {"timeout": 10.0, "retries": 1},
    "analytics": {"timeout": 4.0, "retries": 1},
}

# Simple in-memory circuit breaker state
CIRCUIT_STATE: dict[str, dict[str, Any]] = {}
CIRCUIT_FAILURE_THRESHOLD = 3
CIRCUIT_RESET_SECONDS = 60


def _circuit_allows(service_name: str) -> bool:
    st = CIRCUIT_STATE.get(service_name)
    if not st:
        return True
    if st.get("open"):
        if time.time() - st.get("opened_at", 0) > CIRCUIT_RESET_SECONDS:
            # reset
            CIRCUIT_STATE.pop(service_name, None)
            return True
        return False
    return True


def _record_failure(service_name: str):
    st = CIRCUIT_STATE.setdefault(service_name, {"failures": 0, "open": False})
    st["failures"] += 1
    if st["failures"] >= CIRCUIT_FAILURE_THRESHOLD:
        st["open"] = True
        st["opened_at"] = time.time()


def _record_success(service_name: str):
    if service_name in CIRCUIT_STATE:
        CIRCUIT_STATE.pop(service_name, None)


async def call_with_retries(
    service_name: str, coro_func: Callable[..., Any], *args, retries: int | None = None, timeout: float | None = None
) -> dict:
    cfg = SERVICE_CONFIG.get(service_name, {})
    retries = retries if retries is not None else cfg.get("retries", 1)
    timeout = timeout if timeout is not None else cfg.get("timeout", 5.0)

    if not _circuit_allows(service_name):
        logger.warning("Circuit open for {service}", service=service_name)
        return {"service": service_name, "error": "circuit_open"}

    attempt = 0
    last_exc = None
    while attempt <= retries:
        attempt += 1
        try:
            start = time.time()
            result = await asyncio.wait_for(coro_func(*args), timeout=timeout)
            elapsed = time.time() - start
            logger.info("{service} succeeded in {t:.2f}s (attempt {a})", service=service_name, t=elapsed, a=attempt)
            _record_success(service_name)
            return result
        except asyncio.TimeoutError as e:
            last_exc = e
            logger.error("{service} timeout on attempt {a}", service=service_name, a=attempt)
            _record_failure(service_name)
        except Exception as e:
            last_exc = e
            logger.exception("{service} raised on attempt {a}", service=service_name, a=attempt)
            _record_failure(service_name)
        # exponential backoff
        await asyncio.sleep(min(2 ** attempt * 0.1, 2.0))

    logger.error("{service} failed after {n} attempts", service=service_name, n=retries + 1)
    return {"service": service_name, "error": "failed", "detail": str(last_exc)}


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/metrics")
async def metrics():
    if not PROMETHEUS_AVAILABLE:
        return Response(status_code=404, content="prometheus client not available")
    data = generate_latest()
    return Response(content=data, media_type=CONTENT_TYPE_LATEST)


@app.get("/ready")
async def ready():
    # Basic readiness: check circuits and return ok
    open_circuits = [s for s, st in CIRCUIT_STATE.items() if st.get("open")]
    return {"ready": True, "open_circuits": open_circuits}


@app.post("/analyze")
async def analyze(req: AnalyzeRequest, request: Request):
    request_id = req.request_id or str(uuid.uuid4())
    logger.bind(request_id=request_id).info("Analyze request received")

    tasks = []

    if req.image_url:
        tasks.append(call_with_retries("computer_vision", cv_analyze, req.image_url))
    if req.text:
        tasks.append(call_with_retries("nlp", nlp_analyze, req.text))
    if req.gps:
        tasks.append(call_with_retries("geo", geo_analyze, req.gps))
    if req.document_url:
        tasks.append(call_with_retries("ocr", ocr_analyze, req.document_url))

    # RAG and analytics run but are tolerant of partial inputs
    tasks.append(call_with_retries("rag", rag_analyze, {"text": req.text, "gps": req.gps}))
    tasks.append(call_with_retries("analytics", analytics_analyze, {"request_id": request_id}))

    results = await asyncio.gather(*tasks)

    if PROMETHEUS_AVAILABLE:
        try:
            REQUEST_COUNTER.labels(service="analyze").inc()
        except Exception:
            pass

    aggregated: dict[str, Any] = {"services": {}}
    for r in results:
        if isinstance(r, dict) and "service" in r:
            aggregated["services"][r["service"]] = r

    # Use aggregator to produce final RoadWatch output
    try:
        final = aggregator_aggregate(aggregated["services"])
    except Exception as e:
        logger.exception("Aggregator failed")
        final = {"error": "aggregator_failed", "detail": str(e)}

    structured_output = {
        "request_id": request_id,
        "aggregated": aggregated,
        "final": final,
        "timestamp": time.time(),
    }

    logger.bind(request_id=request_id).info("Analyze request completed")
    return structured_output
