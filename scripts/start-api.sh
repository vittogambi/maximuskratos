#!/bin/sh
set -e

. "$(dirname "$0")/resolve-database-url.sh"

if [ -z "$JWT_ACCESS_SECRET" ]; then
  echo "ERROR: JWT_ACCESS_SECRET is not set."
  exit 1
fi

run_migrate() {
  npm run db:migrate:deploy
}

echo "Running database migrations..."
if run_migrate; then
  :
elif [ -n "$DATABASE_PUBLIC_URL" ] && [ "$DATABASE_URL" != "$DATABASE_PUBLIC_URL" ]; then
  echo ""
  echo "Private URL failed; retrying with DATABASE_PUBLIC_URL (TCP proxy)…"
  export DATABASE_URL="$DATABASE_PUBLIC_URL"
  export MK_DB_URL_SOURCE="DATABASE_PUBLIC_URL (retry)"
  db_host=$(printf '%s' "$DATABASE_URL" | sed -n 's|.*@\([^/]*\)/.*|\1|p')
  echo "Database connection via $MK_DB_URL_SOURCE → ${db_host:-unknown}"
  run_migrate
else
  echo ""
  echo "ERROR: Database migration failed."
  echo ""
  echo "P1000 on Railway usually means Postgres password ≠ what is stored on the volume."
  echo "Fix (pick one):"
  echo ""
  echo "  A) Reset Postgres volume (most reliable)"
  echo "     Postgres service → Settings → Danger → Remove volume / redeploy Postgres"
  echo "     Wait until healthy, then API → Variables:"
  echo "       - Delete DATABASE_URL (and DATABASE_PUBLIC_URL if set)"
  echo "       - Add Reference → your Postgres service → DATABASE_URL"
  echo "     Redeploy API only."
  echo ""
  echo "  B) Reference the public URL on API"
  echo "     API → Variables → DATABASE_URL = Reference → Postgres → DATABASE_PUBLIC_URL"
  echo "     Redeploy API."
  echo ""
  echo "  C) Never paste connection strings; only use live References."
  exit 1
fi

echo "Starting API..."
exec npm run start -w @mk/api
