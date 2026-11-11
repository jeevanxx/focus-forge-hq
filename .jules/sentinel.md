## 2026-11-11 - Edge Function Missing Authentication / Authorization

**Vulnerability:** The `overdue-push` Supabase Edge Function lacked authorization and authentication checks. Any unauthenticated caller who knew or guessed the endpoint URL could trigger push notification dispatch and database reads across all users, leading to resource exhaustion, notification spam, and abuse of external push services (WebPush/VAPID).

**Learning:** When creating Supabase edge functions designed to be executed via scheduled cron triggers or administrative actions, developers often use `SUPABASE_SERVICE_ROLE_KEY` inside the handler for database queries without first validating whether the incoming request itself was authorized by the scheduler (via a service key Bearer token) or a verified authenticated user session.

**Prevention:** Always implement defense in depth by validating incoming `Authorization` headers on edge functions against `SUPABASE_SERVICE_ROLE_KEY` or `supabase.auth.getUser(token)` before performing privileged queries or external service invocations. Fail securely with 401 Unauthorized for missing or invalid credentials.
