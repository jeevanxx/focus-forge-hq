## 2025-05-22 - [CSS Injection in Chart Component]
**Vulnerability:** User-provided chart configuration (keys and colors) was directly interpolated into a `<style>` tag via `dangerouslySetInnerHTML`.
**Learning:** Even internal UI components can be vectors for injection if they dynamically generate CSS from props. Whitelisting characters and quoting attribute selectors are essential defenses.
**Prevention:** Always sanitize dynamic inputs used in `dangerouslySetInnerHTML`. Use `React.useMemo` for sanitization to minimize performance impact.
