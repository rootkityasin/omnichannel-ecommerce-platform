# ISO 27001 Project Tracking (This Project Only)

This is the only project-specific ISO tracking file for this repository.

Reusable checklist for other projects (unchanged):
- `docs/ISO_27001_CERTIFICATION_CHECKLIST.md`

## 1. Overall Timeline Baseline

- Phase 0: Immediate Security Hygiene
- Phase 1: Scope and Governance
- Phase 2: ISMS documentation and risk framework (2-4 weeks)
- Phase 3: Control implementation and evidence pipeline (4-8 weeks)
- Phase 4: Internal audit and management review (2-3 weeks)
- Stage 1 and Stage 2 external audits (4-8 weeks, depends on cert body)

Estimated total duration: 3-6 months

## 2. Phase 0 Tracking (Project Status)

- [x] Remove exposed secrets from tracked code/docs
- [x] Rotate exposed secrets (recorded 2026-04-23)
- [x] Add CI secret scan gate (`.github/workflows/secret-scan.yml`)
- [x] Publish security ownership/escalation matrix (`docs/SECURITY_OWNERSHIP_AND_ESCALATION.md`)
- [ ] Purge exposed secrets from git history (if mandated by policy)
- [ ] Enforce branch protection to require secret-scan pass
- [ ] Replace placeholder escalation contacts with real org contacts
- [ ] Management sign-off on Phase 0 closure

## 3. Phase 1 Tracking (Project Status)

### 3.1 Scope and Boundaries
- [x] Draft ISMS scope for this SaaS (in this tracker)
- [ ] Confirm legal entity details
- [ ] Management approval of scope

Scope draft:
- ISMS covers design, development, deployment, operation, and support of this SaaS platform, including tenant storefronts, admin interfaces, CI/CD, databases, deployment infrastructure, and supporting operational tooling.

### 3.2 Security Objectives and KPIs
- [x] Define security objectives and KPI set (in this tracker)
- [ ] Assign final owners by named individuals
- [ ] Management approval of KPI cadence

KPI set:
- SEV-1 acknowledgement <= 15 minutes
- Critical vulnerability remediation within 7 days
- Quarterly privileged access review completion at 100%
- Backup success >= 99% and quarterly restore drill success at 100%
- CI required-gate pass before merge at 100%

### 3.3 Roles and Control Owners
- [x] Define role model (ISMS Manager, Risk Owner, Control Owners)
- [ ] Map named owners and backups
- [ ] Approve responsibility matrix

Role model:
- ISMS Manager
- Risk Owner
- Access Control Owner
- SDLC Security Owner
- Incident Response Owner
- Business Continuity Owner
- Vendor Risk Owner

### 3.4 Certification Budget and Timeline
- [x] Create budget categories and timeline baseline
- [ ] Fill actual budget values
- [ ] Approve budget and target Stage 1/2 windows

Budget categories:
- Certification body audit fees
- Internal implementation effort
- Tooling and monitoring
- Optional external consulting
- Training and awareness

### 3.5 Certification Body Selection
- [x] Define selection criteria
- [ ] Build shortlist with actual candidate names
- [ ] Request quotes and compare
- [ ] Select body and sign engagement

Selection criteria:
- Accreditation recognition in target markets
- SaaS/cloud audit experience
- Audit lead time and availability
- Cost transparency (Stage 1/2 + surveillance)
- Remote/multi-site capability

## 4. Budget Table (Fill with Actuals)

| Category | Estimated Cost | Owner | Status |
| --- | --- | --- | --- |
| Audit Fees | TBD | Finance/ISMS Manager | Pending |
| Internal Effort | TBD | Engineering Lead | Pending |
| Tooling | TBD | DevOps Lead | Pending |
| Consulting | TBD | Management | Optional |
| Training | TBD | HR/Management | Pending |

## 5. Certification Body Shortlist (Fill)

| Certification Body | Accreditation | SaaS Experience | Estimated Cost | Lead Time | Status |
| --- | --- | --- | --- | --- | --- |
| TBD | TBD | TBD | TBD | TBD | Shortlist Pending |
| TBD | TBD | TBD | TBD | TBD | Shortlist Pending |
| TBD | TBD | TBD | TBD | TBD | Shortlist Pending |

## 6. Evidence Links (Update As You Execute)

- CI quality gate: `.github/workflows/ci.yml`
- CI secret scan gate: `.github/workflows/secret-scan.yml`
- Security runbook: `docs/security-runbook.md`
- Security ownership and escalation: `docs/SECURITY_OWNERSHIP_AND_ESCALATION.md`
- Backup/restore runbook: `docs/migration_and_backups.md`
- Health endpoint evidence: `app/api/health/route.ts`

## 7. Approvals

- [ ] Management approval for Phase 0 closure
- [ ] Management approval for Phase 1 closure
- [ ] Budget approval
- [ ] Certification body selection approval

## Revision Control

- Version: 2.0 (Consolidated Project Tracker)
- Last updated: 2026-04-23
- Next review: 2026-07-23
