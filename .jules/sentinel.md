## 2026-09-30 - Dynamic CSS Variable Injection in Chart Component

**Vulnerability:** Unsanitized chart IDs, configuration keys, and color strings were directly interpolated into a `<style>` block rendered with `dangerouslySetInnerHTML` in `src/components/ui/chart.tsx`, allowing CSS rule breakout, HTML attribute selector injection, and potential SSRF/tracking pixel leaks via CSS `url()` values.

**Learning:** UI component generators (like Shadcn UI) sometimes render dynamic `<style>` tags with custom CSS variable names (`--color-${key}`) and selectors (`[data-chart=${id}]`). If `id`, `key`, or `color` contain user-influenced inputs or dynamic config, unescaped characters can close selectors or introduce arbitrary CSS rules and tracking requests.

**Prevention:** Always sanitize dynamic identifiers and variable keys using strict character allowlists (`/[^a-zA-Z0-9_-]/g`), strip CSS rule breakout characters (`[;{}"'<>\\]`) from color values, and explicitly block `url()` constructs.
