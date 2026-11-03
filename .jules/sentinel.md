## 2025-05-22 - CSS Injection in Dynamic Chart Styles
**Vulnerability:** CSS injection via `dangerouslySetInnerHTML` in the `ChartStyle` component. Unsanitized `id`, `config` keys, and `color` values allowed attackers to break out of the intended CSS rule and inject arbitrary styles.
**Learning:** Even internal UI components that generate dynamic CSS can be injection vectors if they use `dangerouslySetInnerHTML`. Relying on `useId()` is safe for the ID, but allowing a user-provided `id` prop or dynamic keys/colors from configuration requires aggressive sanitization.
**Prevention:** Sanitize all dynamic inputs used in CSS generation. Block control characters like `; { } [ ] " ' :`. Use quoted attribute selectors (e.g., `[data-chart="${id}"]`) to further harden the selector.
