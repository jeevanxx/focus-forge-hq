# Sentinel's Journal

## 2026-08-05 - CSS and HTML Injection in Chart Components
**Vulnerability:** `ChartContainer` and `ChartStyle` interpolated unescaped configuration keys, colors, and container IDs directly into `<style dangerouslySetInnerHTML>` blocks, allowing CSS injection, selector breakout, HTML tag injection (via `</style><script>`), and SSRF/tracking pixel leaks via `url(...)`.
**Learning:** Dynamic CSS generation via inline `<style>` tags in React components bypasses JSX escaping and requires strict character sanitization of IDs, CSS custom property keys, and color values.
**Prevention:** Whitelist alphanumeric, underscore, and hyphen characters for IDs and property keys (`/[^a-zA-Z0-9_-]/g`), and strictly strip breakout characters (`;{}[]"'<>\`) as well as `url()` patterns from color inputs.
