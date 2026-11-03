## 2025-02-17 - Dynamic CSS Injection Sanitization in React Style Tags

**Vulnerability:**
Inserting unescaped user-controlled IDs, configuration property names, or color values directly into `<style dangerouslySetInnerHTML={{ __html: ... }} />` allows attackers to perform CSS injection, break out of property scopes, alter application styling/DOM visibility, or execute SSRF/tracking pixel leaks using `url(...)` constructs.

**Learning:**
React component styling implementations (such as Shadcn chart configs) often accept dynamic key/value pairs for CSS custom properties. Standard HTML escaping is insufficient for CSS contexts because characters like `;`, `{`, `}`, and `url()` have specific structural meaning inside `<style>` tags.

**Prevention:**
Always sanitize dynamic inputs rendered inside `<style>` blocks:
1. Limit `id` and CSS property names (`key`) to alphanumeric characters, hyphens, and underscores (`/[^a-zA-Z0-9_-]/g`).
2. Strip CSS breakout characters (`[;{}[\]"'<>\\]`) from CSS property values.
3. Explicitly detect and block `url(...)` constructs in dynamic CSS property values to prevent unauthorized remote requests or tracking pixel leaks.
4. Keep sanitization helpers private to component modules (un-exported) to avoid breaking React Refresh rules, and test them indirectly through component rendering assertions.
