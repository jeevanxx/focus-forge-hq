## 2026-05-11 - Timezone-Aware O(N) getWeeklyFocus Optimization
**Learning:** Nested O(7N) aggregation loops that perform heavy parsing (`parseISO`) and formatting (`format`) on date strings inside the loop are extremely slow. Switching to an O(N) single-pass iteration using a pre-filled O(1) hash map lookup yields an ~5x performance improvement while maintaining strict timezone and DST correctness with `date-fns`.
**Action:** Always prefer single-pass aggregation using hashed lookups for time-series / date-based metrics instead of nested loops with repeated parsing.
