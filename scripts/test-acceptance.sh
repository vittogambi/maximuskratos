#!/bin/sh
# Isolated acceptance: domain, HTTP journeys on a disposable database, components.
# Never migrates or drops the shared development database maximuskratos.
set -eu

ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DB_NAME="mk_journey_it"
DB_URL="postgresql://mk:mk_local_dev@127.0.0.1:5433/${DB_NAME}"

case "$DB_URL" in
  *"/maximuskratos"|"*/maximuskratos?"*)
    echo "Refusing to use the shared development database." >&2
    exit 1
    ;;
esac

cleanup() {
  PGPASSWORD=mk_local_dev psql -h 127.0.0.1 -p 5433 -U mk -d postgres -v ON_ERROR_STOP=1 \
    -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();" \
    >/dev/null 2>&1 || true
  PGPASSWORD=mk_local_dev dropdb -h 127.0.0.1 -p 5433 -U mk --if-exists "$DB_NAME" || true
}
trap cleanup EXIT

echo "domain $(date +%T)"
domain_start=$(date +%s)
npm run test:domain -w @mk/api
domain_end=$(date +%s)

echo "components $(date +%T)"
component_start=$(date +%s)
npm run test:components -w @mk/web
component_end=$(date +%s)

echo "prepare postgres $(date +%T)"
pg_start=$(date +%s)
PGPASSWORD=mk_local_dev dropdb -h 127.0.0.1 -p 5433 -U mk --if-exists "$DB_NAME"
PGPASSWORD=mk_local_dev createdb -h 127.0.0.1 -p 5433 -U mk "$DB_NAME"
DATABASE_URL="$DB_URL" npx prisma migrate deploy --schema packages/database/prisma/schema.prisma
pg_end=$(date +%s)

echo "build api $(date +%T)"
npm run build -w @mk/api
echo "http $(date +%T)"
http_start=$(date +%s)
DATABASE_URL="$DB_URL" npm run test:http -w @mk/api
http_end=$(date +%s)

echo "durations seconds domain=$((domain_end - domain_start)) components=$((component_end - component_start)) postgres=$((pg_end - pg_start)) http=$((http_end - http_start))"
