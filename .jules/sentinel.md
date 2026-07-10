# Sentinel's Journal - Critical Security Learnings

## 2025-05-22 - [Critical] Exposed Secrets in Git
**Vulnerability:** The `.env` file containing Supabase credentials (URL and Publishable Key) was tracked by Git and not included in `.gitignore`.
**Learning:** Default project setups sometimes include `.env` in the initial commit or omit it from `.gitignore`, leading to accidental exposure of backend credentials.
**Prevention:** Always verify that `.env` and other secret-containing files are listed in `.gitignore` before the first commit. Use `git ls-files` to check if any sensitive files are already tracked.

## 2025-05-22 - [High] CSS Injection in Chart Component
**Vulnerability:** The `ChartStyle` component used `dangerouslySetInnerHTML` to inject dynamic CSS based on user-provided `id` and `config` keys without sanitization.
**Learning:** Even internal-looking IDs and configuration keys can be manipulated if they are exposed as component props. Using them directly in a `<style>` block allows an attacker to "break out" of the CSS rule and inject arbitrary CSS.
**Prevention:** Sanitize all dynamic values used in `dangerouslySetInnerHTML`. Use restrictive regex for IDs and keys, and quote attribute selectors (e.g., `[data-chart="${id}"]`) to prevent attribute breakout.
