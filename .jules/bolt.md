## 2025-05-14 - Single-pass Map bucketing for weekly analytics

**Learning:** `getWeeklyFocus` iterated over all focus sessions 7 times (once per day in the week) and executed `format(parseISO(s.date))` on every session in every filter pass. Replacing this nested O(7N) iteration with a single O(N) pass and indexing week days in a `Map<string, number>` yields a ~7x speedup while preserving local timezone correctness.
**Action:** Whenever bucketing historical timestamp data into fixed calendar intervals (e.g. days of week, months), initialize the bucket structure upfront and use single-pass Map lookups rather than multiple array filter/reduce passes.
