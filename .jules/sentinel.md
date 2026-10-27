# Sentinel Journal - Security Learnings

## 2026-10-27 - Unauthenticated Edge Function Trigger Prevention
**Vulnerability:** The `overdue-push` Supabase edge function accepted unauthenticated HTTP requests, allowing public invocation to trigger background notifications for all users and consume push service quotas.
**Learning:** Edge functions deployed without explicit authorization checks (such as comparing against `SUPABASE_SERVICE_ROLE_KEY` or verifying user JWTs) default to being publicly accessible.
**Prevention:** Extract authorization logic into pure helper submodules (`auth.ts`) so edge functions enforce authorization checks on entry while enabling standard unit testing with Vitest.
