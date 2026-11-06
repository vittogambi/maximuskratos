#!/bin/sh
# Second local stack for browser audits and Playwright: web 3010, API 4010, database mk_browser_audit.
# It builds into apps/web/.next-audit and apps/api/dist-audit, so it never touches the folders of `npm run dev`.
set -eu

ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DB_NAME="${MK_AUDIT_DB:-mk_browser_audit}"
DB_URL="postgresql://mk:mk_local_dev@127.0.0.1:5433/${DB_NAME}"

if ! PGPASSWORD=mk_local_dev psql -h 127.0.0.1 -p 5433 -U mk -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | grep -q 1; then
  PGPASSWORD=mk_local_dev createdb -h 127.0.0.1 -p 5433 -U mk "$DB_NAME"
fi
DATABASE_URL="$DB_URL" npx prisma migrate deploy --schema packages/database/prisma/schema.prisma

# nest --watch can leave its child listening after a stop. Only node processes on the audit ports are stopped.
for port in 4010 3010; do
  for pid in $(lsof -ti ":$port" -sTCP:LISTEN 2>/dev/null); do
    if ps -p "$pid" -o comm= 2>/dev/null | grep -qE 'node|next-server'; then
      echo "Stopping stale audit process on port $port (pid $pid)"
      kill "$pid" 2>/dev/null || true
    fi
  done
done

export DATABASE_URL="$DB_URL"
exec npx concurrently -k -n api-audit,web-audit -c cyan,magenta \
  "PORT=4010 npm run dev:audit -w @mk/api" \
  "NEXT_DIST_DIR=.next-audit NEXT_PUBLIC_API_URL=http://127.0.0.1:4010 npm run dev:audit -w @mk/web"
