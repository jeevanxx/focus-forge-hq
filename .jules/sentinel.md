## 2026-10-18 - CSS and HTML Injection in Chart Component

**Vulnerability:** Dynamic properties (`id`, config `key`, and theme/color values) in `ChartContainer` and `ChartStyle` were interpolated directly into raw CSS within a `<style dangerouslySetInnerHTML={{ __html: ... }} />` tag without sanitization. An attacker or unsanitized external configuration could break out of CSS rules, inject arbitrary HTML/CSS, or make unauthorized external requests via CSS `url()` expressions.
**Learning:** In UI libraries with dynamic stylesheet injection (like shadcn/recharts `ChartStyle`), CSS identifiers and custom properties can be exploited for CSS injection or tracking pixel exfiltration if values are not constrained.
**Prevention:** Strictly sanitize CSS selector IDs and CSS custom variable names using a whitelist (`/[^a-zA-Z0-9_-]/g`), strip CSS delimiter/breakout characters (`;{}[\]"'<>\`), and block CSS `url()` expressions.
