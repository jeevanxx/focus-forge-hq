# Finish Focus Forge: from prototype to real app

Picking up the improvement roadmap, one step at a time. Steps 1-2 are already built but not yet connected; the rest is new.

## Step 1 — Turn on the finished pages
- Add the Settings page and the Reset Password page to the app's routes so they actually open.
- Add a gear icon in the top bar (desktop sidebar + mobile header) to reach Settings.
- Settings covers: display name, daily focus goal, change password, sign out.

## Step 2 — Password recovery
- "Forgot password?" link on the sign-in screen sends a reset email.
- The reset link opens the new page where a new password can be set, then signs the person in.

## Step 3 — Personal focus goal
- The dashboard's daily goal currently sits at a fixed 3 hours. Wire it to the goal chosen in Settings.

## Step 4 — First-time guidance
- Show the onboarding checklist on the dashboard for new accounts: add a first task, add a first habit, run a first focus session. It disappears once done or dismissed.
- Friendlier empty states on Tasks, Habits and Calendar.

## Step 5 — Reliability polish
- Clear success/failure messages on every save, edit and delete.
- Loading skeletons instead of blank areas while data loads.
- A friendly error screen if something crashes, instead of a white page.

## Step 6 — Installable app
- App manifest, name, theme colour and icons (192px and 512px) so it can be installed to a phone home screen.
- Real page title, description and social preview text.

## Technical notes
- Routes added in `src/App.tsx`: `/settings` (protected) and `/reset-password` (public).
- Recovery uses `resetPasswordForEmail` with `redirectTo: origin + '/reset-password'`; the page calls `updateUser({ password })`.
- Focus goal reads `profiles.focus_goal_min` via the existing `useProfile` hook.
- Onboarding dismissal stored in localStorage, completion derived from live task/habit/session counts.
- Error boundary component wrapping the router; skeletons via existing shadcn `Skeleton`.
- Manifest at `public/manifest.webmanifest` + generated icons, linked from `index.html`. No custom service worker.
- Typecheck (`tsgo --noEmit`) after each step.
