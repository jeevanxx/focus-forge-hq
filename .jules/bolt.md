## 2025-01-15 - Single-pass Map lookup for date aggregation
**Learning:** `getWeeklyFocus` previously executed `sessions.filter()` 7 times (once per weekday), parsing and formatting dates across $7 \times N$ iterations. Refactoring to a pre-computed `Map<string, number>` allows a single $O(N)$ pass while preserving timezone-accurate date formatting.
**Action:** Replace nested array filtering over date ranges with single-pass iteration using Map/Object lookups.
