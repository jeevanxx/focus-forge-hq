## 2026-06-06 - Optimized Weekly Focus Calculation
**Learning:** O(W*N) algorithms (where W is small constant like 7 days) can still be slow if the inner loop contains expensive operations like `format()` or `parseISO()`. In this case, `getWeeklyFocus` was re-parsing and re-formatting 10,000 sessions 7 times, leading to ~520ms execution.
**Action:** Use single-pass O(N) iteration and light-weight bucketing (e.g. `differenceInCalendarDays`) to minimize expensive operations. This reduced execution time to ~85ms (~6x speedup).
