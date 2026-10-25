# Sentinel Security Journal

## 2026-10-25 - Unauthenticated Edge Function Trigger Prevention
**Vulnerability:** The `overdue-push` edge function allowed unauthenticated callers to execute background push notifications and database queries without verifying credentials.
**Learning:** Background or cron-triggered Edge Functions must explicitly validate `Authorization` headers against `SUPABASE_SERVICE_ROLE_KEY` or user JWT tokens, as publicly exposed endpoint routes are accessible over HTTP without automatic auth middleware.
**Prevention:** Always extract and enforce token authorization checks in edge functions before executing sensitive operations or database queries.
