# Bolt's Journal - Focus Forge

This journal is maintained by Bolt ⚡ to record critical performance learnings, architecture-specific bottlenecks, and surprising optimization results.

## 2025-03-02 - TimeZone-Aware Algorithmic Optimization
**Learning:** Slicing iso strings (e.g. `s.date.slice(0, 10)`) introduces timezone/DST alignment correctness bugs for non-UTC locales. Retaining `format(parseISO(s.date), 'yyyy-MM-dd')` inside a single-pass O(N) iteration maintains local timezone correctness while offering massive speed improvements compared to nested filter patterns.
**Action:** Always prefer formatting parsed ISO dates using timezone-aware libraries within O(N) structures, rather than naive string manipulation.
