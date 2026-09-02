## 2025-05-18 - Single-Pass Map Lookups for Weekly Focus Analytics

**Learning:** In `getWeeklyFocus`, filtering the list of focus sessions once per day of the week resulted in nested O(7N) filtering and repeated calls to `parseISO` and `format` (taking ~755ms for 14,000 sessions). Replacing nested `.filter()` calls with a single-pass O(N) loop indexed by a `Map` pre-filled with the 7 week days preserved exact timezone-safe formatting while delivering a ~7.2x speedup (~105ms for 10 runs of 14,000 items).
**Action:** Pre-fill result structures and use single-pass map-based aggregation instead of repeated array filtering over date ranges.
