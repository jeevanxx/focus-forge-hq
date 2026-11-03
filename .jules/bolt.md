## 2025-05-22 - [Optimization of Date Grouping Logic]
**Learning:** In analytics functions that group data by day (e.g., `getWeeklyFocus`), a nested loop approach (filtering the full dataset for each day) leads to O(W*N) complexity. More importantly, it results in redundant and expensive `parseISO` and `format` calls (W*N). Switching to a single-pass O(N) accumulation with a Map significantly improves performance.
**Action:** Always prefer single-pass iteration and Maps for bucketing or grouping large datasets by keys, especially when keys require expensive transformation (like date parsing).

## 2025-05-22 - [Direct Date Comparisons for Totals]
**Learning:** When calculating totals for a specific range (like `getWeeklyFocusTotal`), it is much more efficient to use direct Date object comparisons in a single pass rather than deriving an intermediate grouped array.
**Action:** For simple aggregation over a range, use a single loop with early boundary checks instead of higher-level array transformations that might incur unnecessary overhead.
