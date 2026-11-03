## 2025-02-18 - Single-pass Map aggregation for timezone-aware analytics

**Learning:** `getWeeklyFocus` in `src/lib/analytics.ts` previously performed 7 nested `filter` operations over the entire `FocusSession` array (O(7N)), calling `format(parseISO(s.date), "yyyy-MM-dd")` repeatedly per session per weekday. Replacing this with an O(N) single-pass iteration that populates a pre-allocated week `Map` eliminates redundant date parsing/formatting while maintaining local timezone correctness.
**Action:** When computing date-bucketed metrics over time-series data, pre-populate a target `Map` for the target date keys and do a single-pass O(N) lookup instead of repeated nested filtering.
