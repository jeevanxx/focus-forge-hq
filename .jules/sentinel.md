## 2026-09-25 - Dynamic CSS Injection in Chart Component

**Vulnerability:** `ChartStyle` in `src/components/ui/chart.tsx` injected dynamic `id`, config `key`s, and `color` values into `<style dangerouslySetInnerHTML={{ __html: ... }} />` without input sanitization, enabling HTML breakout, CSS keylogging, and SSRF via `url()` tracking pixels.

**Learning:** Component properties like chart config keys or color values may originate from user-controlled inputs or API payloads. When dynamically constructing CSS style blocks, unescaped characters can alter selector structure or trigger unauthorized external GET requests.

**Prevention:** Use restrictive sanitization (`/[^a-zA-Z0-9_-]/g` for IDs and CSS variable names, and block `url()` / breakout characters for CSS color values) before inserting dynamic strings into `<style>` elements via `dangerouslySetInnerHTML`.
