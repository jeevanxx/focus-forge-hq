## 2026-10-10 - Edge Function Authorization & Vitest Submodule Testing

**Vulnerability:**
The `overdue-push` Supabase edge function was accessible without any authentication or authorization verification. Any external client sending HTTP requests to the edge function URL could trigger notification dispatches and database queries, posing a resource exhaustion DoS vulnerability and spam risk.

**Learning:**
Supabase Edge Functions in Deno often import packages using `npm:` specifiers (e.g. `npm:@supabase/supabase-js@2`), which prevents Vitest in the Vite/Node environment from directly importing the function entry file (`index.ts`).

**Prevention:**
Extract pure business/authorization logic (like `isRequestAuthorized`) into standard submodules (e.g., `auth.ts`) that do not use `npm:` import specifiers. This allows `index.ts` to use Deno imports at runtime while Vitest cleanly imports and tests the authorization logic in CI/CD suites.
