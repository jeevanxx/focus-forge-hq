## 2025-05-14 - [Analytics Optimization]
**Learning:** Optimizing from O(N * W) to O(N) using a single-pass iteration with a Map significantly improves performance for large datasets. However, using string comparisons (ISO UTC) for performance can lead to logic regressions regarding local timezones.
**Action:** Always prioritize correctness (e.g., using parseISO/format for local date grouping) even if it's slightly slower than pure string operations, as long as the algorithmic complexity remains optimal (O(N)).
