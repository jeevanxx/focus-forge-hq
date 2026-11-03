## 2026-03-31 - CSS Injection and SSRF in Chart Component
**Vulnerability:** `ChartStyle` rendered dynamic `id`, `key` (CSS variable names), and `color` values into an inline `<style>` block via `dangerouslySetInnerHTML` without input sanitization, allowing CSS rule breakouts and tracking pixel/SSRF leaks via `url(...)`.
**Learning:** Unsanitized user or theme input inside dynamic `<style>` tags allows attacker payloads to escape CSS blocks (`} body { ... }`) or inject external image requests (`url(...)`).
**Prevention:** Sanitize CSS IDs and property keys to strict alphanumeric/dash characters (`/[^a-zA-Z0-9_-]/g`), strip breakout syntax characters (`[{}[\]"'<>\\]`), and block `url(...)` constructs in dynamic CSS variable values.
