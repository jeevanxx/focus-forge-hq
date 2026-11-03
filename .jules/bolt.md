## 2025-01-15 - Analytics Calculations Redundancy in Component Renders

**Learning:** Component renders in analytics dashboards often call multiple top-level pure functions (`getWeeklyFocus`, `getProductivityScore`, `getNextBestAction`) that internally call each other, causing $O(N)$ filtering and sorting loops to run 3+ times per render. Passing optional pre-computed metrics to downstream functions and wrapping top-level calculations in a single `useMemo` block completely eliminates duplicate array processing.

**Action:** When designing analytics helper modules, support optional pre-computed arguments or fast-paths so callers can compute values once and pass them downstream.
