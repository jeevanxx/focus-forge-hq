# Bolt Journal - Focus Forge

## 2025-08-01 - Timezone-Aware Weekly Focus Optimization
**Learning:** Nested loops filtering arrays of sessions by week-days (O(7N)) can block the main thread and slow down page-rendering significantly as the sessions dataset grows. However, extracting date keys using simple string slicing (e.g. `s.date.slice(0, 10)`) can introduce correctness bugs across non-UTC local timezones. Retaining timezone-safe parser/formatting functions while switching to a single-pass O(N) hash map lookup satisfies correctness and yields a ~5x speedup (~134ms down from ~496ms).
**Action:** Always pre-fill result structures to guarantee daily entry correctness, then aggregate using an O(N) single-pass iteration using timezone-consistent formatting lookups.
