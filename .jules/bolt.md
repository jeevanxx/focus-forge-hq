# Bolt's Journal — Critical Learnings Only

## 2026-05-11 - Array-Based Bucketing for Date Aggregation
**Learning:** Performing multiple nested `filter` calls with full date-to-string conversion/comparison for multi-day reporting results in highly inefficient $O(D \times N)$ performance, where $D$ is the number of days (7) and $N$ is the number of sessions. For large datasets, this blocks the main thread. Switching to single-pass $O(N)$ iteration with array indexing using `differenceInCalendarDays` provides an extremely fast, timezone-safe solution.
**Action:** Always pre-fill result structures and use index-based/map-based lookups with reliable calendar difference helpers like `differenceInCalendarDays` instead of nested string-based filters.
