## 2025-03-05 - Timezone-Aware Single-Pass Aggregation for Weekly Analytics
**Learning:** `getWeeklyFocus` previously filtered sessions 7 times (once per day of the week), resulting in $O(7N)$ string formatting and ISO parsing calls. Refactoring to a single-pass $O(N)$ lookup map reduces execution time from ~767ms to ~105ms for large session sets while preserving local timezone correctness.
**Action:** Always prefer pre-populating target arrays and building lookup maps to aggregate collections in $O(N)$ single-pass loops instead of performing repeated array filters inside `map` operations.
