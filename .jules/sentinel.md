# Sentinel Journal

## 2026-03-31 - Unauthenticated Edge Function Triggering

**Vulnerability:** The `overdue-push` Supabase Edge Function executed push notification processing without checking the `Authorization` header, allowing unauthenticated callers to trigger notifications and consume serverless CPU time / webpush API resources.

**Learning:** Edge functions using service role keys internally must still enforce access control on incoming requests, otherwise anyone with the public function endpoint URL can invoke it anonymously.

**Prevention:** Always validate `Authorization` headers against expected service role keys or user JWTs (`db.auth.getUser`) at the entry point of every Edge Function before performing any business logic or DB operations.
