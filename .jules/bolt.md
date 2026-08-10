# Bolt Journal

## 2025-02-18 - Optimized Weekly Focus Time timezone-aware calculation
**Learning:** In the initial implementation, `getWeeklyFocus` filtered all focus sessions for each of the 7 days of the week, resulting in an O(7N) complexity with repeated expensive parsing of ISO dates inside the loops. Using a Map lookup allows us to pre-compute the dates of the week, iterate through sessions only once (O(N)), parse dates efficiently, and map them in constant time.
**Action:** Replace nested loops/filtering with pre-filled maps and single-pass iterations.
