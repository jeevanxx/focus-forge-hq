## 2025-05-14 - Timezone-aware date parsing in single-pass aggregation
**Learning:** `getWeeklyFocus` previously iterated 7 times over the full focus sessions array, running `.filter()` and `parseISO` on every element for each day of the week (O(7N)). Migrating to a Map-based single pass achieves a ~7x speedup while preserving timezone correctness through `format(parseISO(s.date), 'yyyy-MM-dd')`.
**Action:** When computing calendar or weekly bucket stats across collections, aggregate in a single pass into a Map/Record by formatted key instead of filtering per interval.
