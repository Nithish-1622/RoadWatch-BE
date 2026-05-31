"""Simple migration runner for analytics migrations.

Usage: set `DATABASE_URL` env var and run this script. It will execute any
`*.sql` files in `scripts/migrations/` in lexicographic order.
"""
import os
from pathlib import Path
import sys

MIGRATIONS = Path(__file__).parent / "migrations"


def main():
    url = os.environ.get("DATABASE_URL")
    if not url:
        print("DATABASE_URL not set; skipping migrations.")
        return

    try:
        import psycopg
    except Exception as e:
        print("psycopg not available; cannot run migrations:", e)
        sys.exit(1)

    conn = psycopg.connect(url, autocommit=True)
    cur = conn.cursor()

    sql_files = sorted(MIGRATIONS.glob("*.sql"))
    if not sql_files:
        print("No migration files found.")
        return

    for f in sql_files:
        print("Applying", f.name)
        sql = f.read_text()
        cur.execute(sql)

    cur.close()
    conn.close()
    print("Migrations applied.")


if __name__ == "__main__":
    main()
