## 2026-03-31 - Unauthenticated Edge Function Triggers
**Vulnerability:** The `overdue-push` edge function accepted requests from any source without inspecting or validating Authorization headers.
**Learning:** Edge functions using service role keys internally must still authenticate incoming callers to prevent unauthenticated execution of background jobs or resource exhaustion DoS.
**Prevention:** Always extract and validate Authorization tokens against SUPABASE_SERVICE_ROLE_KEY or user JWTs via auth.getUser in edge functions.
