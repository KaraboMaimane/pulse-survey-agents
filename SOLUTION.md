# SOLUTION.md

> Placeholder — to be completed once implementation is done. Structure below follows the assignment's
> deliverable requirements (Task 3 AWS design note + Task 4 AI workflow are required here).

## Design & Trade-offs
- Week definition chosen: rolling 7-day window (rationale: see SPEC.md).
- Tenant isolation approach chosen: application-layer scoping (rationale: see SPEC.md).
- Known gaps / what I'd do with more time: TBD.

## Task 3 — Production Readiness on AWS (design-only)
- Deployment: TBD (e.g. ECS Fargate for API, RDS PostgreSQL, S3 + CloudFront for frontend static hosting).
- Organization logo storage/serving: TBD (e.g. direct-to-S3 presigned uploads, served via CloudFront, to keep
  backend bandwidth/cost minimal while keeping access controlled).
- Tenancy, security, and scaling priorities: TBD.

## Task 4 — AI-Assisted Delivery
### Workflow
Tools used, task setup, breakdown of what was delegated vs. done manually, review/iteration process: TBD.

### Validation
What was checked, what was rejected or rewritten, how correctness was confirmed: TBD.

### Session logs
See `ai-logs/` for exported/copied session transcripts (personal information redacted).
