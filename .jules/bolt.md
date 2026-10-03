# Bolt Journal

Critical learnings and performance insights for Focus Forge.

## 2025-02-19 - Single-Pass Map Bucketing for Date Ranges
**Learning:** Calling `format(parseISO(s.date), "yyyy-MM-dd")` inside a nested loop over calendar days (O(7N)) redundantly parses and formats every focus session date 7 times.
**Action:** Use a single-pass O(N) iteration over sessions with a pre-populated Map of date keys (`yyyy-MM-dd`) to bucket focus time in O(1) time without losing timezone alignment.
