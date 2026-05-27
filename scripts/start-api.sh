#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set. Link Postgres to this service in Railway."
  exit 1
fi

if [ -z "$JWT_ACCESS_SECRET" ]; then
  echo "ERROR: JWT_ACCESS_SECRET is not set."
  exit 1
fi

echo "Running database migrations..."
npm run db:migrate:deploy

echo "Starting API..."
exec npm run start -w @mk/api
