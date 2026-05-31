# Helm chart for Postgres

Location: `charts/postgres`

This is a minimal Helm chart useful for deploying Postgres with Kubernetes
secrets for credentials. It is intentionally small — for production use consider
using the Bitnami Postgres Helm chart or the official PostgreSQL Operator.

Files:

- `Chart.yaml`, `values.yaml`
- `templates/secret.yaml` — stores `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` (from `values.yaml`).
- `templates/statefulset.yaml` — minimal StatefulSet mounting a PVC.
- `templates/service.yaml` — ClusterIP service for internal access.
- `templates/_helpers.tpl` — name helpers.

How to install (example):

```bash
helm install roadwatch-postgres charts/postgres --set postgres.password=YourStrongPassword
```

Considerations:

- Use K8s `Secret` management (sealed-secrets, External Secrets) for production.
- Add `readinessProbe` and `livenessProbe` to the StatefulSet for robustness.
- Add persistent volume class mapping in `values.yaml` for cloud providers.

Migration job
-------------

This chart includes a simple `Job` template `templates/migration-job.yaml` which
executes a SQL command to create the `analytics` schema and `anomalies` table.
It uses the Postgres client bundled in the `postgres:15` image and reads
credentials from the chart `Secret`. It is enabled by default via `values.yaml`.

For production use, prefer running migrations via a safe migration tool (Alembic,
Flyway) and use Helm hooks with care to avoid race conditions during upgrades.
