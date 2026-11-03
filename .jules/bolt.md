## 2025-05-20 - Single-Pass Map Bucketing for Timezone-Aware Weekly Focus Aggregation

**Learning:** `getWeeklyFocus` in `src/lib/analytics.ts` previously ran an O(7N) nested array filter calling expensive `parseISO` and `format` on every session string 7 times. Reducing this to a single O(N) pass with Map lookup decreased execution time by ~5x (from ~668ms down to ~133ms for 14,000 sessions).

**Action:** Whenever calculating group aggregates by date ranges, pre-calculate target date keys into a lookup Map and iterate over the collection in a single pass instead of looping through the collection once per category.
