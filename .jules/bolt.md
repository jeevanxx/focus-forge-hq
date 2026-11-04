## 2025-05-14 - Timezone-Aware Single-Pass Map Bucketing

**Learning:** Aggregating date-based metrics like `getWeeklyFocus` via repeated `.filter()` over calendar categories caused an O(7N) bottleneck with 7 redundant `parseISO` and `format` calls per session. However, replacing timezone-aware parsing with naive string slicing (`s.date.slice(0, 10)`) causes subtle off-by-one errors for users in non-UTC time zones.
**Action:** Retain timezone-correct parsing via `format(parseISO(s.date), "yyyy-MM-dd")`, but perform it in a single O(N) pass by pre-populating a `Map<string, number>` keyed by the target week's formatted dates, achieving an ~7x speedup while maintaining strict timezone accuracy.
