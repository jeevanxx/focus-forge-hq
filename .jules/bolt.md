## 2025-05-22 - O(N) Weekly Data Bucketing
**Learning:** Avoid nested loops or redundant filters when processing large datasets for weekly/daily analytics. O(N * 7) complexity with repeated date parsing and filtering is a common bottleneck.
**Action:** Use a single-pass O(N) iteration with numeric bucketing (e.g., `(date.getDay() + 6) % 7` for Monday-start weeks) to improve performance significantly.
