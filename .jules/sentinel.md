## 2025-05-22 - CSS Injection via dangerouslySetInnerHTML in Chart Components
**Vulnerability:** User-controlled props (id, config keys, and color values) were directly injected into a `<style>` tag using `dangerouslySetInnerHTML`.
**Learning:** Even internal utility components like UI charts can be an injection vector if they dynamically generate CSS. Attribute selectors should be quoted (`[data-chart="id"]`) to prevent breakout even if ID sanitization fails.
**Prevention:** Always sanitize any string before injecting it into `dangerouslySetInnerHTML`. For CSS variables, strictly allowlist alphanumeric and basic color characters, blocking rule-breaking characters like `; { } [ ] ` and colons where appropriate.

## 2025-05-22 - Credential Exposure in Git
**Vulnerability:** The `.env` file containing Supabase keys was committed to the repository.
**Learning:** Standard development workflows sometimes accidentally include `.env` files if `.gitignore` is not set up early.
**Prevention:** Add `.env` to `.gitignore` immediately upon project creation and provide a `.env.example` for other developers. Use `git rm --cached .env` to remove it from history/tracking if already committed.
