## 2025-05-15 - Dynamic CSS Injection Sanitization in ChartStyle
**Vulnerability:** Attackers could inject arbitrary CSS selectors or breakout rules (HTML/CSS injection) inside the dangerouslySetInnerHTML-rendered style tag using malicious chart container IDs, config keys, or color values.
**Learning:** Recharts custom styles dynamically generated client-side inside a `<style>` tag can be a vector for CSS Injection if the theme config keys, IDs, or colors contain characters like `;`, `{`, `}`, `\`, or quotes.
**Prevention:** Always validate and sanitize dynamic identifiers, custom property names, and property values (by stripping characters like `;`, `{`, `}`, `[`, `]`, `\`, quotes, asterisks, and backticks) before injecting them into dangerouslySetInnerHTML CSS templates.
