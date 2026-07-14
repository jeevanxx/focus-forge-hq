## 2025-05-22 - O(7N) to O(N) Analytics Optimization
**Learning:** Redundant date parsing and formatting inside loops ($O(N \times 7)$) is a primary performance bottleneck in analytics calculations. `differenceInCalendarDays` from `date-fns` is significantly more performant than string-based formatting for bucketing temporal data into array indexes during $O(N)$ loops.
**Action:** Always prefer single-pass iteration with index-based bucketing for temporal aggregations instead of nested filtering.
