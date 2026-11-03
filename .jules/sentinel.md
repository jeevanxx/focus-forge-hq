## 2025-05-22 - CSS Injection in Chart Component
**Vulnerability:** CSS Injection via `dangerouslySetInnerHTML` in `<style>` tag.
**Learning:** Shared UI components that generate dynamic CSS (like shadcn/ui charts) are high-risk areas for injection if they don't sanitize IDs, keys, or values. Even if the current usage is "safe" (using `useId`), the component itself should be defensive to prevent future vulnerabilities if it's reused with user-provided data.
**Prevention:** Aggressively sanitize all dynamic inputs used in CSS generation. Block characters like `; { } [ ] " ' < > \` to prevent rule and declaration breakout. Always use quoted attribute selectors (e.g., `[data-chart="${id}"]`) for more robust targeting.
