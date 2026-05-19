## 2025-05-22 - [Optimizing Date Matching in Loops]
**Learning:** Using `format(parseISO(date), "yyyy-MM-dd")` inside large loops (e.g., 10,000+ iterations) is extremely expensive due to object instantiation and parsing logic. ISO-8601 strings can be reliably compared using `date.slice(0, 10)` for date-only matching, which is orders of magnitude faster.
**Action:** Always prefer string slicing or direct boundary comparisons (`date >= start && date < end`) over repeated date parsing in hot loops.

## 2025-05-22 - [Memoizing Time-Sensitive Derived State]
**Learning:** Analytics functions that take `now: Date` as an argument will trigger re-renders or bypass `useMemo` if `new Date()` is called in the component body.
**Action:** Stabilize the "now" reference using `useMemo(() => new Date(), [])` to ensure downstream memoized calculations remain stable.
