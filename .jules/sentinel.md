# Sentinel Journal

## 2026-10-23 - Edge Function Authentication & DoS Prevention in overdue-push
**Vulnerability:** The `overdue-push` Supabase Edge Function had no authentication check on incoming HTTP requests. Any unauthenticated public client could repeatedly trigger the endpoint, which executed administrative operations using `SUPABASE_SERVICE_ROLE_KEY` across all users' subscriptions and tasks, leading to resource exhaustion, notification spamming, and potential DoS.
**Learning:** Background worker endpoints and push trigger functions implemented as Supabase Edge Functions default to accepting all incoming requests unless explicitly guarded by validating the `Authorization` header against `SUPABASE_SERVICE_ROLE_KEY` or verifying the user's JWT with `auth.getUser()`.
**Prevention:** Always validate authorization in edge functions before initializing privileged operations or sending third-party notifications. Extract the authorization logic into a testable helper function.
