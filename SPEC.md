# SPEC — Multi-Tenant Pulse Surveys (Focused Slice)

Source: OfferZen Senior Full Stack Engineer (AI Native) take-home assignment, prepared by Shanique Jooste,
11 September 2026. This document is the implementation spec derived from that brief, written before any code.

## Goal
A minimal, production-quality vertical slice of a multi-tenant SaaS: organizations run weekly pulse surveys,
members respond, managers see rollups. Small React UI to exercise the flows. Depth over breadth on the happy path.

## Decisions locked in before coding (per the brief's "flexibility" clauses)
- **Week definition:** rolling 7-day window from `now`, not calendar week. Simpler to reason about and test
  without timezone/week-start edge cases.
- **Tenant isolation:** application-layer scoping. An `OrganizationScopeGuard` reads `X-Org-Id` (validated against
  the resolved user), and every repository query includes an explicit `organizationId` filter. No DB-level RLS —
  unnecessary complexity for this slice, but noted as a next step in SOLUTION.md.
- **Auth:** header-based local identity — `X-User-Id` + `X-Org-Id`. Frontend "login" is picking a seeded user from
  a list. No JWTs, no sessions, no external IdP.

## Domain model
- **Organization**: id, name, createdAt.
- **User**: id, organizationId, name, role (`manager` | `member`), createdAt.
- **Survey**: id, organizationId, title, createdAt, isActive. Has 1–3 questions.
- **Question**: id, surveyId, text, type (`rating` | `yes_no`), order.
- **Response**: id, surveyId, userId, organizationId, weekStartAt (start of the rolling 7-day window the response
  belongs to), submittedAt. Unique constraint on (surveyId, userId, weekStartAt) enforces "one response per
  active week."
- **Answer**: id, responseId, questionId, ratingValue (nullable), yesNoValue (nullable).

## API surface (v1)
All routes require `X-User-Id` + `X-Org-Id` headers. `OrganizationScopeGuard` resolves the user, verifies they
belong to the claimed org, and attaches `{ userId, organizationId, role }` to the request. `RolesGuard` enforces
Manager-only routes.

- `GET /surveys/active` — the org's current active survey (member + manager). Members use this to answer.
- `POST /surveys` — create a survey (Manager only). Body: title, up to 3 questions (text, type).
- `GET /surveys/:id/summary` — 7-day rollup for a survey (Manager only, own org only): completion count,
  completion rate vs. org member count, per-question rollup (rating: avg + count; yes/no: counts per option).
- `POST /surveys/:id/responses` — submit a response (Member only). Rejects a second submission in the same
  rolling week with 409 Conflict.

## Seed data
Two organizations (e.g. "Acme Co" and "Globex Corp"), each with 1 manager and 2–3 members, and one active survey
with 2–3 questions (mix of rating and yes/no). Used to demonstrate isolation in the demo and in e2e tests.

## Out of scope (explicitly, to keep the slice small)
- Question types beyond rating/yes-no.
- Survey editing/versioning, scheduling, or multiple concurrent active surveys per org.
- Users belonging to multiple orgs, or a third role.
- External identity providers, password auth, email delivery.
- Organization logo upload (covered as a design-only note in SOLUTION.md's AWS section, no code).
- Pagination, filtering, or search on any list endpoint.

## Testing plan
- Unit tests: survey/response services, especially rollup math and the one-response-per-week rule.
- E2E (Supertest): create survey → submit response → fetch summary, run once per org to prove isolation
  (org A's manager can never see org B's survey/summary/responses).
- RBAC e2e: a Member hitting a Manager-only route gets 403.
- Frontend: React Testing Library for the member submit flow and the manager summary view.

## Delivery order
1. This spec + CLAUDE.md (committed first).
2. Backend scaffold, entities, migrations, seed script.
3. Auth guard + RBAC guard.
4. Surveys module (create, get active) + Responses module (submit) + isolation/RBAC tests.
5. Summary rollup endpoint + tests.
6. Frontend: user picker, member survey view, manager summary view.
7. docker-compose wiring, README.
8. SOLUTION.md (trade-offs, AWS design note, AI workflow) + ai-logs/.
