# Bolt's Performance Journal

## 2025-05-22 - [Optimizing Weekly Focus Analytics]
**Learning:** Replacing a nested loop approach (filtering sessions for each day of the week) with a single-pass hash map (Map buckets) significantly reduces algorithmic complexity from O(7*N) to O(N). More importantly, it minimizes expensive date parsing (`parseISO`) and formatting (`format`) calls, which are the primary bottleneck when processing large session datasets in JavaScript.
**Action:** Always prefer single-pass iteration with Map/Object bucketing when grouping data by keys (like dates), especially when the grouping key requires expensive calculation or formatting.
