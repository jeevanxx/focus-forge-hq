## 2026-10-07 - Missing Authorization in Background Edge Functions

**Vulnerability:** The `overdue-push` Supabase edge function lacked authorization verification, allowing unauthenticated external callers to trigger notification distribution and consume API resources.
**Learning:** Functions executed asynchronously or via HTTP triggers still require explicit `Authorization` header validation against `SUPABASE_SERVICE_ROLE_KEY` or `auth.getUser` tokens, even when non-browser triggers are intended.
**Prevention:** Always enforce token validation at the top of edge function handlers before querying database resources or external services.
