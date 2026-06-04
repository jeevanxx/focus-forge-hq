# Bolt Performance Journal ⚡

## 2025-05-22 - Optimized weekly focus analytics
**Learning:** Derivative functions (like `getWeeklyFocusTotal` calling `getWeeklyFocus`) add overhead and can be O(N^2) or O(M*N) in effect if not careful. A direct O(N) sum is significantly faster (~12x in this case). Using `differenceInCalendarDays` is a fast way to map dates to week indices without repeated `format` calls.
**Action:** Always look for ways to collapse derivative calculations into single-pass iterations for large datasets.
