#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:4000}"
EMAIL="test-$(date +%s)@example.com"
PASSWORD="TestPass123!"

curl -sf "${API_URL}/health" > /dev/null
echo "health: ok"

REGISTER=$(curl -sf -c /tmp/mk-cookies.txt -X POST "${API_URL}/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")
ACCESS=$(echo "$REGISTER" | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")

curl -sf "${API_URL}/api/v1/auth/me" -H "Authorization: Bearer ${ACCESS}" > /dev/null
echo "me: ok"

curl -sf -b /tmp/mk-cookies.txt -c /tmp/mk-cookies.txt -X POST "${API_URL}/api/v1/auth/refresh" \
  -H "Content-Type: application/json" -d '{}' > /dev/null
echo "refresh: ok"

curl -sf -b /tmp/mk-cookies.txt -X POST "${API_URL}/api/v1/auth/logout" -o /dev/null
echo "logout: ok"

curl -sf -o /dev/null -w "docs: %{http_code}\n" "${API_URL}/api/v1/docs"
echo "done"
