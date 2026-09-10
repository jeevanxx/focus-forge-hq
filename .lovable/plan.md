# Focus Forge: from 8/10 to 9/10

Four improvements that turn the app from "solid" into "dependable daily tool". Each step ships independently.

## Step 1 — Real coach insight
- The dashboard "Coach insight" card currently shows fixed text ("38% more before 10am"). Replace it with a message computed from the person's actual sessions and tasks (best focus hour, completion trend, overdue high-priority tasks), using the existing analytics helpers.

## Step 2 — Gentle reminders
- Optional daily reminder toggle in Settings (stored on the profile).
- In-app nudge banner when a high-priority task is overdue or the daily focus goal is unmet by late afternoon.

## Step 3 — Streak freeze
- Habits get one "freeze" per week: a missed day consumes the freeze instead of resetting the streak to zero. Shown on the habit row so it never feels like a silent bug.

## Step 4 — Data export
- A "Download my data" button in Settings that exports tasks, habits and focus sessions as a CSV/JSON file the person owns.

## Technical notes
- Coach insight: pure client-side computation in `src/lib/analytics.ts` (e.g. `getCoachInsight(tasks, sessions)`); no new backend calls.
- Reminders: `profiles.reminder_enabled boolean default false`; banner logic in Dashboard, no push notifications in this step.
- Streak freeze: `habits.freezes_used integer` + week-aware streak recalculation in `useHabits.ts`; migration with GRANT not needed (existing table/columns only add columns to `habits`).
- Export: build CSV in the browser via existing hooks, trigger a download — no storage or functions needed.
- Typecheck (`tsgo --noEmit`) after each step.
