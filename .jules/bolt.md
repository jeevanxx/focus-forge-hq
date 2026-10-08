## 2025-05-20 - Memoizing Dashboard Calculations Against Active Focus Timer Renders

**Learning:** `FocusContext` updates state every 1 second when the focus timer is active, triggering re-renders of consuming components such as `Dashboard`. Unmemoized calculations in `Dashboard` (e.g., date parsing across sessions, coach insights, and task sorting) ran on every single tick, consuming ~2.4ms per render.

**Action:** Group complex component calculations (task filtering, date lookups, coach insights, sorting) into `useMemo` hooks dependent on the actual source datasets (`tasks`, `sessions`, `habits`, `profile`, `todayKey`) to keep timer tick re-renders near instantaneous (~0.02ms).
