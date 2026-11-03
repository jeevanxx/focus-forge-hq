## 2025-05-22 - CSS Injection in shadcn/ui Chart Component
**Vulnerability:** User-controllable input (keys, colors, and IDs) was being injected into a `<style>` tag via `dangerouslySetInnerHTML` without sanitization.
**Learning:** Even standard UI components like those from shadcn/ui can contain security risks when they use `dangerouslySetInnerHTML` for dynamic styling. Injections can occur through CSS variable names or values.
**Prevention:** Always sanitize any dynamic content that is placed inside a `<style>` tag. Use a whitelist for IDs and strip dangerous characters ( `; { } \ < > ` ) from variable names and property values. Wrap IDs in quotes within attribute selectors.
