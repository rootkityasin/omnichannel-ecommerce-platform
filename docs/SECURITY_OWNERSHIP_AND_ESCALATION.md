# Security Ownership and Escalation Matrix

This document defines Security Owner responsibilities and the incident escalation chain for the SaaS platform.

## 1. Security Ownership

- Primary Security Owner: Platform Security Lead (project maintainer)
- Secondary Security Owner: Backup Engineering Lead
- Scope: All production tenant workloads, control-plane services, CI/CD, and database operations

## 2. Contact Channels

- Primary channel: security@your-domain.com
- Secondary channel: devops@your-domain.com
- Emergency channel: on-call phone and incident bridge

## 3. Severity and SLA Matrix

| Severity | Example | Initial Response SLA | Escalation |
| --- | --- | --- | --- |
| SEV-1 | Active data breach, full outage, auth compromise | 15 minutes | Immediate exec + security owner paging |
| SEV-2 | Partial outage, privileged access anomaly | 1 hour | Security owner + engineering lead |
| SEV-3 | Non-critical vulnerability, degraded feature | 1 business day | Engineering lead |
| SEV-4 | Low-risk issue, hygiene task | 3 business days | Product/engineering backlog |

## 4. Escalation Flow

1. Incident detected (monitoring, user report, or audit log alert).
2. Incident commander assigned by Primary Security Owner.
3. Severity classified and communication bridge opened.
4. Containment actions executed.
5. Recovery actions executed.
6. Post-incident review completed within 5 business days.

## 5. Required Records

- Incident ticket ID
- Start time, detection source, and impacted scope
- Containment and recovery timeline
- Root cause and corrective actions
- Owner and target completion date for each action

## 6. Approval

- Approved by: Engineering Management
- Last reviewed: 2026-04-23
- Next review due: 2026-07-23
