## 2026-06-21 - Algorithmic Complexity in Analytics

**Learning:** Algorithmic complexity in data processing functions (like analytics) can significantly impact UI responsiveness as the dataset grows. Specifically, nesting O(N) operations (like `filter` and `reduce`) inside a loop over days creates O(D*N) complexity. Additionally, repeated `parseISO` and `format` calls on the same large dataset are extremely expensive.

**Action:** Prefer O(N) single-pass iteration with Map-based bucketing for grouping data. Memoize result sets in React components and derive secondary metrics from primary ones to avoid redundant processing passes.
