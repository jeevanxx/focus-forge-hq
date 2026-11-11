# Bolt's Journal

## Critical Learnings Only

## 2026-03-24 - Single-pass Date Bucketing vs. String Slicing in Analytics
**Learning:** Naively attempting to optimize `format(parseISO(s.date), 'yyyy-MM-dd')` via string slicing (e.g. `s.date.slice(0, 10)`) can introduce timezone mismatches across UTC and local browser offsets. Switching from nested O(7N) filtering to a single-pass O(N) iteration with Map lookup retains timezone safety while achieving a ~7-8x speedup.
**Action:** When optimizing date-grouped calculations, prioritize reducing algorithmic pass complexity O(7N) -> O(N) before micro-optimizing date parsers to avoid timezone bugs.
