## 2025-03-05 - Timezone-Aware Single-Pass Map Bucketing
**Learning:** Redundant nested filtering over date arrays causes exponential performance degradation due to repeated `parseISO` / `format` date parsing. Using a Map lookup pre-populated with the target week's date keys allows O(1) bucketing in a single O(N) pass while maintaining full timezone alignment.
**Action:** Replace nested date loops with single-pass Map/Map-of-indices bucketing whenever aggregating time-series session data.
