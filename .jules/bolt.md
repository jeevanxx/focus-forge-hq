## 2025-03-08 - Single-Pass Map Lookups for Weekly Focus Aggregation

**Learning:** `getWeeklyFocus` previously iterated over 7 days and executed `sessions.filter()` for each day, invoking `parseISO` and `format` $7 \times N$ times. Converting this to a single-pass $O(N)$ iteration with a precomputed `Map` date index eliminates repeated date parsing and reduces execution time by ~7x for large session logs while maintaining timezone accuracy.

**Action:** When aggregating time-series data across buckets (e.g. days of week), index target bucket keys in a `Map` first and iterate through records in a single pass rather than running repeated `.filter()` queries over the full dataset.
