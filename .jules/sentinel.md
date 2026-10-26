## 2026-03-31 - Missing Authorization Check in Supabase Edge Functions

**Vulnerability:** Unauthenticated HTTP requests to `overdue-push` Edge Function triggered push notification processing and database operations for all users.
**Learning:** Supabase Edge Functions do not automatically enforce JWT verification or service role checks unless explicitly validated inside the handler using `db.auth.getUser` or against `SUPABASE_SERVICE_ROLE_KEY`.
**Prevention:** Extract authorization verification into pure TypeScript modules (`auth.ts`) without `npm:` specifiers so both Edge Functions and Vitest unit tests can validate authorization logic.
