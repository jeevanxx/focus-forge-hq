## 2025-05-15 - [Sanitizing Dynamic CSS in dangerouslySetInnerHTML]
**Vulnerability:** XSS and CSS injection via unvalidated template strings in `<style>` tags.
**Learning:** Even within a `<style>` tag, `dangerouslySetInnerHTML` is dangerous. Attackers can use `</style><script>...` to break out and execute JS. Whitelisting alphanumeric characters for selectors/keys and escaping `<` is essential.
**Prevention:** Always sanitize any dynamic input that goes into a `style` tag's HTML content. Strip `<` to prevent tag escaping and use strict regex for property names and selectors.
