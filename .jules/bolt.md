# Bolt's Performance Journal

## 2025-05-14 - Single-Pass Map Aggregation in Timezone-Safe Analytics
**Learning:** Date parsing/formatting functions like `parseISO` and `format` inside nested iterations (e.g. `WEEK_LABELS.map` running `sessions.filter` each time, leading to O(7N) operations) are the dominant CPU bottleneck in analytics aggregation. Switching to a single-pass O(N) Map accumulation preserves local timezone conversion correctness via `format(parseISO(s.date), "yyyy-MM-dd")` while eliminating repeated session iterations and redundant date-formatting calls, yielding an ~8x speedup (~815ms down to ~103ms for 14,000 items).
**Action:** When calculating interval buckets across timestamped datasets, precompute bucket keys and accumulate values in a single O(N) pass using a lookup Map rather than filtering the array once per bucket.
