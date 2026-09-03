# Sentinel Security Journal

## 2025-03-03 - System Prompt Injection & Payload Bloating in Coach Endpoint
**Vulnerability:** Unsanitized AI gateway request bodies allowed arbitrary message roles (e.g., injecting system messages to override instructions) and un-bounded message array lengths / string sizes, creating prompt injection and DoS resource exhaustion risks.
**Learning:** LLM edge functions must strictly enforce role whitelisting (`user` or `assistant`), cap message history lengths, and truncate individual string inputs before sending requests to upstream AI gateways.
**Prevention:** Always filter role types and apply length constraints on user/context payloads prior to constructing chat completion payloads.
