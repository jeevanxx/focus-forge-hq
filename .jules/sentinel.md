## 2025-05-15 - CSS Injection in Chart Component
**Vulnerability:** The `ChartStyle` component in `src/components/ui/chart.tsx` was vulnerable to CSS injection because it used `dangerouslySetInnerHTML` to inject unsanitized values (chart ID, variable keys, and colors) into a `<style>` block.
**Learning:** Even internal UI components can be vectors for injection if they dynamically generate CSS. Quoted attribute selectors and value sanitization are essential for defense in depth.
**Prevention:** Always sanitize any dynamic value that will be placed inside a `<style>` tag or used in a CSS selector. Use whitelists where possible and escape or remove special characters like `;`, `{`, `}`, `<`, `>`, and `\`.
