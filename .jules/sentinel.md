## 2026-03-31 - Supabase Edge Functions with Service Role Key Authentication Gap
**Vulnerability:** Edge Functions utilizing `SUPABASE_SERVICE_ROLE_KEY` internally (such as `overdue-push`) lacked authorization checks, allowing unauthenticated external HTTP requests to trigger database queries and third-party push notifications.
**Learning:** Edge Functions in Supabase do not automatically enforce JWT verification when initiated over public HTTP unless explicitly checked in the handler logic or configured via gateway policy.
**Prevention:** Always extract and validate the `Authorization` header against `SUPABASE_SERVICE_ROLE_KEY` or user JWT tokens (`db.auth.getUser(token)`) before executing privileged service-role logic in Edge Functions.
