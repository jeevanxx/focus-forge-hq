## 2025-05-18 - Calendar Task Indexing Optimization
**Learning:** Performing repeated `array.filter()` operations inside render loops (such as mapping over 7 days in a week view) causes O(N * D) overhead on every state change or re-render.
**Action:** Index tasks by `dueDate` into a `Map<string, Task[]>` in a single O(N) pass wrapped in `useMemo`, reducing daily lookups to O(1) `map.get(key)`.
