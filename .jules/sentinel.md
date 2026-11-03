## 2025-05-22 - [HIGH] CSS Injection in Chart Components
**Vulnerability:** The `ChartStyle` component was injecting unsanitized `id`, `config` keys, and `color` values directly into a `<style>` tag via `dangerouslySetInnerHTML`.
**Learning:** Even when using "standard" UI components like those from shadcn/ui, dynamic style generation can introduce injection vectors if props are not strictly validated or sanitized before being placed in a sensitive context like `dangerouslySetInnerHTML`.
**Prevention:** Always sanitize any dynamic data that is interpolated into CSS strings. Use restrictive regular expressions to allow only safe characters (e.g., alphanumeric, dashes, underscores for IDs).
