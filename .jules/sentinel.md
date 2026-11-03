## 2025-05-15 - CSS Injection in Dynamic Chart Styles

**Vulnerability:** The `ChartStyle` component used `dangerouslySetInnerHTML` to inject a `<style>` block containing unsanitized `id` and `config` values. This allowed an attacker to break out of the CSS selector or declaration and inject arbitrary CSS rules or even close the `<style>` tag.

**Learning:** Dynamic CSS generation in React components using `dangerouslySetInnerHTML` is a high-risk pattern. In this codebase, the `recharts` wrapper pattern for `shadcn/ui` charts was particularly vulnerable because it attempted to create per-instance CSS variables without sanitizing the instance ID or the configuration keys/values.

**Prevention:** Robustly sanitize any dynamic input used in CSS generation. IDs should be restricted to safe characters (`[a-zA-Z0-9-_]`) and quoted in selectors. CSS variable keys should be stripped of special characters, and values should be sanitized to prevent early termination of declarations (e.g., stripping `;`, `{`, `}`).
