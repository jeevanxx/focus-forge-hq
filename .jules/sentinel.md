## 2025-05-15 - [CSS Injection in Chart Component]
**Vulnerability:** The `ChartStyle` component used `dangerouslySetInnerHTML` to inject dynamic CSS into a `<style>` tag. Unsanitized `id` and `config` keys/colors could be exploited to inject arbitrary CSS or escape the style tag for XSS.
**Learning:** Sanitizing only the CSS generator is insufficient if the target DOM element still uses the original unsanitized value, leading to broken styles. Sanitization must be consistent across the attribute and the selector. Standard "strip `<`" sanitization is also insufficient for CSS values, as curly braces and semicolons can still be used for injection.
**Prevention:**
1. Sanitize IDs at the source (e.g., using `useMemo`) so that both `data-` attributes and CSS selectors use the same safe value.
2. For CSS values, block `;`, `{`, `}`, and `\` in addition to `<` to prevent escaping the property or the rule.
3. Use whitelists for keys and selectors (e.g., `/[^a-zA-Z0-9-_:]/g`).
