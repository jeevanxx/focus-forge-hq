## 2025-05-22 - CSS Injection in Chart component
**Vulnerability:** The `ChartStyle` component used `dangerouslySetInnerHTML` to inject CSS styles into the page. The `id` prop and keys/values from the `config` object were used directly in the CSS string without sanitization, allowing an attacker to break out of the CSS selector or block and inject arbitrary CSS.
**Learning:** Even when using `dangerouslySetInnerHTML` for seemingly "safe" content like CSS variables, any user-controlled or dynamically generated input must be strictly sanitized. In CSS context, characters like `;`, `{`, `}`, and `"` can be used to terminate rules and start new ones.
**Prevention:**
- Sanitize IDs to a safe alphanumeric set plus necessary characters (like `:` for `useId`).
- Whitelist characters for CSS variable names (keys).
- Strip rule-breaking characters (`;`, `{`, `}`, etc.) from color values.
- Use quoted attribute selectors (`[data-chart="${safeId}"]`) instead of unquoted ones to further prevent breakout.
