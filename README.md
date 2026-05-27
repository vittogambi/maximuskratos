# Maximus Kratos

Web platform and REST API for user accounts and authentication.

## Stack

- **API** — NestJS, PostgreSQL, Prisma
- **Web** — Next.js (App Router)

## Local setup

```bash
docker compose up -d
npm install
cp .env.example apps/api/.env
cp .env.example packages/database/.env
echo 'NEXT_PUBLIC_API_URL=http://localhost:4000' > apps/web/.env.local
npm run db:generate
npm run db:migrate:deploy
npm run dev:api   # http://localhost:4000
npm run dev:web   # http://localhost:3000
```

| Endpoint | URL |
|----------|-----|
| Web | http://localhost:3000 |
| Health | http://localhost:4000/health |
| API docs | http://localhost:4000/api/v1/docs |

## Environment

**API** (`apps/api/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Access token signing secret (32+ chars) |
| `JWT_REFRESH_SECRET` | Reserved for future use |
| `CORS_ORIGINS` | Allowed web origins, comma-separated |
| `NODE_ENV` | `development` or `production` |
| `PORT` | API port (default 4000) |

**Web** (`apps/web/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Public API base URL (no trailing slash) |

## Deployment (Railway)

Deploy from the **repository root**.

### PostgreSQL

Add a Postgres service and attach `DATABASE_URL` to the API service.

### API

- **Build:** `npm install && npm run db:generate && npm run build -w @mk/database && npm run build -w @mk/api`
- **Start:** `npm run db:migrate:deploy && npm run start -w @mk/api`
- **Health check:** `/health`

### Web

- **Build:** `npm install && npm run build -w @mk/web`
- **Start:** `npm run start -w @mk/web`
- Set `NEXT_PUBLIC_API_URL` to the API public URL.

When API and web use different hostnames, set `CORS_ORIGINS` on the API to the exact web origin (`NODE_ENV=production` enables cross-site cookies).

## Project layout

```
apps/api/           REST API
apps/web/           Web app
packages/database/  Prisma schema and migrations
```
