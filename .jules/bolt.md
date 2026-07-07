## 2025-05-22 - [Analytics O(N) Optimization]
**Learning:** Redundant date parsing and formatting inside loops ($O(N \times 7)$) is a primary performance bottleneck in analytics calculations. `differenceInCalendarDays` from `date-fns` is significantly more performant than string-based formatting for bucketing temporal data into array indexes during $O(N)$ loops.
**Action:** Always prefer numeric or calendar-based bucketing over string formatting in hot loops. Ensure `startOfWeek` is normalized with `.setHours(0,0,0,0)` to prevent timezone-related boundary errors.
