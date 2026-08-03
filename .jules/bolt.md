## 2026-05-25 - Timezone & DST-Aware Single-Pass Analytics Optimization
**Learning:** Hardcoding week boundaries via millisecond math (e.g. `604800000` ms for 7 days) can fail on Daylight Saving Time (DST) transition weeks, skipping data during fall-back transitions (where weeks have 169 hours).
**Action:** Always compute calendar date and week boundaries using robust timezone-aware utilities such as `addDays` from `date-fns` to safely handle DST variance.
