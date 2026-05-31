
## 2026-05-19 - [CSS Injection in Chart Component]
**Vulnerability:** The shadcn/ui `ChartStyle` component used `dangerouslySetInnerHTML` to inject raw IDs and color values into a `<style>` tag, allowing for selector breakout and CSS property injection.
**Learning:** Even internal UI components can be vectors for injection if they bypass React's standard escaping mechanisms for dynamic styling. Sanitization must be applied to both the identifiers (selectors) and the values (properties).
**Prevention:** Whitelist allowed characters for DOM IDs used in selectors and strip characters like `; { } \ < >` from dynamic CSS values. Always quote attribute selectors in CSS to prevent breakout.
