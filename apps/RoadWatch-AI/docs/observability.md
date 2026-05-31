# Observability

This project includes lightweight observability integrations:

- Prometheus: `prometheus_client` metrics endpoint at `/metrics` (exposes `roadwatch_requests_total` counter).
- OpenTelemetry: optional FastAPI instrumentation using OTLP exporter. If `OTEL_EXPORTER_OTLP_ENDPOINT` is set, the orchestrator will attempt to export spans.

How to enable:

- Prometheus: install `prometheus_client` into your environment and scrape the orchestrator `/metrics` endpoint.
- OpenTelemetry: install the OpenTelemetry packages and set `OTEL_EXPORTER_OTLP_ENDPOINT`.

Example (PowerShell):

```powershell
set PYTHONPATH=src
.\venv\Scripts\python.exe -m uvicorn src.orchestrator.main:app --host 0.0.0.0 --port 8080
```

Then configure Prometheus to scrape `http://<host>:8080/metrics` and configure an OTLP collector to receive traces.
