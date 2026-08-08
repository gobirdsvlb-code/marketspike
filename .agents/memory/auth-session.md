---
name: Auth & Session Architecture
description: Authentication approach — migrated from express-session+bcryptjs to Clerk with JIT local user provisioning.
---

# Auth Architecture (Clerk)

## Backend

- `@clerk/express` middleware in `artifacts/api-server/src/app.ts`
- Clerk proxy at `CLERK_PROXY_PATH = '/api/__clerk'` (no-op in dev, active in production)
- `clerkMiddleware` uses `publishableKeyFromHost` so the key resolves per-domain
- `requireAuth` middleware in `artifacts/api-server/src/middleware/requireAuth.ts`:
  - Calls `getAuth(req)` to get `clerkUserId` (string like `user_xxx`)
  - Looks up local DB user by `clerkUserId` column
  - JIT provisions a new local user row (via `createClerkClient`) on first sign-in
  - Sets `(req as any).userId = localUser.id` (integer) for all downstream routes
- All routes access `(req as any).userId` — replaced `req.session.userId` globally via sed

## Database

- `users` table has a `clerk_user_id TEXT UNIQUE` column (migration: `ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_user_id TEXT UNIQUE`)
- Schema: `lib/db/src/schema/users.ts` has `clerkUserId: text("clerk_user_id").unique()`

## Frontend

- `ClerkProvider` wraps the app (inside `WouterRouter`, outside `QueryClientProvider`)
- `publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)` — never use raw env var
- `proxyUrl={import.meta.env.VITE_CLERK_PROXY_URL}` — empty in dev, intentional
- Sign-in/sign-up at `/sign-in/*?` and `/sign-up/*?` (wouter path with `/*?` for Clerk OAuth sub-paths)
- `AuthContext.tsx` keeps the same `useAuth()` interface backed by Clerk's `useUser()` + `useClerk()`
- `user` in `useAuth()` = local DB user from `useGetCurrentUser()` (enabled when Clerk isSignedIn)
- `openAuthModal()` → Clerk's `openSignIn()`; `logout()` → Clerk's `signOut()` + `queryClient.clear()`

## Tailwind v4 + Clerk

- `@layer theme, base, clerk, components, utilities;` before `@import 'tailwindcss'` in index.css
- `tailwindcss({ optimize: false })` in vite.config.ts

## Pre-existing TypeScript gaps (not Clerk-related)

- Generated `User` type in `@workspace/api-client-react` is missing `coins`, `tier`, `unlockedColors`, `email`
- These fields exist at runtime; only TypeScript annotations are stale
- Vite builds fine with these errors

**Why:** Clerk was chosen for Google/Apple OAuth without building it ourselves. `publishableKeyFromHost` is mandatory to avoid hardcoding keys per-environment. JIT provisioning preserves the integer PK model so all routes work without touching their business logic.

**How to apply:** Any new protected route should use `requireAuth` middleware and access the local user ID via `(req as any).userId`.
