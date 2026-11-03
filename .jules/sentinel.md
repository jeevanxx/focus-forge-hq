## 2025-05-22 - Dynamic CSS Injection in ChartStyle Component

**Vulnerability:** Dynamic custom property keys and chart IDs passed to the `<ChartStyle>` component were directly interpolated into a `<style>` block via `dangerouslySetInnerHTML`. An attacker could pass a malicious ID (e.g., `chart-id] } body { background: red; } /*`) or dynamic config key/color value to inject arbitrary CSS, leading to potential CSS-based keylogging, data exfiltration, or defacement.

**Learning:** This vulnerability existed because the default dynamic CSS generation pattern used by Recharts/Shadcn container wrappers didn't sanitize dynamic IDs and property keys, assuming they are always internally generated or safe. However, dynamic overrides or user-provided configurations can allow external input to taint these properties.

**Prevention:** Always quote attribute selectors (e.g., `[data-chart="${id}"]`) and aggressively sanitize dynamic IDs, property names, and property values before interpolating them into `<style>` elements inside React components. To avoid Fast Refresh linter warnings, keep sanitization helpers local/non-exported within the UI component file.
