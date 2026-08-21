## 2025-02-17 - O(N) Single-Pass Iteration for Timezone-Aware Weekly Analytics
**Learning:** Functions like `getWeeklyFocus` in `analytics.ts` calculated weekly metrics by executing `sessions.filter(...)` inside `WEEK_LABELS.map(...)`. This resulted in $O(7N)$ time complexity and repeated `parseISO`/`format` calls per session.
**Action:** Pre-generate a 7-day Map keyed by `yyyy-MM-dd` and populate it in a single $O(N)$ pass over the sessions array.
