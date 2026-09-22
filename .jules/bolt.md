## 2025-05-18 - Single-pass Map bucketing vs nested filtering for date analytics

**Learning:** Calculating weekly aggregated metrics using nested array filtering (O(7N)) with repeated ISO date parsing calls `format(parseISO(date))` introduces heavy CPU overhead when processing large session logs. By pre-populating a Map for the 7 target dates and doing a single pass (O(N)), date parsing and formatting calls are reduced by 7x.

**Action:** When aggregating time-series session or event data by calendar buckets, pre-allocate the target bucket map and perform single-pass accumulation instead of repeated filtering.
