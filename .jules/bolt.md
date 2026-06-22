## 2025-05-22 - O(N) Analytics Optimization
**Learning:** Avoid nested loops where the inner loop performs expensive operations (like `parseISO` or `format`) on the same large dataset multiple times. Even with small constant outer loops (e.g., 7 days), the cumulative overhead of redundant parsing/formatting creates significant bottlenecks fixable by O(N) single-pass iteration using Map-based bucketing.
**Action:** Use single-pass iteration (O(N)) for data processing tasks involving date parsing or heavy formatting, even if the outer grouping set is small.
