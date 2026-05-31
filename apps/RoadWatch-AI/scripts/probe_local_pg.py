import psycopg


candidates = [
    "postgresql://root:postgres@localhost:5432/roadwatch",
    "postgresql://postgres:postgres@localhost:5432/postgres",
    "postgresql://postgres@localhost:5432/postgres",
    "postgresql://localhost:5432/postgres",
]

for url in candidates:
    try:
        with psycopg.connect(url, connect_timeout=3) as conn:
            with conn.cursor() as cur:
                cur.execute("select version()")
                print("SUCCESS", url, cur.fetchone()[0])
                raise SystemExit(0)
    except Exception as exc:
        print("FAIL", url, type(exc).__name__, exc)

print("NO_CANDIDATE_WORKED")
