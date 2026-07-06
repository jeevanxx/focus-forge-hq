## 2025-05-22 - [Optimizing Weekly Focus Bucketing]
**Learning:** Redundant date parsing and formatting inside loops ((N \times 7)$) is a primary performance bottleneck in analytics calculations. `differenceInCalendarDays` from `date-fns` is significantly more performant than string-based formatting (`format(date, 'yyyy-MM-dd')`) for bucketing temporal data into array indexes during (N)$ loops.
**Action:** Use `differenceInCalendarDays` or similar numeric comparisons for time-based bucketing instead of string formatting in performance-critical paths.
