## 2025-05-22 - Exposed Secrets in .env File
**Vulnerability:** Critical Supabase credentials (URL, Project ID, and Publishable Key) were hardcoded in a committed `.env` file.
**Learning:** Even if a file is named `.env`, it is not automatically ignored by Git unless explicitly added to `.gitignore`. Developers often assume `.env` is safe but might accidentally commit it if they don't check their `git status` or have an incomplete `.gitignore`.
**Prevention:** Always ensure `.env` and other secret-containing files are in `.gitignore` before the first commit. Provide a `.env.example` template to guide configuration without exposing real secrets. Use tools like `git-secrets` or pre-commit hooks to scan for leaked credentials.
