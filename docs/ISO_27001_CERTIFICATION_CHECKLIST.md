# ISO/IEC 27001:2022 Certification Checklist for SaaS

Use this checklist for any SaaS project (even if it starts with no CI/CD).

## How to use this file
- Copy this file into any new SaaS repo.
- Keep all tasks as checkboxes.
- Attach evidence links/screenshots/tickets beside each completed item.
- Do not claim "ISO certified" until an accredited certification body issues the certificate.

## Legend
- [x] Completed in this project (based on repository evidence)
- [ ] Not completed yet / needs implementation or formal evidence

## Phase 0: Immediate Security Hygiene (Week 1)
- [x] Remove exposed secrets/credentials from docs and code.
- [ ] Purge exposed secrets from commit history (requires coordinated force-push and team approval).
- [x] Rotate all secrets after any exposure (DB, auth, cloud, API keys). Completed: 2026-04-23.
- [x] Add secret scanning in CI (for example Gitleaks/TruffleHog).
- [x] Define a security owner and escalation contact list.

Phase 0 status in this project:
- Completed in repository scope: secret redaction in tracked files, rotation record, CI secret-scan workflow, ownership/escalation documentation.
- Remaining external/manual control: history rewrite + coordinated force-push if historical secret purge is mandated by your policy.

## Phase 1: Certification Scope and Governance (Week 1)
- [ ] Define legal entity and ISMS scope (systems, environments, people, locations).
- [ ] Define information security objectives and KPIs.
- [ ] Approve certification budget and timeline.
- [ ] Select accredited certification body.
- [ ] Define ISMS roles and control owners.

## Phase 2: ISMS Core Documentation (Weeks 2-3)
- [ ] ISMS Policy approved by management.
- [ ] Risk assessment methodology documented.
- [ ] Risk register created and owners assigned.
- [ ] Risk treatment plan created with deadlines.
- [ ] Statement of Applicability (SoA) completed (Annex A mapping + justifications).
- [ ] Asset inventory completed (code, infra, data stores, laptops, secrets, SaaS tools).
- [ ] Data classification policy documented.
- [ ] Access control policy documented.
- [ ] Secure development policy documented.
- [ ] Vulnerability management policy documented.
- [x] Incident response runbook documented.
- [ ] Supplier/vendor security policy documented.
- [ ] Business continuity policy documented.
- [ ] Backup/restore policy documented and approved.
- [ ] Privacy/legal obligations register documented.

## Phase 3: Engineering and Platform Controls (Weeks 3-6)
### 3.1 SDLC and CI/CD
- [x] CI pipeline exists.
- [x] Lint gate in CI.
- [x] Type-check gate in CI.
- [x] Unit test gate in CI.
- [ ] Branch protection requires all checks before merge.
- [ ] SAST scan in CI.
- [ ] Dependency vulnerability scan in CI.
- [ ] Container/image vulnerability scan in CI.
- [ ] IaC scan (if Terraform/Helm/Compose manifests are used).
- [ ] Signed releases/artifacts (recommended).

### 3.2 Application Security
- [x] Security headers configured (CSP, X-Frame-Options, HSTS).
- [x] API rate limiting implemented (at least for high-risk endpoints).
- [x] RBAC base model implemented.
- [ ] MFA mandatory for privileged/admin accounts.
- [ ] Formal secure code review checklist in PR template.
- [ ] Security testing (DAST or equivalent) scheduled.

### 3.3 Operations and Availability
- [x] Health endpoint exists.
- [x] Database backup process documented.
- [x] Restore procedure documented.
- [ ] RTO/RPO formally defined and approved.
- [ ] DR drill performed and evidence recorded.
- [ ] Centralized logging + alerting with on-call process.
- [ ] Error monitoring platform integrated (for example Sentry).

## Phase 4: People and Access Governance (Weeks 4-8)
- [ ] Joiner/Mover/Leaver process documented and used.
- [ ] Quarterly access reviews for production/admin tools.
- [ ] Least-privilege matrix for all systems.
- [ ] Security awareness training completed and recorded.
- [ ] Acceptable use policy acknowledged by staff/contractors.

## Phase 5: Vendor and Third-Party Governance (Weeks 5-8)
- [ ] Vendor inventory created (hosting, CI, email, analytics, payment, support tools).
- [ ] Vendor risk assessment completed per vendor.
- [ ] Security clauses in supplier contracts reviewed.
- [ ] Data processing agreements (DPA) tracked where needed.
- [ ] Vendor offboarding process documented.

## Phase 6: Evidence Collection Window (Weeks 6-10)
- [ ] Keep 2-3 months of control evidence (audit-ready folder structure).
- [ ] Incident log maintained (including false positives and lessons learned).
- [ ] Vulnerability remediation SLA metrics tracked.
- [ ] Change management evidence (PR approvals, CI results, release notes) archived.
- [ ] Backup success/failure reports archived.
- [ ] Access review evidence archived.

## Phase 7: Internal Audit and Corrective Actions (Week 10)
- [ ] Internal audit plan defined.
- [ ] Internal audit executed against scope and SoA.
- [ ] Nonconformities logged.
- [ ] CAPA (corrective actions) assigned, tracked, and verified.

## Phase 8: Management Review (Week 11)
- [ ] Management review meeting held.
- [ ] Review includes risks, objectives, incidents, audit findings, supplier risks, resources.
- [ ] Management decisions and action items documented.

## Phase 9: External Certification Audit (Weeks 12-14)
- [ ] Stage 1 audit completed (documentation readiness).
- [ ] Stage 1 findings addressed.
- [ ] Stage 2 audit completed (implementation effectiveness).
- [ ] Nonconformities closed within auditor timeline.
- [ ] ISO/IEC 27001 certificate issued with exact scope text.

## Phase 10: Post-Certification Maintenance (Ongoing)
- [ ] Surveillance audit calendar maintained.
- [ ] Annual risk assessment refresh completed.
- [ ] Annual internal audit completed.
- [ ] Annual management review completed.
- [ ] Control effectiveness KPIs reviewed quarterly.

---

## Current Project Evidence Snapshot
- CI checks (lint, type, unit tests): `.github/workflows/ci.yml`
- CI secret detection gate: `.github/workflows/secret-scan.yml`
- Incident response runbook: `docs/security-runbook.md`
- Security ownership and escalation matrix: `docs/SECURITY_OWNERSHIP_AND_ESCALATION.md`
- Backup and restore runbook: `docs/migration_and_backups.md`
- Security headers: `next.config.ts`
- Rate limit example: `app/api/track/route.ts` + `lib/rate-limit.ts`
- Health endpoint: `app/api/health/route.ts`
- RBAC enum model: `prisma/schema.prisma`

## Important
This checklist improves readiness but does not grant certification by itself. Certification requires independent external audit by an accredited body.
