## 2025-01-05 - Optimize getWeeklyFocus to O(N) Single Pass
**Learning:** `getWeeklyFocus` was performing O(7N) array filtering and date parsing/formatting operations by calling `parseISO` and `format` on every session date for every day of the week.
**Action:** Pre-fill a 7-day array and index days with a `Map<string, number>` on date key (`yyyy-MM-dd`), then perform a single O(N) pass over sessions to accumulate durations. This yields a ~7x speedup while preserving timezone correctness.
