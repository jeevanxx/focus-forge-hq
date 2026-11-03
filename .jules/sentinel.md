## 2025-05-22 - CSS Injection in Chart Component
**Vulnerability:** The `ChartStyle` component in `src/components/ui/chart.tsx` used `dangerouslySetInnerHTML` to inject a `<style>` tag with unsanitized user-provided IDs, configuration keys, and color values.
**Learning:** Dynamic CSS generation in React using `dangerouslySetInnerHTML` is a high-risk pattern. Malicious or malformed inputs can break out of CSS rules to inject arbitrary styles.
**Prevention:** Always sanitize inputs used in CSS templates. Use alphanumeric whitelisting for IDs and keys, strip rule breakout characters (`;{}[]"':`) from values, and wrap attribute selectors in quotes.
