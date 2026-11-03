## 2025-05-22 - O(7N) Analytics Bottleneck
**Learning:** Found an $O(7N)$ pattern in `getWeeklyFocus` where sessions were filtered once for each day of the week, leading to redundant date parsing/formatting. This is an $O(D \cdot N)$ complexity where $D$ is the number of days in the period.
**Action:** Use single-pass $O(N)$ aggregation with a `Map` and boundary comparisons for time-range based analytics to significantly reduce overhead.
