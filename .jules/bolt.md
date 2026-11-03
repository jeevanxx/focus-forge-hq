## 2025-05-22 - Algorithmic Bottleneck in Analytics
**Learning:** Filtering large datasets in a loop (O(N * W)) using expensive date formatting functions like `format` or `parseISO` causes significant lag. `date-fns` operations have high overhead when repeated thousands of times.
**Action:** Use a single-pass O(N) approach with a `Map` for aggregation. Apply simple date boundary comparisons (`>=` and `<`) on `Date` objects to filter data before performing string formatting.
