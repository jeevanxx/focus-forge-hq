## 2025-05-22 - O(N) Weekly Analytics Optimization
**Learning:** Redundant date parsing and formatting inside loops ($O(N \times 7)$) is a primary performance bottleneck in analytics calculations. `differenceInCalendarDays` from `date-fns` is significantly more performant than string-based formatting for bucketing temporal data into array indexes during $O(N)$ loops.
**Action:** Always prefer single-pass iteration with direct date comparisons or index-based bucketing over nested loops or multiple filters on the same dataset.
