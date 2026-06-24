## 2025-05-22 - CSS Injection in Chart Component
**Vulnerability:** Unsanitized dynamic IDs and values were being injected into a `<style>` tag via `dangerouslySetInnerHTML` in `src/components/ui/chart.tsx`.
**Learning:** Dynamic CSS generation via `dangerouslySetInnerHTML` requires aggressive sanitization of IDs, keys, and values to prevent CSS rule and declaration injection. Unquoted attribute selectors in generated CSS are particularly vulnerable to attribute breakout.
**Prevention:** Sanitize all dynamic inputs used in CSS. IDs should be restricted to alphanumeric characters, dashes, and underscores. CSS values must block characters like `; { } [ ] " ' : < > \`. Always use quoted attribute selectors (e.g., `[data-chart="${id}"]`).
