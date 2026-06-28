# Sentinel Security Journal 🛡️

## 2025-05-22 - [Critical] Exposed Environment Variables and CSS Injection Risk
**Vulnerability:** The `.env` file containing Supabase project credentials was committed to the repository. Additionally, the `ChartStyle` component uses `dangerouslySetInnerHTML` to inject dynamic CSS without sanitizing the IDs, keys, or values.
**Learning:** Hardcoded or committed secrets are a common but critical oversight. Furthermore, dynamic CSS injection via `dangerouslySetInnerHTML` is a vector for XSS or CSS-based attacks if inputs (like IDs or configuration keys) are not strictly sanitized.
**Prevention:** Always include `.env` in `.gitignore` from the start and provide a `.env.example`. When injecting dynamic styles, strictly sanitize all variables to allow only safe characters.
