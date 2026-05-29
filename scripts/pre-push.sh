#!/bin/sh
set -e

echo "pre-push: building database, api, and web…"
npm run build -w @mk/database
npm run build -w @mk/api
npm run build -w @mk/web
echo "pre-push: all builds passed."
