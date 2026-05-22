# Sentinel Security Journal

## 2026-05-22 - Fix CSS injection in Chart component
**Vulnerability:** The `ChartStyle` component used `dangerouslySetInnerHTML` to inject raw CSS strings constructed from user-provided or dynamic `id`, `key`, and `color` props. This could lead to CSS injection, allowing an attacker to breakout of the style block or inject malicious styles if these values were influenced by user input.
**Learning:** Even within a style block, unescaped dynamic content can be dangerous. Attackers can use characters like `}` to close the current rule and inject new ones. Quoting attribute selectors and sanitizing values against common CSS-breaking characters is essential for defense-in-depth.
**Prevention:** Always sanitize dynamic values injected into `dangerouslySetInnerHTML`. Use whitelists for identifiers (like `id`) and strip dangerous characters (`; { } \ < >`) from CSS property values and keys. Prefer quoted attribute selectors to prevent selector breakouts.
