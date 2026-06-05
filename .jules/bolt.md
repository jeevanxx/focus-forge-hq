# Bolt's Performance Journal ⚡

## 2026-06-05 - Date Operation Overhead in Single-Pass Reductions
**Learning:** Calling date parsing or formatting functions (like `parseISO` or `format` from `date-fns`) inside a reduction loop for a large dataset (e.g., 10,000 sessions) is significantly more expensive than the logic itself. Even in a single-pass $O(N)$ loop, these calls can become the bottleneck.
**Action:** Minimize date-related transformations within loops. Use cheaper alternatives like `differenceInCalendarDays` for bucketing or perform comparisons on raw strings/dates whenever possible before formatting the final output.
