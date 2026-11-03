## 2025-03-10 - O(N) Map bucketing for weekly analytics

**Learning:** `getWeeklyFocus` previously used nested `sessions.filter` calls over each day of the week, resulting in O(7N) array iterations and 7x redundant date parsing/formatting calls with `parseISO` and `format`. Converting to pre-allocated Map bucketing reduced execution time from ~770ms to ~109ms per call on 14,000 sessions (~7x speedup).

**Action:** When aggregating items across fixed categories (like days of the week or categories), pre-fill the output array and Map lookup to perform single-pass O(N) accumulation rather than nested filtering.
