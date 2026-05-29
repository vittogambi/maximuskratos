# Maximus Kratos

Web platform and REST API for user accounts and authentication.

## Stack

- **API** — NestJS, PostgreSQL, Prisma
- **Web** — Next.js (App Router)

## Local setup

**First time only:**

```bash
npm install
npm run setup:env
```

**Run everything (Postgres + API + Web):**

1. Start **Docker Desktop** and wait until it is running.
2. Then:

```bash
npm run dev
```

Opens:

- Web → http://localhost:3000  
- API → http://localhost:4000  

**Run API and Web only** (if Postgres is already up):

```bash
npm run dev:api   # terminal 1
npm run dev:web   # terminal 2
```

### Local dev troubleshooting

| Symptom | Fix |
|---------|-----|
| `Cannot connect to the Docker daemon` | Open Docker Desktop, then `npm run dev` again |
| `User was denied access` / migrate fails | `DATABASE_URL` must use port **5433** (Docker), not 5432. Run `npm run setup:env` |
| Web cannot reach API | `apps/web/.env.local` must have `NEXT_PUBLIC_API_URL=http://localhost:4000` (no trailing slash) |
| Login works in Swagger but not in browser | `CORS_ORIGINS=http://localhost:3000` in `apps/api/.env` |

| Endpoint | URL |
|----------|-----|
| Web | http://localhost:3000 |
| Health | http://localhost:4000/health |
| API docs | http://localhost:4000/api/v1/docs |

**Local admin** (created by `npm run dev` / `npm run db:seed`):

| Email | Password |
|-------|----------|
| `admin@maximuskratos.local` | `ChangeMeAdmin123!` |

## Environment

**API** (`apps/api/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Local Docker Postgres: `postgresql://mk:mk_local_dev@localhost:5433/maximuskratos` |
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
