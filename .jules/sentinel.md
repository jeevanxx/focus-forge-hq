## 2025-05-18 - Sanitizing Dynamic CSS Inputs in Chart Component

**Vulnerability:** Unsanitized user inputs (`id`, `config` keys, and `color` values) injected directly into `<style dangerouslySetInnerHTML=...>` in `src/components/ui/chart.tsx` enabled CSS Injection, HTML breakout, and SSRF/tracking pixel leaks via `url()`.

**Learning:** Recharts wrapper components using dynamic CSS variables inside `<style>` blocks can be exploited if keys or colors contain breakout characters or `url(...)` resources. To maintain Fast Refresh in UI component files, sanitization functions must remain internal helpers without being exported.

**Prevention:** Always sanitize IDs and CSS variable names with `/[^a-zA-Z0-9_-]/g`, filter out `url()` constructs to prevent SSRF/tracking pixel leaks, and strip critical CSS/HTML breakout characters (`[;{}[\]"'<>\\]`) before interpolating values into dynamic `<style>` elements.
