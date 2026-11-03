## 2025-05-24 - [Local Timezone Correctness vs. Speed]
**Learning:** In analytics loops, using `s.date.slice(0, 10)` for date grouping is significantly faster but incorrect if the session's ISO string (UTC) represents a different date than the user's local timezone.
**Action:** Always prioritize correctness by using `format(parseISO(date), "yyyy-MM-dd")` for grouping/filtering in analytics unless the application explicitly operates in UTC. Optimization should focus on reducing algorithmic complexity (e.g., O(7N) to O(N)) rather than sacrificing accuracy for micro-optimization.
