# Sentinel Security Journal

## 2026-07-27 - ChartStyle CSS Injection and DOM Breakout
**Vulnerability:** The standard shadcn `<ChartStyle>` component interpolated dynamic `id`, `key`, and theme `color` values directly inside a `<style>` element using `dangerouslySetInnerHTML`. Malicious inputs with breakout characters (e.g., quotes, braces, semicolons) could injection arbitrary CSS rules or breakout of the style tag to run arbitrary HTML/JS.
**Learning:** React component frameworks that generate dynamic stylesheets are highly susceptible to CSS and HTML injection if styling variables are not carefully sanitized prior to interpolation.
**Prevention:** Always sanitize dynamic identifiers and values used inside raw HTML or stylesheets. Use strict whitelists for identifier characters (`/[^a-zA-Z0-9_-]/g`) and strip dangerous breakout characters (`/[;{}[\]"<>'\\]/g`) from CSS values while preserving parentheses for modern safe color formats like `hsl()` and `var()`. Keep these sanitizers local/private inside components files to avoid triggering React Fast Refresh warnings.
