# CLAUDE.md — Pulse Survey Agent Instructions

## Assignment Context
This repo is a take-home technical assignment (OfferZen Senior Full Stack Engineer, AI Native — Shanique Jooste,
11 September 2026): a focused, production-quality vertical slice of a multi-tenant pulse survey SaaS, built with
heavy, documented AI assistance. The assignment is timeboxed (~4 hours target). Prioritize a clean, coherent
happy path over breadth. Everything not explicitly required is out of scope — do not gold-plate.

Full assignment brief: see [SPEC.md](SPEC.md). Design trade-offs, AWS notes, and AI workflow: see SOLUTION.md
(written after implementation).

## Project Context
Multi-tenant pulse survey SaaS.
Stack: NestJS, PostgreSQL, React, TypeScript, Docker.
Two organizations, two roles (Manager, Member), weekly survey responses.
Goal: Clean vertical slice — happy path first, then edge cases.

## Scope Boundaries (from the brief — do not exceed or under-shoot)
- Surveys: up to 3 questions each. Question types: `rating` (1–5) and `yes_no` only.
- Managers: create/manage surveys for their own organization only.
- Members: submit exactly one response per active week per survey.
- Week definition: **rolling 7-day window** (state this choice in SOLUTION.md; do not silently switch to calendar week).
- Tenant isolation approach: **application-layer scoping** via guard + repository-level organizationId filtering
  (state this choice and why in SOLUTION.md; DB row-level security was considered but is unnecessary complexity here).
- Auth: local-only, header-based (`X-User-Id`, `X-Org-Id`). No external identity providers, no paid cloud services.
- Surveys may be created via seed/fixture or a simple admin endpoint — do not build a full survey-builder UI.
- Summary endpoint must return: completion count, completion rate (vs. org member count), per-question rollups
  (rating → average + count; yes/no → counts per option).
- Seed data: at least 2 organizations, a few users per role each, demonstrating isolation.
- Frontend: minimal. Member flow (view active survey, submit response) + Manager flow (view weekly summary).
  Local "login" = pick a seeded user. No design system, no polish beyond legible and functional.
- Task 3 (AWS production-readiness) is **design-only** — a note in SOLUTION.md, no code, no IaC.

## Architecture Overview
```
pulse-surveys/
  backend/          ← NestJS API
  frontend/         ← React app
  docker-compose.yml
  README.md
  SOLUTION.md
  SPEC.md
  CLAUDE.md
  ai-logs/
```

## Code Standards
- Strict TypeScript — no `any` types ever
- Meaningful names — no abbreviations
- Small focused functions — single responsibility
- No magic numbers — use constants
- NestJS `Logger` only — no `console.log` in production code
- Never log sensitive data — no passwords, tokens, or PII

## SOLID Principles — Strictly Enforced
- **S** — One class, one job. Fat controllers are forbidden.
- **O** — Extend without modifying existing code
- **L** — Implementations must honour their interfaces
- **I** — Small focused interfaces, no bloated contracts
- **D** — Use NestJS dependency injection throughout

## NestJS Structure
```
backend/src/
  modules/
    auth/
    organizations/
    surveys/
    responses/
    users/
  common/
    guards/
    interceptors/
    decorators/
    filters/
  shared/
    dto/
    interfaces/
    constants/
```

## Multi-Tenancy Rules
- Every database query MUST be scoped to `organizationId`
- Never return data across tenant boundaries
- Validate tenant context in guards before any controller logic
- Seed data must include two completely isolated organizations
- Any endpoint touching survey/response data needs an explicit isolation test (see Testing Requirements)

## Authentication
- Simple header token for local dev — `X-User-Id` and `X-Org-Id`
- Role guard — Manager and Member roles enforced at route level
- No external identity providers needed

## Testing Requirements
- Unit tests for all services using Jest
- E2E tests for critical API endpoints using Supertest
- React Testing Library for frontend components
- Test multi-tenant isolation explicitly (org A can never read/write org B's data)
- Test role-based access control explicitly (Member cannot hit Manager-only routes)
- Meaningful coverage — not 100% for its own sake

## Database
- PostgreSQL with TypeORM
- Migrations for schema changes
- Seed data for two organizations with managers and members
- Row-level scoping in all queries (application-layer, per the isolation approach above)

## API Design
- RESTful endpoints
- DTOs for all request and response shapes
- Consistent error responses
- HTTP status codes used correctly
- Never return raw TypeORM entities — always map to DTOs

## Docker
- All services run via `docker-compose up`
- No manual setup required
- Health checks on all services
- Environment variables via `.env` file

## What I Must Never Do
- Put business logic in controllers
- Skip tenant scoping on any query
- Use `any` type
- Return raw database entities — always use DTOs
- Commit secrets or credentials
- Accept AI output without reviewing it
- Expand scope beyond the brief (no extra question types, no multi-org users, no third role, no external auth)

## AI Workflow Notes
- Spec before code — always (see SPEC.md, committed before implementation)
- Review every suggestion before accepting
- Reject suggestions that violate SOLID or tenant isolation
- Document what was rejected and why in `ai-logs/` and in SOLUTION.md's AI workflow section
- Export/copy session transcripts into `ai-logs/`, redacting anything personal
