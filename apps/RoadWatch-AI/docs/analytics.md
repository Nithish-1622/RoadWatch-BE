# Analytics service (smoke)

This folder contains a lightweight analytics service scaffold used for quick smoke
tests and as a starting point for the RoadWatch analytics pipeline.

Files added:
- `src/services/analytics/ingest.py` — synthetic time-series generator
- `src/services/analytics/pipeline.py` — simple rolling-average smoothing
- `src/services/analytics/anomaly.py` — z-score based anomaly detector
- `src/services/analytics/smoke_analytics.py` — runnable smoke test

How to run (from repository root):

Windows PowerShell:

```powershell
set PYTHONPATH=src
.\venv\Scripts\python.exe src/services/analytics/smoke_analytics.py
```

Or (cross-platform):

```bash
PYTHONPATH=src python3 src/services/analytics/smoke_analytics.py


Persistence and streaming
-------------------------

The analytics module includes a lightweight SQLite persistence layer and a
streaming ETL skeleton. To run the streaming persistence smoke test:

PowerShell:

```powershell
cd D:/PROJECT/RoadWatch-AI
$env:PYTHONPATH='src'
.\venv\Scripts\python.exe src/services/analytics/smoke_persist.py
```

This will start a background worker, publish two synthetic events, and print
recent persisted anomalies from `data/analytics.db`.

Migrations
----------

If you want to use Postgres for persistence instead of the local SQLite file,
set the `DATABASE_URL` environment variable (e.g. `postgresql://user:pass@host:5432/db`).
Then run the migration script to apply the analytics schema:

PowerShell:

```powershell
cd D:/PROJECT/RoadWatch-AI
$env:DATABASE_URL='postgresql://postgres:RoadWatch123@localhost:5432/postgres'
.\venv\Scripts\python.exe scripts/run_migrations.py
```

The code will automatically use Postgres when `DATABASE_URL` is present; otherwise
it will fall back to the existing SQLite file for local development.


```
