# Sentinel Security Journal

## 2025-05-22 - CSS Injection in Chart Component
**Vulnerability:** Dynamic CSS generation via `dangerouslySetInnerHTML` in the `ChartStyle` component (`chart.tsx`) allowed for CSS injection. Unsanitized IDs and property names/values could be used to break out of the style block or inject malicious CSS rules.
**Learning:** Using `dangerouslySetInnerHTML` for `<style>` blocks is risky if any part of the CSS is derived from props. Attribute selectors like `[data-chart=${id}]` should always be quoted and the `id` sanitized to prevent selector breakout.
**Prevention:** Strictly sanitize all dynamic inputs used in CSS generation. Use alphanumeric-only IDs and block characters like `; { } [ ] " ' :` in CSS variable values. Always quote attribute selectors in CSS.
