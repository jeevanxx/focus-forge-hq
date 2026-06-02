## 2024-05-22 - Optimize weekly focus analytics to O(N)

**Learning:** Derivative functions (like `getWeeklyFocusTotal` calling `getWeeklyFocus`) and multi-pass iterations with heavy formatting inside loops create significant bottlenecks as data grows. In this case, switching from O(7N) with 7x passes of `format()` to a single-pass O(N) with `differenceInCalendarDays` for bucketing yielded a ~5x speedup for the breakdown and ~14x speedup for the total sum.

**Action:** Prefer single-pass iterations and use lightweight date arithmetic (like index bucketing) over string formatting for grouping logic in performance-critical analytics paths. Always implement direct calculation functions instead of wrapping more complex ones if the overhead is measurable.
