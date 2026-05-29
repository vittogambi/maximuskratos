#!/bin/sh
# Normalize DB connection env for Railway (private URL, public fallback, PG* parts).

if [ -n "$DATABASE_PRIVATE_URL" ]; then
  export DATABASE_URL="$DATABASE_PRIVATE_URL"
  export MK_DB_URL_SOURCE="DATABASE_PRIVATE_URL"
elif [ -n "$DATABASE_URL" ]; then
  export MK_DB_URL_SOURCE="DATABASE_URL"
elif [ -n "$DATABASE_PUBLIC_URL" ]; then
  export DATABASE_URL="$DATABASE_PUBLIC_URL"
  export MK_DB_URL_SOURCE="DATABASE_PUBLIC_URL"
else
  export MK_DB_URL_SOURCE=""
fi

# Railway reference left unresolved (copy-paste mistake).
case "${DATABASE_URL:-}" in
  *'${{'*|*'{{Postgres'*)
    echo "ERROR: DATABASE_URL is not resolved (looks like a template, not a reference)."
    echo "  In Railway API → Variables, use Add Reference → Postgres → DATABASE_URL."
    exit 1
    ;;
esac

# Build from Postgres plugin parts when the full URL reference is missing/wrong.
if [ -z "$DATABASE_URL" ] && [ -n "$PGUSER" ] && [ -n "$POSTGRES_PASSWORD" ] && [ -n "$PGDATABASE" ]; then
  db_host="${RAILWAY_PRIVATE_DOMAIN:-postgres.railway.internal}"
  db_port="${PGPORT:-5432}"
  export DATABASE_URL="postgresql://${PGUSER}:${POSTGRES_PASSWORD}@${db_host}:${db_port}/${PGDATABASE}"
  export MK_DB_URL_SOURCE="PGUSER+POSTGRES_PASSWORD (constructed)"
fi

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: No database URL. Set DATABASE_URL (reference from Postgres) on the API service."
  exit 1
fi

db_host=$(printf '%s' "$DATABASE_URL" | sed -n 's|.*@\([^/]*\)/.*|\1|p')
echo "Database connection via ${MK_DB_URL_SOURCE:-unknown} → ${db_host:-unknown}"
