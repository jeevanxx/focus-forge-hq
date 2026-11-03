## 2025-05-22 - CSS Injection in dynamic style components
**Vulnerability:** XSS/CSS Injection in `ChartStyle` via `dangerouslySetInnerHTML`.
**Learning:** Sanitizing identifiers in CSS variables requires balancing security with functional needs; for instance, allowing dots in keys is necessary for some data structures, while blocking breakout characters like `; { } [ ] " ' : < > \\ ` is critical.
**Prevention:** Always sanitize any dynamic content injected into `<style>` tags or `dangerouslySetInnerHTML`. Use allow-lists for identifiers and deny-lists for potential breakout characters.
