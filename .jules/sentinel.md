## 2025-05-22 - Secret Exposure and CSS Injection

**Vulnerability:**
1. A `.env` file containing Supabase credentials (URL and Publishable Key) was tracked by Git, exposing secrets in the repository history.
2. The `ChartStyle` component used `dangerouslySetInnerHTML` to inject dynamic CSS styles without proper sanitization of the `id`, `config` keys, or `color` values, allowing for potential CSS injection.

**Learning:**
1. Secrets can be accidentally committed if `.gitignore` is not correctly configured from the start or if files are added to Git before being ignored.
2. Even "safe" looking data like CSS colors or chart IDs can be vectors for injection when using `dangerouslySetInnerHTML`. Always treat any dynamic input as untrusted when using raw HTML/CSS injection.
3. Inconsistent environment variable naming across different client initializations can lead to silent failures or hard-to-debug connection issues.

**Prevention:**
1. Use a standard `.gitignore` template that includes `.env` files by default.
2. Implement strict sanitization helpers for any data used in `dangerouslySetInnerHTML`. Prefer allow-lists for characters (e.g., alphanumeric only for IDs) and block-lists for breakout characters (e.g., `;`, `{`, `}`, `[` for CSS properties).
3. Centralize configuration and environment variable access to ensure consistency across the application.
