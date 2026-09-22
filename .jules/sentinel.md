## 2026-09-10 - Edge Function Prompt Injection & Payload Bloating

**Vulnerability:** The AI Coach edge function (`supabase/functions/coach/index.ts`) accepted raw, unvalidated `messages` and `context` payloads from client requests, forwarding them directly to the AI model completions API. An attacker could inject `{ role: "system", content: "..." }` to override system instructions or send arbitrarily large messages/context arrays to exhaust API rate limits and credits.

**Learning:** Client-side input components (`AssistantPanel.tsx`) constructed payloads without strictly validating message roles or bounding array/string sizes. Because Edge Functions operate as public HTTP endpoints, client-side assumptions cannot guarantee payload safety.

**Prevention:** Always perform strict server-side schema sanitization in Edge Functions before forwarding inputs to external AI gateways or services. Restrict message roles to a safe whitelist (`user` | `assistant`), cap character lengths, and bound array lengths.
