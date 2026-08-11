## 2025-02-14 - Timezone-Aware Single-Pass Analytics Speedup
**Learning:** Nested filtering inside loops (like `sessions.filter(...)` inside a map of 7 days) causes an unnecessary O(7N) complexity with repeated costly `format(parseISO(...))` calculations. Pre-allocating day buckets based on calendar dates and using single-pass hash map style aggregation is much faster.
**Action:** Always pre-initialize known categorical/date-based bins and aggregate collections in a single-pass O(N) loop rather than performing nested scans.
