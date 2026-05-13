## 2025-05-15 - [O(N) Analytics Engine]
**Learning:** Initial analytics implementation was using O(N * W) iteration where N is the number of sessions and W is the number of days (7). For 5,000 sessions, this resulted in ~24s execution time on the benchmark due to redundant `parseISO` and `format` calls within nested loops.
**Action:** Always prefer single-pass iteration using numeric timestamp comparisons for range checks before performing expensive date formatting or calendar calculations.
