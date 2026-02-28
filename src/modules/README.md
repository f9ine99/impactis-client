# Modular Monolith Layout

This project now uses domain modules under `src/modules`.

## Current modules

- `admin`: platform admin access helpers and route guards.
- `auth`: routing rules and authentication navigation policies.
- `engagements`: startup-advisor engagement request and prep-room workflow APIs.
- `organizations`: org identity, membership, and org provisioning APIs.
- `onboarding`: onboarding route and redirect target helpers.
- `profiles`: person identity data access.

## Conventions

- Route handlers and pages in `src/app` should stay thin and call module APIs.
- Shared infrastructure (Supabase clients, framework setup) remains in `src/lib`.
- Cross-module access should happen through each module's `index.ts` public API.
- SQL migrations for Supabase-backed modules live in `supabase/migrations`.

## Next modules to extract

- `analytics`
