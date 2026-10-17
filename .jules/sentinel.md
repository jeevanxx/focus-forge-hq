## 2026-03-31 - Unauthenticated Edge Function Trigger Vulnerability
**Vulnerability:** The `overdue-push` Supabase edge function was accessible without any authentication or authorization verification, allowing unauthenticated remote attackers to trigger batch push notifications to users and exhaust resources.
**Learning:** Edge functions deployed without `auth.getUser` verification or `SUPABASE_SERVICE_ROLE_KEY` header comparison can be invoked by anyone on the internet who knows or scans for the function URL.
**Prevention:** Always validate incoming `Authorization` headers in edge functions against `SUPABASE_SERVICE_ROLE_KEY` for internal/cron calls or `db.auth.getUser(token)` for user context before performing any database query or external side effects.
