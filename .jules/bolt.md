## 2025-03-10 - O(N) Hash Map Lookup for getWeeklyFocus Analytics
**Learning:** `getWeeklyFocus` in `analytics.ts` previously executed $O(7N)$ date conversions (`parseISO` and `format`) by filtering all sessions inside a 7-day loop.
**Action:** Pre-fill result entries indexed by `yyyy-MM-dd` date keys to achieve $O(N)$ single-pass aggregation while preserving local timezone formatting.
