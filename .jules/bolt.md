## 2026-06-06 - Optimized Analytics Bucketing with O(N) Map
**Learning:** Avoid nested loops where the inner loop performs expensive operations (like `parseISO` or `format`) on the same large dataset multiple times. Even with small constant outer loops (e.g., 7 days), the cumulative overhead of redundant parsing/formatting creates significant bottlenecks fixable by O(N) single-pass iteration.
**Action:** Use Map-based bucketing for grouping time-series data to ensure each data point is processed exactly once.
