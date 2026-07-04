## 2025-05-22 - Optimized weekly focus analytics
**Learning:** Redundant date parsing and formatting inside loops ($O(N \times 7)$) is a primary performance bottleneck in analytics calculations. `differenceInCalendarDays` from `date-fns` is significantly more performant than string-based formatting (`format(date, 'yyyy-MM-dd')`) for bucketing temporal data into array indexes during $O(N)$ loops.
**Action:** Use single-pass iteration with direct date comparison or difference-based bucketing instead of nested loops and string-keyed maps for temporal data processing.
