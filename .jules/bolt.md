## 2024-05-22 - [Algorithmic complexity in analytics]
**Learning:** Redundant date parsing and formatting inside loops ($O(N \times 7)$) was the primary performance bottleneck in analytics calculations. `differenceInCalendarDays` from `date-fns` is significantly more performant than string-based formatting for bucketing temporal data into array indexes during $O(N)$ loops.
**Action:** Always prioritize single-pass $O(N)$ iteration for dataset processing and use numeric date comparisons or index offsets instead of string formatting for grouping.
