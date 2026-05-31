# Postgres + PostGIS + pgvector Kubernetes manifest

This file describes the `k8s/postgres-pgvector.yaml` manifest included in the repo.

- Namespace: `roadwatch-data`
- Secret: `postgres-secret` (placeholder values, base64-encoded)
- Service: `postgres` (ClusterIP)
- StatefulSet: `postgis/postgis:15-3.4` image with PersistentVolumeClaim for `pgdata`
- Job: `init-postgres-extensions` which runs `psql` to enable `postgis` and `pgvector`

Usage (apply to cluster):

```powershell
kubectl apply -f k8s/postgres-pgvector.yaml
```

Notes and next steps:

- Replace secret data with proper base64-encoded credentials or use External Secrets/HashiCorp Vault.
- Consider using a managed Postgres (Azure Database for PostgreSQL / AWS RDS) and run extension enablement via migration job.
- For production, add resource requests/limits, readiness/liveness probes, backup snapshot CronJob, and PodDisruptionBudget.
- Ensure the chosen Postgres image supports `pgvector` (or install via `apt` during an init container). The selected `postgis/postgis` image is commonly used.
