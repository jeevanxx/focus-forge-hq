## 2026-10-31 - Dynamic CSS and SSRF Injection via Chart Component

**Vulnerability:** In `src/components/ui/chart.tsx`, `ChartStyle` used `dangerouslySetInnerHTML` to inject dynamic styles into a `<style>` block without sanitizing `id`, `config` keys, or color values. Malicious attributes could escape CSS selectors, break out of property definitions, or initiate unauthorized outbound requests (SSRF / tracking pixel exfiltration) via CSS `url()` declarations.
**Learning:** React's JSX attribute escaping does not protect against CSS syntax breakouts when constructing raw stylesheets inside `dangerouslySetInnerHTML`. Furthermore, unsanitized color strings can reference external images with `url(...)`, creating privacy leaks and server-side request forgery risks.
**Prevention:**
1. Sanitize IDs and selector identifiers using strict whitelists (`/[^a-zA-Z0-9_-]/g`).
2. Synchronize sanitization between DOM data attributes (e.g. `data-chart`) and the stylesheet selector.
3. Strip CSS breakout characters (`; { } [ ] " ' < > \`) from dynamic values.
4. Block external resource references by rejecting values containing `url()`.
