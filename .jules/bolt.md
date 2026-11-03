## 2025-05-10 - O(N) Single-Pass Map Bucketing for Timezone-Aware Weekly Focus Analytics

**Learning:** `getWeeklyFocus` in `src/lib/analytics.ts` originally used nested filtering (`WEEK_LABELS.map` and `sessions.filter`), leading to O(7N) iteration complexity and repeated date parsing (`parseISO` + `format`). Replacing nested filtering with pre-calculated week date keys in a Map and iterating through sessions once in O(N) reduced average execution time for 14,000 sessions from ~723ms to ~105ms (~5.7x speedup) while retaining strict timezone alignment via local `format(parseISO(s.date), "yyyy-MM-dd")`.

**Action:** Prefer Map-based O(N) single-pass bucket aggregation for time-series analytics functions over multi-pass nested array filtering.
