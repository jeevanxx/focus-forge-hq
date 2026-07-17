# Bolt's Journal - Critical Learnings Only

## 2025-05-22 - Optimizing Weekly Focus Performance
**Learning:** Switching `getWeeklyFocus` from a nested O(7N) parsing/filtering algorithm to a single-pass O(N) bucketing with `differenceInCalendarDays` provides a dramatic performance boost (~10x speedup). Normalizing the week start date (`weekStart.setHours(0, 0, 0, 0)`) prevents daylight saving/timezone offset indexing errors.
**Action:** When working with calendar date buckets and aggregation, pre-fill zero-initialized arrays, normalize start times, and map using O(1) index calculation rather than O(N) array filtering.
