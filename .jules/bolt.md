# Bolt's Performance Journal

## 2026-05-11 - Calendar-Based O(N) Weekly Focus Optimization
**Learning:** The previous implementation of `getWeeklyFocus` in `src/lib/analytics.ts` ran in $O(7N)$ time by filtering focus sessions for each day of the week, executing expensive `date-fns` parsing (`parseISO`) and formatting (`format`) 7 times per session. Switching to a single-pass $O(N)$ iteration by calculating bucket offsets directly using `differenceInCalendarDays` from `date-fns` avoids repetitive date parsing/formatting. Normalizing the week start date (`weekStart.setHours(0, 0, 0, 0)`) is critical to ensure accurate, DST-safe calendar day offset calculations.
**Action:** Always prefer single-pass bucketing over nested filtering/reduction when grouping datasets by calendar bounds, and normalize boundary limits to midnight to prevent off-by-one errors from timezones/DST.
