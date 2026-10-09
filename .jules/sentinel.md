## 2026-03-31 - Edge Function Missing Authorization Check

**Vulnerability:** `supabase/functions/overdue-push/index.ts` was accessible via public HTTP requests without validating the `Authorization` header, allowing unauthenticated attackers to trigger notification broadcasts and DB queries.
**Learning:** Background job edge functions created for cron/internal push notifications often bypass JWT checks unless explicitly checked against `SUPABASE_SERVICE_ROLE_KEY` or `auth.getUser`.
**Prevention:** Always validate `Authorization` headers against service role keys or user JWTs in edge functions before executing privileged business logic or database operations.
