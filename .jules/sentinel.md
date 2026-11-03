
## 2026-06-06 - CSS Injection in Chart Component
**Vulnerability:** The ChartContainer component in shadcn/ui (chart.tsx) used dangerouslySetInnerHTML to inject a dynamic <style> tag. The id, config keys, and color values were not sanitized, allowing for CSS breakout and potentially arbitrary CSS injection.
**Learning:** Even internal utility components that generate styles dynamically can be an injection vector if they rely on props that can be influenced by external data. Quoting attribute selectors is not enough if the value itself can contain quotes and braces.
**Prevention:** Always sanitize any string being injected into dangerouslySetInnerHTML, even for CSS. Use strict white-lists for keys and IDs, and strip breakout characters (; { } \ < >) from property values. Use useMemo to ensure sanitization is performant and consistent.
