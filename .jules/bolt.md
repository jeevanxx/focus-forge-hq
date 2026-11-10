## 2025-05-14 - Single-pass Map bucketing for Weekly Focus

**Learning:** `getWeeklyFocus` in `src/lib/analytics.ts` previously filtered the entire `FocusSession[]` array 7 distinct times (once per day of the week), repeatedly calling `parseISO(s.date)` and `format(...)` for every session on each iteration (O(7N)). Simply extracting date strings via `.slice(0, 10)` causes timezone drift bugs across non-UTC local timezones. Instead, maintaining local timezone correctness with `format(parseISO(s.date), 'yyyy-MM-dd')` while grouping sessions into a Map in a single pass (O(N)) achieves an ~7x speedup (~785ms down to ~110ms for 14,000 sessions).

**Action:** For calendar date-bucketed aggregations, always prefer single-pass Map/hash bucketing with timezone-consistent formatting rather than nested array filter passes.
