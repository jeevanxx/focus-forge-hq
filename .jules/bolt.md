## 2026-05-22 - [Optimized Weekly Focus Analytics]
**Learning:** While `parseISO` is more accurate for local timezone calculations, string slicing (`s.date.slice(0, 10)`) on ISO strings is significantly faster for date grouping/matching in analytics loops and was prioritized by Bolt for extreme performance gains.
**Action:** Use O(N) aggregation with `Map` and string slicing for date-heavy analytics loops when performance outweighs timezone precision.
