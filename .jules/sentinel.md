## 2025-05-22 - [Critical] Secret Exposure via Tracked .env File
**Vulnerability:** The `.env` file containing Supabase project URL and keys was tracked in the Git repository history and not included in `.gitignore`.
**Learning:** Even if a `.env` file exists locally, it's crucial to verify if it is being tracked by Git. Automated tools or misconfiguration can lead to sensitive credentials being committed, exposing the infrastructure to unauthorized access.
**Prevention:** Always verify `.gitignore` contains `.env` and other secret-bearing files. Use `git ls-files` to audit for accidentally tracked secrets. Implement pre-commit hooks to scan for secrets.

## 2025-05-22 - [High] CSS Injection in Dynamic Chart Styles
**Vulnerability:** The `ChartStyle` component used `dangerouslySetInnerHTML` to inject CSS variables derived from `id` and `config` keys without sanitization.
**Learning:** User-controllable props (even those that seem internal like `id`) can be exploited to break out of CSS blocks and inject arbitrary styles or potentially execute XSS if they can influence the document structure.
**Prevention:** Always sanitize dynamic inputs injected into `<style>` tags or any `dangerouslySetInnerHTML` block. Use restrictive regex (alphanumeric/dashes) for IDs and keys, and block structural CSS characters (`;{}[]`) for values.
