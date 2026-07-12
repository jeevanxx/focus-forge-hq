## 2025-05-22 - [HIGH] CSS Injection in ChartContainer
**Vulnerability:** The `ChartStyle` component in `src/components/ui/chart.tsx` injected user-provided `id`, configuration keys, and color values directly into a `<style>` tag using `dangerouslySetInnerHTML`.
**Learning:** Even internal-looking IDs can be overridden via props, and configuration keys used as CSS custom property names can break out of the CSS rule if they contain characters like `;` or `}`. Always sanitize dynamic content before injecting it into CSS or HTML.
**Prevention:**
1. Sanitize IDs and CSS variable keys to a restrictive set (alphanumeric, dashes, underscores).
2. Sanitize CSS variable values to block breakout characters like `;`, `{`, `}`, `"`, `<`, `>`, etc.
3. Use quoted attribute selectors (e.g., `[data-chart="${id}"]`) to prevent attribute breakout even if the ID contains spaces or special characters.
