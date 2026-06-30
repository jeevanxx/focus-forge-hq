## 2025-05-22 - Critical Exposure of Environment Variables
**Vulnerability:** The `.env` file containing Supabase credentials was tracked in Git, exposing project secrets to anyone with repository access.
**Learning:** Git tracking of `.env` files is a common but high-impact security failure that often goes unnoticed if `.gitignore` is not properly configured before the first commit.
**Prevention:** Always add `.env` to `.gitignore` during project initialization and use `.env.example` templates for documenting required keys without exposing actual values.
