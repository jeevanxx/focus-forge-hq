## 2025-05-22 - CSS Injection in Chart Component

**Vulnerability:** The shadcn/ui Chart component injected dynamic CSS into a `<style>` tag using `dangerouslySetInnerHTML` without sanitizing the `id` or the `config` values. This allowed for CSS injection which could be used to break out of the intended style block and inject arbitrary CSS.

**Learning:** When generating CSS dynamically in React using `dangerouslySetInnerHTML`, even internal-sounding IDs or configuration objects must be treated as untrusted if they can be influenced by props. Standardizing sanitization at the component level is better than relying on callers.

**Prevention:**
1. Use `useMemo` to sanitize IDs against a strict whitelist (e.g., `/[^a-zA-Z0-9-_]/g`).
2. Strip characters like `;`, `{`, `}`, `<`, `>`, and `\` from CSS variable names and values.
3. Always wrap attribute selectors in quotes (e.g., `[data-chart="${id}"]`) to prevent selector breakout.
