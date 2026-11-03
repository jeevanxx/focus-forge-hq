## 2026-05-27 - CSS Injection Protection in Chart Component
**Vulnerability:** The `ChartStyle` component used `dangerouslySetInnerHTML` to inject dynamic CSS rules based on `id`, `config` keys, and `color` values without sanitization. This could allow an attacker to break out of CSS rules or the `<style>` tag itself.
**Learning:** Even internal UI components like those from shadcn/ui can be vulnerable to injection if they generate dynamic styles from data that could potentially be user-influenced.
**Prevention:** Always sanitize any data that is injected into `dangerouslySetInnerHTML`. Use whitelists for IDs and strip dangerous characters (`;{}<>`) from CSS properties and values. Use quoted attribute selectors to prevent selector breakout.
