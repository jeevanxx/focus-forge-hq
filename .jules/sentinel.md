## 2025-05-22 - [CSS Injection in Chart Component]
**Vulnerability:** The `ChartStyle` component in `src/components/ui/chart.tsx` uses `dangerouslySetInnerHTML` to inject dynamic CSS styles. It fails to sanitize the `id` prop, configuration keys, and color values. An attacker or malicious configuration could provide values like `] { background: url(javascript:...) }` to break out of the intended CSS block and execute arbitrary CSS or potentially JS (in older browsers/specific contexts) or perform data exfiltration via CSS.

**Learning:** When generating dynamic CSS within a component using `dangerouslySetInnerHTML`, every variable interpolated into the CSS string is a potential injection point. Using `useId()` provides a safe default, but user-provided `id` props or configuration data must be strictly validated/sanitized.

**Prevention:**
1. Sanitize IDs to allow only alphanumeric characters, dashes, underscores, colons, and dots.
2. Whitelist configuration keys to alphanumeric characters, dashes, and underscores.
3. Sanitize color values by removing dangerous CSS characters like `;`, `{`, `}`, `<`, `>`, `\`, and quotes.
4. Always use quoted attribute selectors (e.g., `[data-chart="${id}"]`) to prevent selector-level breakouts.
