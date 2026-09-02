## 2025-05-20 - CSS Injection Vulnerability in ChartStyle Dynamic Themes

**Vulnerability:** Dynamic properties (`id`, config `key`, and theme/color values) passed into `ChartContainer` and `ChartStyle` were interpolated directly into raw CSS within a `<style>` element rendered via `dangerouslySetInnerHTML` without input sanitization. Unsanitized strings could allow CSS rule context breakout and potential HTML tag termination / XSS.

**Learning:** `dangerouslySetInnerHTML` inside `<style>` blocks bypasses JSX auto-escaping mechanisms, making string interpolation vulnerable to CSS syntax breakouts and tracking pixel injection via CSS `url()` constructs. Character classes in flat ESLint environments also raise `no-useless-escape` warnings if characters like `[` are needlessly backslash-escaped inside `[...]`.

**Prevention:** Always sanitize dynamic inputs when building CSS rules for `dangerouslySetInnerHTML`. Use strict alphanumeric whitelist sanitizers for DOM IDs and CSS property keys, and strip dangerous breakout characters (`;`, `{`, `}`, `[`, `]`, `"`, `'`, `<`, `>`, `\`, `` ` ``) and `url()` expressions from raw CSS color strings.
