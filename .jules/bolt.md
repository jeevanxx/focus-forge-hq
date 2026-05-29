## 2025-05-22 - [Optimizing Weekly Focus Analytics]
**Learning:** The analytics engine was performing redundant $O(N)$ passes for each day of the week, resulting in $O(7N)$ complexity with frequent expensive `parseISO` and `format` calls.
**Action:** Use a single-pass $O(N)$ aggregation with a `Map` lookup and implement a timestamp-based "buffer" check to bypass expensive date formatting for sessions clearly outside the target range.
