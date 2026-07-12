## 2025-05-22 - O(7N) to O(N) optimization in weekly focus calculation
**Learning:** Redundant date parsing and filtering inside loops ($O(N \times 7)$) is a primary performance bottleneck in analytics calculations. `differenceInCalendarDays` from `date-fns` is significantly more performant than string-based formatting for bucketing temporal data into array indexes during $O(N)$ loops.
**Action:** Always prefer single-pass iteration with hash maps or array indexing for time-series data aggregation.
