## 2025-05-22 - O(N) Analytics Aggregation
**Learning:** Avoid nested loops where the inner loop performs expensive operations (like `parseISO` or `format`) on the same large dataset multiple times. Even with small constant outer loops (e.g., 7 days), the cumulative overhead of redundant parsing/formatting creates significant bottlenecks.
**Action:** Use single-pass iteration with Map-based bucketing to aggregate time-series data. Pre-filter or early-exit for date ranges to minimize expensive formatting calls.
