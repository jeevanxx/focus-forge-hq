# Sentinel Security Journal

## 2025-05-22 - CSS Injection in shadcn/ui Chart component
**Vulnerability:** The `ChartStyle` component in `src/components/ui/chart.tsx` uses `dangerouslySetInnerHTML` to inject dynamic CSS. The `id` prop (derived from `props.id` or `useId`) and the `config` keys/values were not sanitized, allowing an attacker to break out of the CSS rule and inject arbitrary CSS.
**Learning:** `dangerouslySetInnerHTML` is a high-risk sink. When used for `<style>` tags, it requires strict sanitization of all dynamic values. `useId()` in React can contain characters like `:` which are valid in CSS but might be problematic if used unsanitized in certain contexts (though here the main issue was the lack of sanitization of the `id` prop and config).
**Prevention:** Sanitize all dynamic inputs used in CSS injection. Use a whitelist of allowed characters (e.g., `[a-zA-Z0-9-_]`) for IDs and keys. Use quoted attribute selectors to prevent selector breakouts. Sanitize color values to prevent rule breakouts.
