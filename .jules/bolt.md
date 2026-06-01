# Bolt Learning Journal ⚡

## 2025-05-22 - Single-pass analytics optimization
**Learning:** The analytics engine was performing multiple passes (O(7N)) over focus sessions and executing expensive `format()` and `parseISO()` calls inside inner loops. This created a significant bottleneck as the number of sessions grew.
**Action:** Use a single-pass O(N) iteration with early date-range filtering. Map sessions to days of the week using `differenceInCalendarDays` instead of string formatting for indexing. For total sums, use a direct reduction instead of calling higher-level aggregation functions to avoid redundant object allocations.
