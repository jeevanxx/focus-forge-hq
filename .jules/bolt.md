# Bolt's Journal

## 2026-08-06 - TimeZone-Aware Algorithmic Optimization & Stable Memoization
**Learning:** Extracting date keys with fast string slicing (e.g., `s.date.slice(0, 10)`) is an anti-pattern that introduces correctness bugs across non-UTC local timezones. Retaining `format(parseISO(s.date), 'yyyy-MM-dd')` inside a single-pass O(N) iteration maintains local timezone alignment while achieving a massive ~5x execution speedup. Also, passing a newly constructed `Date` object in a `useMemo` dependency array renders the memoization useless as it gets recreated on every render; instead, depend on stable string keys like `todayKey` and construct Date objects locally inside the `useMemo` callback.
**Action:** Always maintain timezone correctness by keeping full parsing/formatting inside O(N) single-pass loops, and keep `useMemo` dependencies strictly stable by utilizing strings or primitive types instead of volatile object instances.
