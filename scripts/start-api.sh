#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set."
  echo "  Railway → API service → Variables → add a reference to your Postgres service DATABASE_URL."
  exit 1
fi

if [ -z "$JWT_ACCESS_SECRET" ]; then
  echo "ERROR: JWT_ACCESS_SECRET is not set."
  exit 1
fi

# Log host only (never the password) to help debug wrong/stale credentials.
db_host=$(printf '%s' "$DATABASE_URL" | sed -n 's|.*@\([^/]*\)/.*|\1|p')
echo "DATABASE_URL target: ${db_host:-unknown}"

echo "Running database migrations..."
if ! npm run db:migrate:deploy; then
  echo ""
  echo "ERROR: Database migration failed."
  echo "  If you see P1000 (authentication failed), the API DATABASE_URL does not match Postgres."
  echo "  Railway fix:"
  echo "    1. API service → Variables → remove any hand-typed DATABASE_URL"
  echo "    2. Add variable REFERENCE: Postgres → DATABASE_URL (from your Postgres plugin)"
  echo "    3. Redeploy API (and Postgres if you recently recreated it)"
  echo "  Do not copy an old URL; always use a live reference after Postgres rotates credentials."
  exit 1
fi

echo "Starting API..."
exec npm run start -w @mk/api
