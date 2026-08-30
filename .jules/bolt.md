## 2025-03-05 - Optimize getWeeklyFocus to single pass O(N) aggregation

**Learning:** `getWeeklyFocus` previously filtered and parsed dates across all sessions 7 times (once per day of the week), resulting in O(7N) parsing overhead. Moving to single-pass O(N) aggregation with pre-computed date keys reduces execution time by ~6.9x without sacrificing date-fns local timezone alignment.
**Action:** When aggregating daily/weekly metrics from date-stamped records, pre-index expected date buckets and accumulate metrics in a single pass over the records array.
