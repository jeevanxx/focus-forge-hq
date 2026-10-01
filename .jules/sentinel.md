## 2026-10-01 - Unauthenticated Edge Function Invocation Vulnerability
**Vulnerability:** Supabase Edge Functions handling system operations (like `overdue-push`) lacked incoming `Authorization` header validation, allowing unauthenticated callers to execute service-role database queries and push notification dispatches.
**Learning:** Background or scheduled functions in Supabase edge functions still expose HTTP routes and require explicit token verification against the service role key or user JWT to prevent public unauthorized access.
**Prevention:** Always validate `req.headers.get("Authorization")` at the beginning of edge functions before instantiating service-role DB clients or triggering side effects.
