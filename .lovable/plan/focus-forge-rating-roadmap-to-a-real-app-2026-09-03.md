# Focus Forge — Rating & Roadmap to a Real App

## Honest rating today: 7.5 / 10

**What's genuinely strong**
- Live backend: auth (email + Google), per-user data, RLS-secured tables — the core of a real SaaS exists.
- Premium, distinctive UI: Cyan Ice design system, glassmorphism, glow, staggered motion, dramatic dashboard hero.
- Working feature loop: create task → start focus session → session logged → analytics reflect it. Habits compute real streaks.
- AI Coach is real (edge function + AI gateway, data-aware context), not a mock.

**What keeps it from feeling "real"**
- No way to edit or delete tasks/habits (create-and-complete only).
- No profile/settings surface — can't change password, display name, or sign out from a settings page.
- No password reset flow — a user who forgets their password is locked out permanently.
- No notifications/reminders — a discipline app with no nudge engine.
- Error handling is thin (mutations fail silently in places); no offline/loading polish beyond skeletons.
- No onboarding — a brand-new user lands on an empty dashboard with no guidance.
- Not published as a PWA — no install, no app icon on phone home screens.

## Plan — Phase 5: Make it a real app

### 1. Core CRUD gaps (highest impact)
- Edit + delete for tasks (inline edit in TaskCard or an edit dialog; delete with confirm).
- Edit + delete for habits.
- Reorder / reschedule tasks from the Tasks page.

### 2. Account & recovery
- "Forgot password" link on the auth page + `/reset-password` page (set new password via recovery link).
- Settings page: display name, change password (with current password), sign out, focus goal (replace hardcoded 180 min/day).

### 3. Onboarding & empty states
- First-login checklist: "Add your first task", "Create a habit", "Start a 25-min focus" — with progress, dismissible.
- Seed-free friendly empty states with one-tap starter actions.

### 4. Reliability polish
- Toast feedback on every failed mutation (currently some fail silently).
- Confirm destructive actions; optimistic updates already exist — add rollback toasts.

### 5. Mobile real-app feel (PWA)
- Web app manifest + icons so it can be installed on a phone home screen; standalone display mode.
- Note: OAuth redirect paths will be excluded from any service-worker caching.

### 6. Nice-to-haves (pick later, not in this phase)
- Email reminders for overdue tasks (edge function + cron).
- Weekly coach summary email.
- Streak freeze / habit pause.

## Technical details
- `/reset-password` is a public route checking `type=recovery` in the URL hash, calling `supabase.auth.updateUser({ password })`.
- Change password uses `updateUser({ password, current_password })` for signed-in users.
- Settings stored in the existing `profiles` table (add `display_name`, `focus_goal_min` columns via migration with GRANTs/RLS already in place).
- PWA: `public/manifest.webmanifest` + generated icons + meta tags; no custom service worker needed beyond installability.

## Outcome
After this phase the app covers the full user lifecycle: discover → sign up (email/Google) → onboard → daily use with full edit control → recover account → install on phone. That's the bar for "a real app."
