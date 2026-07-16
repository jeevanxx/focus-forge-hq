# Bolt Performance Journal

## 2025-05-22 - Date-fns Performance in loops
**Learning:** Redundant date parsing and formatting inside loops ($O(N \times 7)$) is a primary performance bottleneck in analytics calculations. `differenceInCalendarDays` from `date-fns` is significantly more performant than string-based formatting for bucketing temporal data into array indexes during $O(N)$ loops.
**Action:** Use single-pass iteration and array-based bucketing indexed via `differenceInCalendarDays` to minimize date formatting overhead.
