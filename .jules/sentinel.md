## 2025-05-18 - Dynamic CSS Variable Injection in Chart Component
**Vulnerability:** In `src/components/ui/chart.tsx`, user-controlled chart IDs, theme keys, and color strings were interpolated directly into a `<style>` element using `dangerouslySetInnerHTML` without sanitization, allowing CSS injection, HTML breakout/XSS, and tracking pixel/SSRF leaks via `url()` payloads.
**Learning:** React UI components like Recharts wrappers that construct dynamic CSS variables via `dangerouslySetInnerHTML` bypass standard JSX attribute auto-escaping.
**Prevention:** Always sanitize dynamic IDs, custom property keys, and CSS values before embedding them inside style tags, and strictly disallow `url()` constructs in dynamic CSS inputs.
