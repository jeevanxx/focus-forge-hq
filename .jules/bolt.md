## 2024-03-20 - Single-pass analytics O(N)
**Learning:** Avoid using .filter() followed by .reduce() inside a loop over a fixed set of keys (like days of the week). This results in O(D * N) complexity. Combining them into a single pass with an index lookup is much faster. Also, expensive date operations like format() and parseISO() should be minimized in hot loops.
**Action:** Use single-pass aggregation and simple comparison logic for analytics data processing.
