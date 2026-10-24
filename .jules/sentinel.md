# Sentinel Security Journal

## 2025-05-20 - Chart Component Dynamic CSS Injection Prevention
**Vulnerability:** `ChartContainer` rendered raw string configurations (`id`, `key`, `color`) inside `<style>` tags via `dangerouslySetInnerHTML`, creating a risk of CSS rule injection breakouts and tracking pixel leaks (`url()`).
**Learning:** In Shadcn/Recharts wrapper components, dynamic theme values and custom identifiers generated at runtime must be strictly sanitized before direct interpolation into raw CSS blocks.
**Prevention:** Always restrict custom property names (`keys`) and DOM selectors (`ids`) to alphanumeric/dash/underscore characters (`/[^a-zA-Z0-9_-]/g`), and strip CSS syntax characters (`;`, `{`, `}`, `[`, `]`, `"`, `'`, `<`, `>`, `\`, `:`) and `url(...)` constructs from color values.
