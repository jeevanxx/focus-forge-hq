# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start dev server on port 8080

# Build
npm run build        # Production build
npm run build:dev    # Dev-mode build

# Lint
npm run lint         # ESLint over entire codebase

# Tests
npm run test         # Run all tests once (vitest run)
npm run test:watch   # Run tests in watch mode

# Preview production build
npm run preview
```

To run a single test file:
```bash
npx vitest run src/path/to/file.test.ts
```

## Architecture Overview

**Focus Forge** is a productivity/discipline app ("Discipline OS") built on React 18 + TypeScript + Vite. It is currently in **Phase 1** (frontend-only with mock data). Phase 2 will replace mock data with live Supabase database queries.

### Provider Stack (App.tsx, top-down)

```
QueryClientProvider (React Query — configured but no queries active yet)
  └─ TooltipProvider
      └─ Toaster (Sonner + react-hot-toast)
          └─ BrowserRouter
              └─ AuthProvider (Supabase auth, see src/context/AuthContext.tsx)
                  └─ Routes (protected via <ProtectedRoute>)
```

### Pages & Routing

Six protected routes + one public auth route, all rendered inside `<AppShell>` (sidebar + mobile nav + floating AI coach button):

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Dashboard | Today's tasks, active focus timer |
| `/calendar` | CalendarPage | Week view, task scheduling |
| `/tasks` | Tasks | Full task backlog with filters |
| `/habits` | Habits | Habit tracking |
| `/analytics` | Analytics | 7-day productivity metrics (Recharts) |
| `/auth` | AuthPage | Email/password sign in/up (public) |

### Data Flow (Phase 1)

All data lives in `src/lib/mock-data.ts` as typed arrays (`mockTasks`, `mockHabits`, `mockSessions`). Pages import these directly and manage mutations with local React state. **React Query is wired up but has zero active hooks**; it will be used when Supabase DB tables are created.

Analytics calculations are pure functions in `src/lib/analytics.ts` — pass in the arrays, get back metrics. This file is designed so swapping mock arrays for Supabase query results requires no logic changes.

### Supabase Integration

- Two client files exist: `src/integrations/supabase/client.ts` (primary) and `src/lib/supabase.ts` (secondary). Use the `src/integrations/supabase/client.ts` one for new code.
- Auth (email/password) is fully functional. The `AuthContext` wraps the Supabase `onAuthStateChange` listener.
- DB types in `src/integrations/supabase/types.ts` are auto-generated scaffolding — currently empty. Run `supabase gen types typescript` after schema changes.
- Credentials are in `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`).

### Design System

Colors are defined as HSL CSS custom properties in `src/index.css` (`:root` block) and consumed via Tailwind tokens — never use raw hex values. Key custom tokens:

- `gradient-ember`, `gradient-card`, `gradient-glow` — brand gradients
- `shadow-glow-primary` — ember glow effect
- Animations: `ember-pulse`, `float`, `fade-up`, `shimmer` (Tailwind keyframes)
- Easing vars: `--ease-out-expo`, `--ease-spring`

Dark mode is class-based (`darkMode: 'class'` in `tailwind.config.ts`).

### UI Components

All UI primitives come from **shadcn/ui** (`src/components/ui/`). Add new primitives via `npx shadcn-ui@latest add <component>` — do not hand-write Radix wrappers. Compound components (e.g., `TaskCard`, `HabitRow`, `FocusTimer`) live directly in `src/components/`.

### TypeScript Config

`tsconfig.json` is intentionally loose: `noImplicitAny: false`, `strictNullChecks: false`. Do not tighten these globally — it will break existing code.

Path alias `@/*` maps to `src/*`. Always use it for imports.

### AI Coach (AssistantPanel)

`src/components/assistant/AssistantPanel.tsx` is a rule-based context-aware coach (not LLM-backed). It reads time-of-day, task priority, and overdue state to pick reply patterns. When integrating a real LLM, this is the file to modify.
