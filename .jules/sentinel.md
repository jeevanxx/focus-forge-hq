# Sentinel Journal

## 2025-05-22 - [CRITICAL] Secrets in Git History
**Vulnerability:** The `.env` file containing Supabase credentials (including the publishable key and URL) was tracked by Git.
**Learning:** Even if the keys are "publishable", keeping them in version control makes rotation harder and exposes infrastructure details to anyone with repo access.
**Prevention:** Always add `.env` to `.gitignore` and provide a `.env.example` template at the start of a project.

## 2025-05-22 - [HIGH] CSS Injection in Recharts Wrapper
**Vulnerability:** The `ChartStyle` component in `chart.tsx` was injecting unsanitized `id`, `key`, and `color` values into a `<style>` tag via `dangerouslySetInnerHTML`.
**Learning:** Dynamic CSS generation is a common pattern in "headless" UI components but requires aggressive sanitization of IDs and values to prevent rule or declaration breakout.
**Prevention:** Sanitize all dynamic identifiers to a strict safe character set (alphanumeric, dashes, underscores) and block CSS-special characters (; { } [ ] " ' : < > \) in values. Always quote attribute selectors in generated CSS.
