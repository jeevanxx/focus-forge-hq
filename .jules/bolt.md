## 2025-05-22 - [Optimizing Weekly Focus Analytics]
**Learning:** $O(7N)$ operations with repeated date formatting and filtering are a major bottleneck for large datasets (e.g., 10k+ sessions). Single-pass $O(N)$ aggregation using a map or array-based grouping is significantly more efficient (~15x speedup).
**Action:** Avoid nested loops and repeated date parsing/formatting in analytics functions. Use single-pass reductions or aggregations wherever possible.
