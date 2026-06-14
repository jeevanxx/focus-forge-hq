
## 2025-05-22 - [Optimized Analytics Engine O(N*7) -> O(N)]
**Learning:** The previous implementation of `getWeeklyFocus` used a nested filter/reduce pattern inside a map over 7 days, resulting in O(N * 7) complexity. Even with small constant factors, redundant calls to `format(parseISO(), 'yyyy-MM-dd')` for every day-session pair created a significant bottleneck fixable by O(N) single-pass iteration with Map-based bucketing.
**Action:** Always prefer single-pass bucketing with Maps for time-series grouping instead of filtering the whole dataset for each time bucket.
