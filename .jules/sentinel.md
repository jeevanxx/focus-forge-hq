## 2025-05-22 - [CSS Injection in Chart Component]
**Vulnerability:** The `ChartStyle` component in `src/components/ui/chart.tsx` uses `dangerouslySetInnerHTML` to inject dynamic CSS. If the `id` or `config` keys/values are controlled by users, they could inject malicious CSS rules.
**Learning:** While `useId` is used for the `id`, it can be overridden by props. Config keys and color values are also used directly in the CSS string.
**Prevention:** Sanitize the `id`, keys, and values before injecting them into the CSS string.
