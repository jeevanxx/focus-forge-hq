# Sentinel's Journal

## 2026-10-23 - CSS and HTML Injection in Dynamic ChartStyle
**Vulnerability:** The `ChartStyle` component in `src/components/ui/chart.tsx` directly interpolated chart container IDs, configuration object keys, and custom color properties into a dynamic `<style dangerouslySetInnerHTML={{ ... }} />` block without sanitization. An attacker or untrusted dynamic configuration could inject arbitrary CSS selectors, rules, or break out of `<style>` tags into XSS.
**Learning:** Dynamic CSS styling using `dangerouslySetInnerHTML` bypasses React's built-in JSX escaping. Semicolons, curly braces, quotes, backslashes, angle brackets, and CSS `url()` expressions allow attackers to break out of rules, perform tracking pixel SSRF/data exfiltration, or inject HTML.
**Prevention:** Strictly sanitize chart IDs and configuration keys using restrictive alphanumeric character classes (`/[^a-zA-Z0-9_-]/g`), and sanitize color strings by blocking CSS breakout characters (`/[;{}[\]"'<>\\]/g`) and CSS `url()` constructs while preserving valid color function syntax like `hsl()` and `var()`.
