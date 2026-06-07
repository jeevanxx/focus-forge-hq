## 2026-06-06 - [O(N) vs O(N*M) in Analytics]
**Learning:** Functions that perform filtering or searching within a loop over the same dataset create an O(N*M) complexity. In the analytics engine, getWeeklyFocus was filtering the entire sessions array for each of the 7 days of the week, causing significant slowdown as the dataset grows.
**Action:** Use a single-pass O(N) iteration and bucket the results using a hash map or indexed array (e.g. using date-fns differenceInCalendarDays for bucketing) to ensure O(N) performance.
