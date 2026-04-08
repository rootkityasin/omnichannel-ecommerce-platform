# Phase 5: Verification and Acceptance

Use this checklist after completing optimization phases.

## 1) Build confidence checks

- npm run lint
- npx vitest run

## 2) Capture baseline and post-change artifacts

Baseline:

1. export PGPASSWORD="your-db-password"
2. npm run profile:vps
3. Save generated summary path from `artifacts/perf`.

Post-change:

1. export PGPASSWORD="your-db-password"
2. npm run profile:vps
3. Save generated summary path from `artifacts/perf`.

## 3) Compare summaries

- npm run profile:compare -- <before.summary.txt> <after.summary.txt>

Example:

- npm run profile:compare -- artifacts/perf/profile-20260408-180000.summary.txt artifacts/perf/profile-20260408-183000.summary.txt

## 4) Functional verification

During and after profiling, verify:

1. Dashboard loads and updates normally.
2. Orders list and status updates work.
3. Products create and edit work.
4. Customers import and CRUD work.

## 5) Acceptance criteria

- No sustained 100% CPU during admin route switching.
- App and/or DB peak CPU reduced versus baseline.
- No failed core admin workflow.

## 6) Release note template

- CPU profile baseline summary file: <path>
- CPU profile post-change summary file: <path>
- App peak CPU delta: <value>
- DB peak CPU delta: <value>
- Functional verification status: PASS/FAIL
