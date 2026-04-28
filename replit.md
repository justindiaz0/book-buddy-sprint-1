# BookBuddy Workspace

## Overview

pnpm workspace monorepo using TypeScript. BookBuddy is a polished MVP reading habit app for college students — a calming, forgiving, mobile-first web app that helps users build a consistent reading habit.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/bookbuddy), Tailwind CSS, wouter, TanStack Query, shadcn/ui, framer-motion, react-confetti
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Architecture

- `artifacts/bookbuddy/` — React + Vite frontend (served at `/`)
- `artifacts/api-server/` — Express backend (served at `/api`)
- `lib/api-spec/openapi.yaml` — OpenAPI 3.1 spec (source of truth)
- `lib/api-client-react/` — Generated React Query hooks
- `lib/api-zod/` — Generated Zod validation schemas
- `lib/db/` — Drizzle ORM database schema and client

## Database Schema

- `users` — single-user model (id=1 always), stores name, daily goal, reminder settings, dark mode
- `books` — reading list with progress tracking, completion state
- `reading_sessions` — individual reading sessions with pages/minutes, date

## Key API Endpoints

- `GET /api/users/me` — get current user (404 if not onboarded)
- `POST /api/users/onboard` — initial setup (creates user + first book)
- `GET /api/dashboard/summary` — main dashboard data (streak, momentum, current book, encouragement)
- `GET /api/dashboard/weekly` — 7-day activity breakdown
- `GET /api/dashboard/history` — calendar history by month
- `GET/POST /api/sessions` — reading session CRUD
- `GET/POST /api/books` — book library CRUD
- `POST /api/books/:id/complete` — mark book as finished
- `GET/PUT /api/settings` — user preferences

## App Screens

- `/` — Auth landing (brand, headline, sign up / sign in CTAs)
- `/auth/signup` — Sign up with email + password (redirects to /onboarding)
- `/auth/signin` — Sign in with email + password (redirects to /dashboard)
- `/onboarding` — New user setup flow (name, book, goals) — requires auth
- `/dashboard` — Home with current book, streak, weekly momentum (protected)
- `/session` — Live reading timer + session logger (protected)
- `/session/success` — Post-session celebration state (protected)
- `/history` — Calendar history view with monthly stats (protected)
- `/books` — Book library (protected)
- `/books/:id` — Book detail with completion (protected)
- `/settings` — Preferences (reminders, dark mode, goals, sign out) (protected)

## Auth Model

- `src/lib/auth.ts` — localStorage session management (structured for Supabase auth swap)
- Session key: `bookbuddy_auth` stores `{ email, createdAt }`
- `isAuthenticated()` used by ProtectedRoute component in App.tsx
- Sign out clears session and redirects to auth landing
- Dark mode is default (class="dark" on html element in index.html)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Design Notes

- Dark mode by default (warm amber accent on deep charcoal)
- Mobile-first with bottom navigation bar
- Forgiving streak logic — weekly momentum over harsh all-or-nothing streak
- Recovery UX — warm welcome-back messages after missed days
- Reminders are stored as settings but notifications are NOT sent (MVP note)
- Single-user app (user id=1 always)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
