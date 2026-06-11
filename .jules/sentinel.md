## 2025-05-22 - CSS Injection in dynamic style generation
**Vulnerability:** The `ChartContainer` component used `dangerouslySetInnerHTML` to inject a `<style>` tag with dynamic IDs, config keys, and color values without sanitization. An attacker could provide malicious props to "break out" of the CSS rules or the `<style>` tag itself.
**Learning:** Even internal UI components like shadcn's Chart can be vulnerable if they dynamically generate CSS. Quoting attribute selectors (`[data-chart="${id}"]`) and whitelisting identifier characters are key defenses.
**Prevention:** Always sanitize dynamic values that go into `dangerouslySetInnerHTML`. Use whitelists for identifiers (e.g., `/[^a-zA-Z0-9-_:.]/g`) and blacklist breakout characters for values (e.g., `;{}<>`).
