## 2025-05-14 - Robustly Sanitize Dynamic CSS in Charting Components
**Vulnerability:** CSS Injection via `dangerouslySetInnerHTML` in the `ChartStyle` component. Unsanitized `chartId`, configuration keys, and color values could be used to break out of CSS rules and inject malicious styles or potentially execute JavaScript in certain environments.
**Learning:** Dynamic style generation using `dangerouslySetInnerHTML` requires strict whitelist-based sanitization for all interpolated variables. Attribute selectors should also be quoted to prevent breakout if the ID contains spaces or special characters.
**Prevention:**
1. Sanitize IDs and keys using a whitelist regex (e.g., `/[^a-zA-Z0-9-_]/g`).
2. Sanitize color values by stripping characters that can terminate a CSS rule (`; { } \ < >`).
3. Always quote attribute selectors in generated CSS strings (e.g., `[data-chart="${id}"]`).
