# Bolt's Journal - Critical Learnings Only

## 2025-02-17 - O(N) Calendar Offsets for Weekly Analytics
**Learning:** In weekly aggregations, doing nested filtering over N items for 7 days runs in O(7N) with repeated date formatting and string matching. Switching to an O(N) single-pass iteration using `differenceInCalendarDays` provides an ~8-10x speedup under large datasets (e.g. 10,000 focus sessions), but requires initializing the daily focus buckets ahead of time and normalizing the start date to midnight to prevent timezone indexing errors.
**Action:** When aggregating historical time-series data into weekly/daily buckets, pre-initialize the results array and bucket items in O(1) time per item using calendar offset math, rather than repeatedly filtering or parsing keys in nested loops.
