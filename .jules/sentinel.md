## 2025-05-22 - `.env` exposure in Git
**Vulnerability:** The `.env` file containing Supabase credentials was tracked by Git and missing from `.gitignore`.
**Learning:** Developers may accidentally commit `.env` files even if they contain "publishable" keys, which can lead to the exposure of more sensitive secrets later.
**Prevention:** Always untrack `.env` files using `git rm --cached` and explicitly add them to `.gitignore`. Provide a `.env.example` template to facilitate local setup without risking secret exposure.
