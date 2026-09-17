# SOLUTION.md

## Design & Trade-offs

### Week definition: rolling 7-day window
Chosen over calendar week. A rolling window is simpler to reason about and test: "have you responded in the last 7
days" has no timezone or week-start-day ambiguity, and it doesn't create an artificial cliff where a response
submitted Sunday night and one submitted Monday morning both "count" for different weeks despite being almost
simultaneous. The trade-off is that there's no single shared window boundary across all users — two members'
"weeks" can start at different moments depending on when they last responded. For a lightweight pulse-check product
that's an acceptable trade, and it's called out explicitly in [CLAUDE.md](CLAUDE.md) and [SPEC.md](SPEC.md) so it
isn't silently reinterpreted later.

One consequence worth flagging: because the window is rolling rather than fixed, the one-response-per-week rule is
enforced in `ResponsesService` (querying for a prior response within the last 7 days) rather than as a database
`UNIQUE` constraint — a rolling window has no fixed boundary value to key a constraint on. That means there's a
narrow race-condition window (two near-simultaneous submissions could theoretically both pass the check before
either is written) that a calendar-week + unique-constraint design wouldn't have. For this take-home slice that risk
is acceptable; a production version would likely add a Postgres advisory lock or a partial unique index keyed on a
truncated timestamp to close it.

### Tenant isolation: application-layer scoping
Chosen over Postgres row-level security (RLS). Every query that touches survey or response data goes through a
service method that takes `organizationId` explicitly, and every entity that can be tenant-scoped carries an
indexed `organizationId` column. The critical enforcement point is `OrganizationScopeGuard`
([backend/src/common/guards/organization-scope.guard.ts](backend/src/common/guards/organization-scope.guard.ts)):
it doesn't just read the `X-Org-Id` header and trust it — it resolves the user from `X-User-Id` and rejects the
request with 401 if the claimed org doesn't match the user's actual org. So a malicious or buggy client can't spoof
`X-Org-Id` to read another organization's data even if it knows a valid `X-User-Id`.

RLS would be a stronger guarantee (isolation enforced at the database layer, immune to a bug in any one service
forgetting to filter), and it's the right call for a system with a longer lifetime or many services touching the
same tables. For this slice, application-layer scoping was faster to build and easier to unit-test in isolation
without a database connection, and the guard is the single choke point every request goes through — there's no
route that skips it. The e2e suite exists specifically to catch the failure mode RLS would prevent by construction
(a service method that forgets to filter by org): see "Validation" below.

### Known gaps / what I'd do with more time
- **Race condition on duplicate submission** (see above) — add a partial unique index or advisory lock.
- **No pagination** on any list endpoint — fine at seed-data scale, would need it before real usage.
- **Survey editing/versioning** isn't supported — a survey is create-once; changing questions after responses exist
  would silently orphan old answers' semantics. Out of scope per the brief, but the first thing I'd design next.
- **RLS as defense-in-depth** — even with the guard in place, adding Postgres RLS as a second layer would remove the
  "a future service method that forgets to filter" failure mode entirely, at the cost of more complex local setup.
- **Frontend has no loading skeletons/optimistic UI** — it's functional but minimal, per the brief's "keep it
  minimal" instruction.
- **No structured logging** (e.g. Winston) wired up — `Logger` is used for the one bootstrap log line, but
  request-level logging with `organizationId` context wasn't built out, since nothing in the assignment's grading
  criteria exercises log output and it would have eaten time better spent on the tested paths.

## Task 3 — Production Readiness on AWS (design-only)

### Deployment shape
- **API**: NestJS backend as a container on **ECS Fargate**, behind an **Application Load Balancer**. Fargate over
  EC2-backed ECS or Lambda because the API is a long-lived stateful-per-request Nest app (not naturally
  request-per-invocation like Lambda) and Fargate avoids managing EC2 instances. Horizontal scaling via ECS service
  auto-scaling on CPU/request count.
- **Database**: **RDS for PostgreSQL**, Multi-AZ for failover, in private subnets with no public access — only the
  ECS task security group can reach it on 5432. Automated backups + point-in-time recovery enabled.
- **Frontend**: the React app is a static build (`vite build`) served from **S3 + CloudFront**, not from a container
  — it's just static assets, so there's no reason to pay for compute to serve it. CloudFront gives HTTPS, caching,
  and a CDN edge for free with this setup.
- **Secrets**: DB credentials and any other secrets in **AWS Secrets Manager**, injected into the ECS task
  definition as secrets (not environment variables baked into the image).
- **Networking**: a VPC with public subnets (ALB, NAT gateway) and private subnets (ECS tasks, RDS). The frontend
  bucket and CloudFront distribution sit outside the VPC entirely since they're fully static.

### Organization logo storage — minimizing backend bandwidth/cost while keeping access secure
Goal: the backend should never proxy image bytes. The flow:
1. **Upload**: the frontend requests a **presigned S3 PUT URL** from the backend (a cheap, tiny API call — the
   backend never touches the image bytes). The frontend uploads the image directly to S3 using that URL. The
   presigned URL is scoped to a key namespaced by `organizationId` (e.g. `logos/{organizationId}/{uuid}.png`) and
   expires quickly (a few minutes).
2. **Serving**: the logo is served through **CloudFront** in front of the S3 bucket, not directly from S3 and never
   through the backend. This means viewing a logo costs the backend nothing — CloudFront caches the object at the
   edge after the first request.
3. **Access control**: the S3 bucket stays fully private (no public bucket policy, no `public-read` ACLs).
   CloudFront reaches it via an **Origin Access Control (OAC)**, so the only path to the object is through
   CloudFront. If logos need to be non-public (e.g. gated to authenticated org members rather than "anyone with the
   URL"), CloudFront **signed URLs** or **signed cookies** replace the plain CloudFront URL — the backend generates
   a short-lived signed URL. That still keeps bandwidth off the backend: it issues a signature, not the image.
4. **Validation**: the presigned upload URL's `Content-Type` and a max `Content-Length` are constrained at
   generation time (S3 POST policy conditions), and a Lambda triggered on S3 `ObjectCreated` can run a cheap
   validation pass (real image, within size/dimension limits) and reject/delete anything that doesn't qualify,
   without the backend ever holding the bytes in memory.

This keeps the backend's role to *authorizing* access (who can upload/view what), never *serving* bytes — the
expensive, bandwidth-heavy part is entirely offloaded to S3 + CloudFront.

### Tenancy, security, and scaling priorities (first things I'd lock down)
1. **Tenant isolation stays the first-class security boundary.** In this slice it's app-layer (see above); moving
   to production, I'd add RLS as defense-in-depth before scaling to more services, since the number of places a
   missing `organizationId` filter could slip in only grows.
2. **Real authentication.** The header-based local auth here is explicitly not production-safe — anyone who knows a
   valid `userId`/`organizationId` pair can act as that user. Production needs real sessions or JWTs issued by an
   identity provider (Cognito, or an external IdP via OIDC), with the server — not a client-supplied header — as
   the source of truth for identity.
3. **Least-privilege IAM** for every component: the ECS task role only gets the specific Secrets Manager secret and
   S3 prefix it needs, not broad service access.
4. **Rate limiting / abuse protection** at the ALB or API Gateway layer before the backend, especially on the
   response-submission endpoint.
5. **Scaling**: RDS read replicas if summary queries become a hot path (they're read-heavy and tolerant of slight
   staleness); ECS auto-scaling on request count; CloudFront absorbs almost all frontend and logo-serving load
   regardless of backend scale.

## Task 4 — AI-Assisted Delivery

### Workflow
This was built end-to-end with **Claude Code** (Claude Sonnet 5) in the Claude desktop app, as one continuous
conversation rather than many short prompts. The shape of the workflow:

1. **Spec before code.** The first thing committed was [SPEC.md](SPEC.md) — locking in the two "flexibility"
   decisions the brief allows (rolling window vs calendar week; isolation approach) and the API surface, *before*
   any implementation. [CLAUDE.md](CLAUDE.md) was written alongside it as the standing instruction file: strict
   TypeScript, no `any`, SOLID boundaries, DTOs only at the API edge, tenant scoping on every query, no scope
   creep beyond the brief. Both were committed in the first PR, ahead of any backend code.
2. **Backend in one pass, then verify against a real database.** I had Claude Code scaffold and implement the
   entire NestJS backend — entities, migration, guards, services, controllers — in one sitting. I deliberately
   asked for a build/typecheck pass and unit tests with mocked repositories first (fast, no infra needed), then
   asked it to actually spin up Postgres via `docker-compose`, run the migration, seed data, and hit the API with
   real requests. That step caught a real bug: TypeORM was silently creating a second, wrong join column
   (`organizationId` vs `organization_id`) because relations were declared without explicit `@JoinColumn`, which
   only surfaced once real INSERTs ran against the real schema — the mocked unit tests couldn't have caught it. I
   had it root-cause the error message rather than work around it, fix all five affected entities, and re-verify.
3. **Automated e2e tests, not just manual verification.** After the live curl-based verification passed, I stopped
   and asked myself (out loud, to the AI) whether "verified once by hand" was good enough, given the brief
   explicitly asks for isolation to be demonstrated and CLAUDE.md's testing requirements call for isolation/RBAC to
   be tested explicitly. It wasn't — a manual curl session doesn't survive as regression protection. I had Claude
   Code write a Supertest e2e suite covering the happy path, every isolation boundary (cross-org survey access,
   summary access, response submission, header spoofing), and RBAC, running against the real database via a
   fixture-reset helper. This is a concrete example of a decision I made rather than delegated: I was presented
   with the choice ("move to frontend now" vs "add e2e tests first") and chose correctness/coverage over speed.
4. **Frontend, then verify visually in a real browser against the real backend.** Same pattern: implement the two
   required flows (member submit, manager summary) plus a local-login picker, write component tests, then actually
   drive the app in a browser — log in as a member of one org, submit a response, switch to that org's manager and
   confirm the summary reflects it, then switch to the *other* org's manager and confirm they see a completely
   separate, zero-count survey. That last step is the demo-critical isolation check the brief asks for, and doing
   it live (not just trusting the code) is what caught that everything actually wired together correctly — the
   backend fix from step 2 and the frontend's auth headers had never been exercised together before that point.
5. **Small, reviewable PRs.** Every phase (backend scaffold, the TypeORM bug fix, e2e tests, frontend) went into
   its own branch and PR rather than one giant commit to `main`, specifically so the diffs stayed reviewable and
   the commit history shows how the work actually progressed — per the brief's explicit "do not squash to a single
   commit" instruction.

**What I delegated to the AI**: essentially all code generation — entities, services, guards, DTOs, migrations, the
React components, and the test suites. Also delegated: running the actual verification commands (build, test,
docker-compose, curl, driving the browser) rather than just describing what *should* work.

**What I kept for myself**: the two brief-mandated design decisions (rolling window, app-layer isolation) and the
rationale behind them; deciding *when* "good enough" wasn't (the e2e-tests-now-vs-later call); reviewing every diff
before it went into a PR; and the AWS design note and this write-up, which needed to reflect judgment about
priorities rather than just describe what was built.

### Validation
What I checked, concretely:
- **Every backend change had to build clean** (`nest build` / `tsc -b`) before moving on — not just "looks right."
- **Unit tests with mocked repositories** for the rollup math, the rolling-window rule, and both guards' isolation
  logic — fast feedback that doesn't need infrastructure.
- **Live database verification**: actually ran the migration and seed against Postgres via `docker-compose`, not
  just trusted that the TypeORM entity definitions were correct. This is what surfaced the `@JoinColumn` bug —
  without it, the bug would have shipped invisibly, since the unit tests mock the repository layer entirely.
- **Manual curl-based smoke test** of the full request lifecycle including the failure paths: cross-org summary
  access (expected 404, got 404), RBAC violation (expected 403, got 403), header spoofing (expected 401, got 401),
  duplicate submission (expected 409, got 409). I didn't accept "the code looks like it should return 404 here" —
  I ran it and read the actual response.
- **Converted that manual verification into an automated e2e suite** once I judged it needed to survive as
  regression protection rather than live only in a terminal session (see workflow step 3).
- **Drove the frontend in an actual browser** against the actual running backend — clicked through the login
  picker, filled in and submitted the real form, and switched between four different seeded users to visually
  confirm isolation, rather than reading the component code and assuming it was correct.

What I rejected or rewrote:
- My own first draft of the "rolling 7-day window" implementation bucketed responses into fixed epoch-aligned
  windows (`Math.floor(now / windowMs) * windowMs`) with a DB `UNIQUE` constraint on the bucket. On review this
  contradicted the spec's own definition of "rolling" (a window has no fixed boundary), so I had it reworked into a
  true rolling check (`submittedAt >= now - 7 days`) enforced in the service layer instead, and documented the
  resulting trade-off (no DB-level uniqueness guarantee) explicitly in this file and in code comments, rather than
  quietly shipping a design that didn't match what was promised.
- Early draft DTOs used `class` with `strictPropertyInitialization` errors on every output-only field; rather than
  paper over it with definite-assignment assertions (`!`) everywhere, I had the non-validated output DTOs (survey,
  summary, identity, response shapes) converted to plain `interface`s, since they never needed `class-validator`
  decorators in the first place — `class` was the wrong tool for those.
- Accepted the AI's initial guard/RBAC design without changes — the `OrganizationScopeGuard` validating the claimed
  org against the resolved user's actual org (rather than trusting the header outright) was correct on first pass
  and confirmed correct by both the e2e suite and the live 401 spoofing test.

### Session logs
See [ai-logs/](ai-logs/) — the full session transcript (tool calls and results, not just chat text) was exported
directly from the Claude desktop app's session-export feature and committed after scanning for and redacting
personal information (the account email and local machine username/paths). See `ai-logs/README.md` for details on
what was redacted and how to read the transcript format.
