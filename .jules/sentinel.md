## 2026-08-31 - CSS Injection & SSRF Protection in Dynamic Chart Styling
**Vulnerability:** Unsanitized user/config input (`id`, `key`, `color`) interpolated into raw CSS blocks via `dangerouslySetInnerHTML` in `<style>` tags within `ChartContainer`/`ChartStyle`.
**Learning:** React components that generate CSS dynamically from object keys or theme configurations are vulnerable to CSS rule injection and SSRF/tracking pixel leaks via `url(...)` constructs if inputs are not explicitly restricted.
**Prevention:** Use whitelist filtering for CSS custom property keys (`/^[a-zA-Z0-9_-]+$/`) and DOM IDs, and sanitize CSS color values by banning `url()` and CSS breakout characters (`"`, `'`, `;`, `{`, `}`, `<`, `>`, `\`).
