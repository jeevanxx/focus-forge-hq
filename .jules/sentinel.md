## 2026-03-01 - Preventing XSS and CSS Injection in React Chart Style Components
**Vulnerability:** In `src/components/ui/chart.tsx`, the `ChartStyle` component directly injected the chart `id`, custom configuration `keys`, and `color` values into a `<style>` block using `dangerouslySetInnerHTML` without any sanitization. This allowed attackers to perform CSS injection (breaking out of styling contexts to modify page layout or make unauthorized outbound requests using `url()`) or XSS (closing `<style>` tag and injecting `<script>` tags).
**Learning:** The vulnerability existed because the default Shadcn Chart template relies on dynamic CSS custom properties generated inside `<style dangerouslySetInnerHTML={{ __html: ... }}`. Since the properties are generated based on user-supplied or database-stored config objects, they become highly vulnerable if the config keys, colors, or chart IDs are not strictly sanitized.
**Prevention:** Always sanitize dynamic identifiers, CSS variable keys, and variable color values before rendering them inside a `<style>` tag. Specifically:
1. Chart `id` and configuration `keys` must strictly keep only alphanumeric, dashes, and underscores (`[^a-zA-Z0-9_-]`).
2. CSS `color` values must filter out critical breakout characters (such as `;`, `{`, `}`, `[`, `]`, `"`, `'`, `<`, `>`, `` ` ``).
3. Block external asset retrieval vectors like `url(...)` in color definitions to mitigate SSRF and tracking pixel risks.
4. Ensure helper functions are not exported from UI component files to comply with React Fast Refresh linting constraints.
