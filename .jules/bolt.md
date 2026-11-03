## 2026-10-21 - TaskCard Memoization and Stable Handlers
**Learning:** In list views containing interactive animated cards (like `TaskCard` using Framer Motion), parent re-renders caused by search inputs or timers re-trigger component renders for all list items unless `TaskCard` is wrapped in `React.memo` and callback handler props (`onToggle`, `onEdit`, `onDelete`) maintain stable identities via `useCallback`.
**Action:** Always pair `React.memo` on list item components with `useCallback` for event handler callbacks in the parent component to guarantee re-renders are skipped.
