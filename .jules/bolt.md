## 2025-05-22 - Optimize weekly analytics computation
**Learning:** Avoid nested loops where the inner loop performs expensive operations (like `parseISO` or `format`) on the same large dataset multiple times. Even with small constant outer loops (e.g., 7 days), the cumulative overhead of redundant parsing/formatting creates significant bottlenecks fixable by O(N) single-pass iteration.
**Action:** Use a `Map` for single-pass grouping/aggregation of large datasets by a derived key (like a date string).
