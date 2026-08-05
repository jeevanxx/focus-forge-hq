# Focus Forge — what's done and what's left

Short answer: the frontend is finished, the product is not. Every page still runs on mock data in `src/lib/mock-data.ts`, so nothing a user creates persists.

## Done
- Full UI: Dashboard, Tasks, Calendar, Habits, Analytics, focus timer, assistant panel
- Cyan Ice design system, depth/motion polish, mobile-friendly layouts
- Analytics engine as pure functions in `src/lib/analytics.ts` (already shaped to accept DB rows)
- Email/password auth with `AuthContext`, `ProtectedRoute`, `/auth` page

## Not done
1. No database — no tables for tasks, habits, habit check-ins, or focus sessions
2. All pages read arrays from `mock-data.ts`; create/edit/complete actions are local state only
3. The AI coach replies from hardcoded rules, not a real model
4. The app uses a hand-rolled client (`src/lib/supabase.ts`) fed by build-time env vars instead of the project's generated client, which is fragile

## Proposed finish line

**Phase 1 — Database**
Tables: `profiles`, `tasks`, `habits`, `habit_entries`, `focus_sessions`. Each row owned by `user_id`, row-level security so users only see their own data, plus a trigger creating a profile on signup.

**Phase 2 — Wire the UI**
Replace mock imports with React Query hooks per entity. Real create/update/delete for tasks and habits, real habit check-ins, and focus sessions recorded when a timer completes. Analytics functions get fed live rows — no changes needed to their logic.

**Phase 3 — Real AI coach**
An edge function calling the Lovable AI gateway (Gemini, no API key needed), given the user's actual tasks, streaks, and recent focus history, keeping the strict-coach persona and the "Start N min" action.

**Phase 4 — Cleanup**
Switch to the generated `@/integrations/supabase/client`, delete `src/lib/supabase.ts` and the `define` shims in `vite.config.ts`, add Google sign-in, empty states, and loading skeletons.

## Technical notes
- Analytics stays pure; hooks map DB rows to `Task` / `FocusSession` / `Habit` types
- Optimistic updates on task completion and habit check-ins so the UI stays instant
- Streaks computed from `habit_entries` dates rather than a stored counter

Each phase is independently shippable — I can start at Phase 1 or do 1+2 together.
