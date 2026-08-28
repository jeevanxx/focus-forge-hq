## 2025-02-18 - Timezone-Aware Single-Pass Aggregation in Analytics Engine
**Learning:** Nested filtering over sessions for each day of the week calling `format(parseISO(s.date))` creates $O(7N)$ execution overhead with redundant date parsing and formatting operations. Switching to pre-populated week buckets and an $O(1)$ date key map allows a single-pass $O(N)$ pass while preserving exact local timezone calculations.
**Action:** Always prefer initializing week buckets upfront and aggregating sessions in a single $O(N)$ pass when processing date-based series data.
