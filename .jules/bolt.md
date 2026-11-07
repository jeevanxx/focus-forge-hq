## 2026-11-07 - Single-Pass Map Bucketing for Timezone-Aware Aggregation

**Learning:** In date-based aggregation functions like `getWeeklyFocus`, filtering an array of sessions across each day of the week produces nested O(7N) complexity with repeated ISO parsing and formatting overhead ($7 \times N$). However, naive string slicing (`s.date.slice(0, 10)`) introduces timezone discrepancies for non-UTC locales. Using pre-allocated day buckets in a `Map` combined with single-pass iteration using `format(parseISO(s.date), "yyyy-MM-dd")` achieves a ~7-8x speedup while preserving timezone correctness.

**Action:** Whenever aggregating temporal entries into predefined date intervals, pre-populate target bucket keys in a hash map and perform a single linear pass over the data instead of repeated array filtering.
