## 2025-05-22 - Exposed Secrets in Version Control
**Vulnerability:** A `.env` file containing production-ready Supabase credentials (URL, API keys) was committed to the repository.
**Learning:** Hardcoded configuration files like `.env` are often accidentally tracked if not explicitly ignored from the start of the project.
**Prevention:** Always add `.env` to `.gitignore` before the first commit and provide a `.env.example` template with dummy values to guide other developers.

## 2025-05-22 - Outdated Dependencies (XSS)
**Vulnerability:** High-severity XSS vulnerability in `react-router-dom` due to an insecure version of `@remix-run/router`.
**Learning:** Dependencies can quickly become security liabilities; regular audits are necessary to catch vulnerabilities in deeply nested dependency trees.
**Prevention:** Regularly run `npm audit` or `pnpm audit` and upgrade critical dependencies to their patched versions.
