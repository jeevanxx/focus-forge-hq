## 2025-05-14 - O(N*W) to O(N) Analytics Optimization
**Learning:** Nested loops over large datasets with expensive operations (like date parsing and formatting) inside the inner loop create significant bottlenecks. Using numeric timestamp comparisons and bucketing with `differenceInCalendarDays` can provide massive speedups (~9x in this case).
**Action:** Always check for repeated work inside loops, especially date-related calculations. Use single-pass iterations and numeric comparisons whenever possible.
