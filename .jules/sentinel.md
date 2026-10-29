## 2026-10-29 - Edge Function Unauthenticated Trigger Execution

**Vulnerability:** Edge functions handling scheduled or background tasks (such as `overdue-push`) executed without validating `Authorization` headers, allowing unauthenticated callers to trigger background jobs and perform database/push queries.
**Learning:** Supabase Edge Functions do not automatically enforce JWT or service role authentication unless explicitly verified in code using `auth.getUser()` or validating `SUPABASE_SERVICE_ROLE_KEY`.
**Prevention:** Always implement explicit authorization checks using `isRequestAuthorized` or JWT validation middleware at the entry point of all sensitive edge functions.
