# Pulse Surveys — Multi-Tenant Take-Home Slice

Minimal multi-tenant pulse survey SaaS: NestJS + PostgreSQL backend, React frontend. See [SPEC.md](SPEC.md) for the
implementation spec and [SOLUTION.md](SOLUTION.md) for design trade-offs, the AWS production-readiness note, and
the AI-assisted workflow used to build this.

> Status: scaffolding in progress. This section will be filled in with real run instructions as the backend and
> frontend land.

## Stack
- Backend: NestJS, TypeORM, PostgreSQL
- Frontend: React, TypeScript
- Local orchestration: Docker Compose

## Run locally (planned)
```bash
docker-compose up
```
- Backend API: http://localhost:3000
- Frontend: http://localhost:5173

## Auth (local dev only)
No external identity provider. Requests are identified via headers:
- `X-User-Id`
- `X-Org-Id`

The frontend "login" is picking a seeded user from a list.

## Seed data
Two organizations, each with a manager and a few members, and one active survey. Run via the seed script
(command TBD once the backend lands) — demonstrates tenant isolation end to end.
