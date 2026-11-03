## 2026-09-07 - Dynamic CSS Injection in Chart Component Style Generator
**Vulnerability:** The `ChartStyle` component interpolated unsanitized `id`, `config` keys, and `color` properties directly into a `<style>` element via `dangerouslySetInnerHTML`, allowing potential CSS rule breakouts, HTML tag termination (`</style><script>...`), and SSRF/tracking pixel leaks via `url()` constructs.
**Learning:** Dynamic CSS rule generation in React components using `dangerouslySetInnerHTML` requires strict input sanitization rather than assuming component props are safe or static.
**Prevention:** Always sanitize dynamic identifiers (`/[^a-zA-Z0-9_-]/g`) and CSS property values (strip breakout characters `;{}[\]"'<>\` and block `url()`) before injecting them into raw CSS string templates.
