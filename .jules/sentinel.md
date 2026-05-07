## 2025-05-15 - [CSS Injection Prevention in Shadcn Charts]
**Vulnerability:** XSS via `<style>` tag breakout in components using `dangerouslySetInnerHTML`.
**Learning:** Shadcn UI's `chart.tsx` uses `dangerouslySetInnerHTML` to inject dynamic CSS variables. If `ChartConfig` keys or color values are user-controlled, they could potentially break out of the `<style>` tag using `</style><script>...</script>`.
**Prevention:** Sanitize the generated CSS string by removing any occurrences of style tags before injecting it into the DOM.
