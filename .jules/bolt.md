## 2025-02-17 - O(N) Aggregation for Weekly Focus Analytics
**Learning:** Nested `Array.prototype.filter` across calendar buckets inside `getWeeklyFocus` resulted in $O(7N)$ time complexity and repeated expensive `parseISO` / `format` date parsing on every session for each day of the week (~925ms per call for 14,000 sessions).
**Action:** Use a single-pass $O(N)$ iteration over focus sessions with a `Map` lookup key indexed by `format(parseISO(s.date), "yyyy-MM-dd")`. This reduced execution time by ~8.4x to ~109ms while preserving local timezone boundary correctness.
