## 2026-09-05 - CSS/HTML Injection in Chart Style Component

**Vulnerability:** Unsanitized dynamic `id`, configuration keys, and color values were passed into `dangerouslySetInnerHTML` within `ChartStyle` (`src/components/ui/chart.tsx`), allowing CSS selector breakout, HTML injection, and data exfiltration via `url()` constructs.

**Learning:** Component primitives that generate dynamic CSS string templates using `dangerouslySetInnerHTML` must sanitize all interpolated values. Unescaped quotes, brackets, or semicolons allow breaking out of CSS rules, while `url()` constructs enable unauthorized external tracking/SSRF calls.

**Prevention:** Always sanitize IDs, keys, and CSS color strings using strict character whitelists (`/[^a-zA-Z0-9_-]/g`) and strip critical breakout characters and `url(...)` patterns before rendering dynamic `<style>` blocks.
