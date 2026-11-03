## 2024-05-22 - Optimizing Analytics Loops
**Learning:** Avoid nested filtering and repeated date formatting in analytics functions. O(N * W) where W is the number of windows (days, hours) can easily be O(N) using a single-pass with a hash map or range checks. Repeated `format` and `parseISO` calls inside loops are significant bottlenecks.
**Action:** Always prefer single-pass iteration and minimal date operations inside loops for analytics logic.
