## 2026-05-19 - CSS Injection in Chart Component
**Vulnerability:** The `ChartStyle` component in `src/components/ui/chart.tsx` was vulnerable to CSS injection. It used `dangerouslySetInnerHTML` to inject dynamic CSS rules based on the `chartId` and `config` object without sufficient sanitization. A malicious `id` or `config` key/color could break out of the CSS selector and inject arbitrary CSS.
**Learning:** Even within a trusted component library like `shadcn/ui`, dynamic CSS generation using `dangerouslySetInnerHTML` requires strict input validation and sanitization. The use of unquoted attribute selectors `[data-chart=${id}]` further exacerbated the risk.
**Prevention:**
- Whitelist characters for IDs (e.g., `[a-zA-Z0-9-_]`) and sanitize them at the source using `useMemo`.
- Sanitize dynamic CSS keys and values by removing sensitive characters like `; { } < > \`.
- Always use quoted attribute selectors in CSS (e.g., `[data-chart="${id}"]`) to prevent selector breakout.
