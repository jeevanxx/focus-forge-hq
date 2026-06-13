## 2025-05-22 - CSS Injection Mitigation with Functional Integrity

**Vulnerability:** CSS Injection via `dangerouslySetInnerHTML` in dynamic styles within the `ChartStyle` component.

**Learning:** Sanitizing identifiers used in CSS selectors (e.g., `id.replace(/[^a-zA-Z0-9-_]/g, "")`) without applying the same sanitization to the corresponding DOM attribute (e.g., `data-chart`) leads to a functional regression where styles fail to apply because of selector mismatch.

**Prevention:** Centralize identifier sanitization at the source (e.g., in `ChartContainer`) so that both the DOM element and the style injection logic use the exact same safe string. Always use quoted attribute selectors in CSS to provide an additional layer of defense.
