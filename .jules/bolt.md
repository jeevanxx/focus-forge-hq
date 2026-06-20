## 2025-05-22 - O(N*7) bottleneck in analytics engine
**Learning:** Calling `format` and `parseISO` inside nested loops (even small ones like 7 days) creates a significant bottleneck when processing large datasets (e.g., 10k sessions). Single-pass iteration with Map-based grouping is ~10x faster.
**Action:** Always prefer single-pass O(N) grouping over O(K*N) filtering when generating time-series data.
