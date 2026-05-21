# Sentinel Security Journal 🛡️

This journal documents critical security learnings, vulnerabilities found, and prevention strategies for Focus Forge.

## 2025-05-22 - CSS Injection in Chart Component
**Vulnerability:** Unsanitized `id` and `color` values in `ChartStyle` were injected directly into a `<style>` tag using `dangerouslySetInnerHTML`.
**Learning:** Even internal components like charts can be vectors for XSS or CSS injection if they take user-controlled or dynamically generated strings and place them into sensitive DOM locations.
**Prevention:** Always sanitize dynamic values before using them in `dangerouslySetInnerHTML`. Use whitelists for identifiers and blacklists/escaping for values.

## 2026-05-19 - CSS Selector Breakout in Chart Component
**Vulnerability:** Missing quotes around attribute selectors in generated CSS allowed breaking out of the intended scope.
**Learning:** CSS selectors constructed with string concatenation are vulnerable to breakout similar to SQL injection.
**Prevention:** Quote attribute values and sanitize the values used within them.
