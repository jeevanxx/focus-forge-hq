## 2026-03-30 - Server-side AI Coach Input Sanitization & Bounds

**Vulnerability:** Client-supplied conversation messages and context objects (tasks, habits) sent to the AI coach endpoint (`supabase/functions/coach/index.ts`) were not validated or length-bounded on the server side. An attacker or corrupted client state could inject arbitrary prompt roles (such as `system` or `developer` roles) or huge payload payloads (excessive tasks/habits array lengths and uncapped message lengths), leading to prompt injection / model behavior hijacking and potential Denial of Service (DoS) / resource exhaustion.

**Learning:** Client-side validation in components like `AssistantPanel.tsx` is insufficient for edge functions since external callers can invoke Supabase edge functions directly with arbitrary payloads. Edge functions must independently sanitize, trim, bound, and validate all inputs on the server side before forwarding them to third-party LLM APIs.

**Prevention:** Always sanitize, bound, and restrict input arrays and message content in edge functions. Strictly whitelist allowed roles (`user`, `assistant`) to prevent prompt injection role spoofing.
