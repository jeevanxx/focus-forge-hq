## 2025-01-15 - Single-pass O(N) weekly focus aggregation

**Learning:** `getWeeklyFocus` originally iterated through all sessions 7 times (once per weekday label), parsing and formatting ISO dates on every pass ($O(7N)$). By pre-building a date index `Map` for the 7 days of the target week, we can aggregate focus minutes in a single pass over `sessions` ($O(N)$), while preserving timezone correctness with `format(parseISO(session.date), "yyyy-MM-dd")`.

**Action:** Whenever aggregating temporal data across fixed buckets (e.g. days of week/month), pre-index the date keys into a lookup map or object to avoid nested array filtering and repetitive date parsing.
