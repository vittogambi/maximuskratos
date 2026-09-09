#!/bin/sh
set -e

echo "pre-push: building database, engines, api, and web…"
npm run build -w @mk/database
npm run build -w @mk/matrix-engine
npm run build -w @mk/experience-engine
npm run build -w @mk/ikigai-engine
npm run build -w @mk/api
npm run build -w @mk/web
echo "pre-push: all builds passed."
