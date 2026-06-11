## 2025-05-22 - [Date-based grouping optimization]
**Learning:** In analytics engines using date-fns, filtering a large dataset multiple times (once for each day/bucket) using `format` and `parseISO` is a major bottleneck. The $O(N \cdot M)$ complexity (N items, M buckets) scales poorly.
**Action:** Always pre-initialize day buckets in a hash map (Record) and perform a single-pass $O(N)$ accumulation over the dataset. Also, derive summary totals (e.g., `totalMin`) from the pre-calculated bucketed data in the view layer to avoid redundant $O(N)$ passes.
