## 2025-05-22 - [CSS Injection via dangerouslySetInnerHTML in Chart component]
**Vulnerability:** The `ChartStyle` component was injecting raw `id`, config keys, and color values into a `<style>` tag using `dangerouslySetInnerHTML`. An attacker (or malicious data) could provide a payload like `my-id] { } body { display: none !important; } [data-chart=xxx` to break out of the intended selector and inject arbitrary CSS.
**Learning:** Even internal utility components like chart wrappers can be vectors for injection if they dynamically generate CSS from props. `dangerouslySetInnerHTML` in React should always be a red flag, especially when combined with string interpolation of props.
**Prevention:**
1. Always sanitize props used in `dangerouslySetInnerHTML`.
2. Use allowlists (regex) for identifiers like IDs and keys.
3. Block/sanitize characters that allow breaking out of CSS rules (`;`, `{`, `}`, etc.) in values.
4. Use quoted attribute selectors (`[data-chart="val"]`) to prevent simple breakout via spaces or special characters.
