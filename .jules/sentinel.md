## 2026-05-15 - CSS Injection in Dynamic Style Generation

**Vulnerability:** Unsanitized string interpolation in a raw `<style>` tag injected via `dangerouslySetInnerHTML`.
**Learning:** Even when building design-system components like charts, any interpolation of dynamic IDs or configuration keys into a CSS context can be exploited to break out of the intended rule and inject malicious CSS.
**Prevention:** Always sanitize dynamic identifiers with a whitelist regex (e.g., `/[^a-zA-Z0-9-_]/g`) and strip characters that can terminate CSS rules or property values (`;{}<>\`) from any values being injected into a style block.
