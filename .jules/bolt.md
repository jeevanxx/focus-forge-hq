## 2025-05-22 - [Optimization of Analytics Bucketing]
**Learning:** Redundant date parsing and formatting inside loops ($O(N \times 7)$) is a primary performance bottleneck in analytics calculations. `differenceInCalendarDays` from `date-fns` is significantly more performant than string-based formatting (`format(date, 'yyyy-MM-dd')`) for bucketing temporal data into array indexes during $O(N)$ loops.
**Action:** Always prefer numeric or direct date comparison/indexing over string-based date keys when aggregating large datasets in pure functions.
