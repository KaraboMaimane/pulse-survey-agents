# Pulse Surveys — Multi-Tenant Take-Home Slice

Minimal multi-tenant pulse survey SaaS: NestJS + PostgreSQL backend, React frontend. See [SPEC.md](SPEC.md) for the
implementation spec and [SOLUTION.md](SOLUTION.md) for design trade-offs, the AWS production-readiness note, and
the AI-assisted workflow used to build this.

## Stack
- Backend: NestJS, TypeORM, PostgreSQL
- Frontend: React, TypeScript, Vite
- Local orchestration: Docker Compose

## Run locally

### Option A: Docker Compose (everything)
```bash
docker-compose up
```
- Backend API: http://localhost:3000
- Frontend: http://localhost:5173
- Postgres: localhost:5432

The backend container does not run migrations/seed automatically — run them once against the running stack:
```bash
cd backend
cp .env.example .env
npm install
npm run migration:run
npm run seed
```

### Option B: Run backend and frontend directly (faster iteration)
```bash
# 1. Start only Postgres
docker-compose up -d postgres

# 2. Backend
cd backend
cp .env.example .env
npm install
npm run migration:run
npm run seed
npm run start:dev
# API on http://localhost:3000

# 3. Frontend (separate terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
# App on http://localhost:5173
```

## Auth (local dev only)
No external identity provider. Requests are identified via headers:
- `X-User-Id`
- `X-Org-Id`

The frontend "login" is picking a seeded user from a list at `GET /auth/identities` — no password.

## Seed data
`npm run seed` (in `backend/`) creates two organizations — **Acme Co** and **Globex Corp** — each with a manager,
a few members, and one active weekly survey (mix of rating and yes/no questions). Use it to demonstrate isolation:
log in as a member of one org, submit a response, then switch to a manager of the *other* org and confirm they
only ever see their own org's survey and summary.

## Testing
```bash
# Backend unit tests
cd backend && npm test

# Backend e2e tests (needs Postgres running — see Option A/B above)
cd backend && npm run test:e2e

# Frontend component tests
cd frontend && npm test
```
