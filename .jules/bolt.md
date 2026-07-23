# Bolt Performance Journal

## 2026-05-11 - O(7N) Date Formatting Anti-Pattern in Analytics
**Learning:** In `getWeeklyFocus`, calling `format(parseISO(s.date), "yyyy-MM-dd")` inside a `filter` nested under a 7-day loop creates an O(7N) operation with 7N expensive date parsing and string formatting operations. For large datasets, this severely blocks the main thread. By pre-filling a zero-initialized array and performing a single-pass O(N) iteration with `differenceInCalendarDays`, we can eliminate the nested loops and avoid repetitive date parsing/formatting.
**Action:** When calculating grouped analytics over a chronological range (such as daily aggregates for a week), always pre-fill the output array and use index-based grouping via day differences (e.g., `differenceInCalendarDays`) in a single pass to achieve O(N) complexity.
