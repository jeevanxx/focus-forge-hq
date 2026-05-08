## 2026-05-08 - Robust Sanitization for Dynamic CSS in React

**Vulnerability:** XSS and Style Injection via `dangerouslySetInnerHTML` within a `<style>` tag.
**Learning:** Using `dangerouslySetInnerHTML` for dynamic styling is common in Shadcn UI chart components. A simple regex to remove `</style>` tags is insufficient as it can be bypassed (e.g., via nested tags or alternative encodings). Furthermore, lack of sanitization for CSS selectors and property keys allows for "CSS injection," where an attacker can break out of the intended selector and apply styles globally.
**Prevention:**
1. **Tag Escaping:** Removing all `<` characters from the dynamic CSS string is a simple and robust way to ensure the `<style>` tag cannot be closed prematurely.
2. **Selector/Key Sanitization:** Always whitelist characters (e.g., `[a-zA-Z0-9_:-]`) for IDs, class names, and CSS variable keys used in dynamic styles. Support for colons is often necessary for React `useId()` compatibility.
3. **Value Sanitization:** Sanitize CSS property values to prevent injection of unexpected characters like `;` or `}` that could terminate a declaration or rule.
4. **Attribute Selectors:** Always quote attribute selector values (e.g., `[data-chart="..."]`) to ensure CSS syntax validity and defense-in-depth.
