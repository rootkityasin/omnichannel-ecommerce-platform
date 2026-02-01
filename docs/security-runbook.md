# Security Runbook 🛡️

## 1. Credential Rotation Policy

### When to Rotate
*   **Routine**: Every 90 days.
*   **Incident**: Immediately upon suspected compromise.
*   **Offboarding**: When a developer with access leaves the team.

### How to Rotate Secrets

#### 1.1 Database Credentials (Prisma/Postgres)
1.  Generate a new password in your Database Provider (Supabase/Neon/Vercel).
2.  Update `DATABASE_URL` in Vercel Environment Variables.
3.  Redeploy the application.
4.  Update local `.env` for all developers.

#### 1.2 Admin Setup Secret
1.  Generate a new random string: `openssl rand -hex 32`.
2.  Update `ADMIN_SETUP_SECRET` in Vercel.
3.  **Impact**: All currently logged-in Admin sessions might persist, but new "Trusted Device" authorizations will require the new token.

#### 1.3 NextAuth Secret
1.  Update `AUTH_SECRET` in Vercel.
2.  **Impact**: **ALL users (Customers & Admins) will be logged out immediateley.**

---

## 2. Incident Response Plan

### Scenario: Admin Account Takeover
1.  **Identify**: Suspicious logs in `/admin/security` (e.g., login from unknown IP).
2.  **Contain**:
    *   Go to **Admin > Security > Block List**.
    *   Block the user account immediately.
    *   Revoke the specific "Trusted Device" ID associated with the session.
3.  **Eradicate**:
    *   Rotate `AUTH_SECRET` to force global logout if widespread.
    *   Rotate `ADMIN_SETUP_SECRET`.
4.  **Recover**:
    *   Reset the legitimate admin's password.
    *   Review Audit Logs for any changes made during the compromise window.

### Scenario: CSP Violation Spike
1.  **Analyze**: Check `/admin/security` logs for "CSP_VIOLATION".
2.  **Assess**:
    *   Is it a new plugin/extension? (False Positive)
    *   Is it an unknown domain trying to load scripts? (XSS Attack)
3.  **Remediate**:
    *   If XSS: Update CSP headers to be stricter. Audit recent code commits for unescaped HTML.

---

## 3. Monitoring

*   **Audit Logs**: Check `/admin/security` weekly.
*   **Vercel Logs**: Monitor for 500 errors or high error rates.
*   **Database**: Check for unusual spikes in `User` creation or `Order` volume.
