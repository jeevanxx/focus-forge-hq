## 2025-05-22 - O(N) Analytics Bucketing
**Learning:** Redundant date parsing and formatting inside loops ($O(N \times 7)$) is a primary performance bottleneck in analytics calculations. `differenceInCalendarDays` from `date-fns` is significantly more performant than string-based formatting for bucketing temporal data into array indexes during $O(N)$ loops.
**Action:** Always prefer direct date comparisons and index-based bucketing for temporal data aggregation.

## 2025-05-22 - Stabilizing "Now" for Analytics
**Learning:** In pages with frequently recalculating analytics (like `Analytics.tsx`), using `new Date()` directly in the render body or as a dependency triggers constant recalculations. Stabilizing it with `useMemo(() => new Date(), [])` prevents invalidating the dependency arrays of downstream `useMemo` hooks.
**Action:** Stabilize current date references at the top level of analytical components.
