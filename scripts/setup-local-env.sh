#!/bin/sh
set -e
ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"

cp "$ROOT/.env.example" "$ROOT/apps/api/.env"
cp "$ROOT/.env.example" "$ROOT/packages/database/.env"
# Prisma only needs DATABASE_URL in packages/database
grep '^DATABASE_URL=' "$ROOT/.env.example" > "$ROOT/packages/database/.env"
printf '%s\n' 'NEXT_PUBLIC_API_URL=http://localhost:4000' > "$ROOT/apps/web/.env.local"

echo "Created:"
echo "  apps/api/.env"
echo "  packages/database/.env (DATABASE_URL only)"
echo "  apps/web/.env.local"
