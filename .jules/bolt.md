## 2026-06-28 - [O(N) single-pass temporal bucketing]
**Learning:** Using `differenceInCalendarDays` from `date-fns` to bucket sessions into an array by index is significantly more performant than string-based formatting and filtering. The previous implementation was O(7N) with repeated expensive formatting; the new O(N) approach with array indexing reduced processing time by ~8x in benchmarks.
**Action:** Always prefer array bucketing via day offsets for temporal data aggregation over repeated filtering or string key mapping in loops.

## 2026-06-28 - [Analytics Memoization Pattern]
**Learning:** In the `Analytics` page, multiple independent analytics functions were being called on every render. Grouping these into a single `useMemo` that returns a result object reduces hook overhead and ensures all derived metrics stay in sync with the same `now` timestamp.
**Action:** Group related heavy computations into a single `useMemo` block when they share the same data source/dependencies.
