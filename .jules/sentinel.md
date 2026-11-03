## 2025-05-20 - Dynamic Inline CSS Injection in Chart Components

**Vulnerability:** `ChartStyle` rendered dynamic CSS custom properties inside a `<style>` element using `dangerouslySetInnerHTML` without sanitizing component `id`s, `config` keys, or `color` strings. An attacker or untrusted config input could break out of the style tag to execute XSS, inject arbitrary CSS rules, or use `url(...)` constructs for outbound tracking/SSRF leaks.

**Learning:** Component libraries generating inline `<style>` tags dynamically from props must strictly sanitize all inputs before string interpolation into style content.

**Prevention:** Always filter out dangerous breakout characters (`;`, `{`, `}`, `[`, `]`, `"`, `'`, `<`, `>`, `\`) and block `url(...)` functions in CSS variable values, while restricting IDs and custom property keys to a strict alphanumeric whitelist (`/a-zA-Z0-9_-/`).
