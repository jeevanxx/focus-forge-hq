## 2025-05-22 - O(N) Analytics & Memoization
**Learning:** The original `getWeeklyFocus` implementation was O(7N) because it iterated over the entire sessions array once for each day of the week, performing expensive `format(parseISO(s.date), ...)` calls in every inner iteration. For 10,000 sessions, this resulted in 70,000 parsing/formatting operations.
**Action:** Use a Map-based single-pass iteration (O(N)) to group data by key. Also, stabilize dynamic date references like `new Date()` with `useMemo(() => new Date(), [])` in pages to prevent cache invalidation of downstream computations.
