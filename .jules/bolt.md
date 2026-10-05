# Bolt Journal

## 2025-03-05 - Timezone-Aware Algorithmic Optimization for Weekly Focus Aggregation
**Learning:** In date-based focus tracking, replacing nested $O(7N)$ filtering with single-pass $O(N)$ Map bucketing achieves an ~7x-9x speedup. Retaining `format(parseISO(s.date), "yyyy-MM-dd")` instead of fast string slicing avoids timezone bugs across non-UTC local offset boundaries.
**Action:** When aggregating items across calendar dates, always construct a single-pass `Map<string, number>` with `format(parseISO(...))` keys rather than running nested array filters for each date bucket.
