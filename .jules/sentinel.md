## 2026-03-31 - Enforce Authorization on Supabase Edge Functions
**Vulnerability:** Unauthenticated invocation of `overdue-push` edge function allowed any user/attacker to query overdue tasks across all accounts, dispatch web push notifications, and trigger database modifications without credentials.
**Learning:** Edge functions using service role keys internally must validate incoming `Authorization` headers (matching `SUPABASE_SERVICE_ROLE_KEY` for internal/cron calls or user JWTs via `db.auth.getUser`) before running queries or external side-effects.
**Prevention:** Always extract authentication check logic into a testable helper (e.g., `auth.ts`) so edge function authorization can be unit-tested without Deno/npm module specifier dependencies in Vitest.
