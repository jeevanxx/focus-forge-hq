# Sentinel Security Journal

## 2026-09-16 - Dynamic CSS Injection Sanitization in Chart Components
**Vulnerability:** Unsanitized chart `id`, `config` keys, and `color` properties injected directly into `<style>` tags via `dangerouslySetInnerHTML` in `src/components/ui/chart.tsx`.
**Learning:** React component `<style>` elements rendered via `dangerouslySetInnerHTML` allow untrusted string properties to break out of CSS rules, execute scripts, or trigger SSRF/tracking requests via `url()`.
**Prevention:** Always sanitize dynamic CSS identifiers (`/[^a-zA-Z0-9_-]/g`), strip breakout characters (`[;{}[\]"'<>`\\]`), and reject `url()` constructs before injecting dynamic strings into style blocks.
