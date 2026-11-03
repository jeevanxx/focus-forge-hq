## 2025-02-23 - Dynamic CSS Injection in ChartStyle Components

**Vulnerability:** The dynamic rendering of custom CSS variables via `<style dangerouslySetInnerHTML>` in React components (such as Shadcn's `ChartStyle` / `ChartContainer`) accepts user-defined or runtime-sourced container IDs, configuration keys, and color values. Without strict validation, a maliciously crafted payload can close the CSS block (`}`) and style block (`</style>`), leading to Cross-Site Scripting (XSS) or Arbitrary CSS Injection.

**Learning:** This risk exists because developer-defined keys and styling configs are trusted implicitly. Traditional XSS filters or HTML escaping libraries can break modern, valid CSS color definitions (e.g., `hsl(...)`, `rgba(...)`, `var(...)`). Therefore, standard escaping cannot be blindly applied; a tailored sanitizer is required to specifically target CSS breakout characters while maintaining CSS-compliance.

**Prevention:** Ensure that dynamic inline `<style>` tags are secured with Defense-in-Depth sanitization helpers:
1. Container/Selector IDs must be strictly alphanumeric (plus dashes and underscores).
2. Configuration keys used as CSS custom property keys must be stripped of any characters except `[a-zA-Z0-9_-]`.
3. Color values must filter out critical breakout characters (such as `; { } [ ] " ' < > \` `` ` ``) while preserving parentheses, commas, percentages, and hashes to support safe CSS color formats.
