## 2025-05-22 - CSS Injection in ChartStyle
**Vulnerability:** Dynamic CSS generation via `dangerouslySetInnerHTML` in the `ChartStyle` component (`chart.tsx`) was vulnerable to CSS rule and declaration injection.
**Learning:** Even with server-side or client-side generated CSS, failing to sanitize identifiers (IDs), property names (keys), and property values allows attackers to break out of the intended CSS rule and inject global styles.
**Prevention:** Aggressively sanitize any dynamic input that is part of a CSS block. Use a whitelist of characters for IDs (alphanumeric, dashes, underscores) and property keys. Block characters like `; { } [ ] " ' : < > \\ ` in property values to prevent declaration or rule breakout. Always quote attribute selectors in CSS.
