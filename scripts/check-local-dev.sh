#!/bin/sh
set -e

if ! docker info >/dev/null 2>&1; then
  echo ""
  echo "Docker is not running."
  echo "  1. Open Docker Desktop and wait until it says \"Running\""
  echo "  2. Run: npm run dev"
  echo ""
  exit 1
fi

DB_URL="${DATABASE_URL:-}"
if [ -z "$DB_URL" ] && [ -f packages/database/.env ]; then
  DB_URL=$(grep '^DATABASE_URL=' packages/database/.env | cut -d= -f2- | tr -d '"')
fi

case "$DB_URL" in
  *localhost:5432*)
    echo ""
    echo "DATABASE_URL points at localhost:5432."
    echo "This project uses Docker Postgres on port 5433 (5432 is often taken by macOS Postgres)."
    echo "  Run: npm run setup:env"
    echo "  Or set DATABASE_URL to postgresql://mk:mk_local_dev@localhost:5433/maximuskratos"
    echo ""
    exit 1
    ;;
esac

echo "Local dev prerequisites OK."
