## 2025-05-14 - Optimized Analytics Engine Complexity
**Learning:** The `getWeeklyFocus` function had a hidden O(N * W) complexity due to nested loops and repeated expensive date formatting/parsing. Using a single-pass iteration with numeric timestamp comparisons and calendar-day bucketing improves performance by ~14x (24.5s -> 1.7s for 5,000 sessions in a 100-iteration benchmark).
**Action:** Always check for redundant operations inside loops, especially expensive date formatting, and prioritize single-pass O(N) patterns for data aggregation.
