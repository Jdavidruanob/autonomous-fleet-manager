# Agent Handoff Guide

## Goal of this file

This document is for any future coding agent that starts working on this repository. It summarizes the current implementation, the expected constraints, and the safest next moves so context is not lost between sessions.

## Repository state

The project is still in skeleton phase.

Implemented:

- Docker Compose local environment
- PostgreSQL schema bootstrap through `database/init.sql`
- Next.js frontend shell
- Express backend bootstrap
- Placeholder simulator container

Not implemented:

- Auth
- Backend routes
- Database access layer
- WebSockets
- Domain services
- Real simulator behavior

## Current frontend state

The frontend already contains a reusable shell:

- `frontend/components/app/header.tsx`
- `frontend/components/app/dock.tsx`
- `frontend/components/app/app-shell.tsx`
- `frontend/components/app/app-state.tsx`

Available placeholder routes:

- `/`
- `/orders`
- `/orders/new`
- `/devices`
- `/reports`
- `/users`
- `/settings`
- `/profile`

The dock active-state bug for `/orders/new` vs `/orders` has already been fixed in [frontend/components/app/dock.tsx](/home/jdavidruanob/code/autonomous-fleet-manager/frontend/components/app/dock.tsx).

The role switcher in the header is demo-only state stored in React context. It is not auth.

## Current backend state

The backend only boots an Express server in [backend/src/index.ts](/home/jdavidruanob/code/autonomous-fleet-manager/backend/src/index.ts). There are no routes, controllers, services, validation layers, or database connections yet.

## Current database state

The database initializes from [database/init.sql](/home/jdavidruanob/code/autonomous-fleet-manager/database/init.sql).

Important facts:

- UUID primary keys use `gen_random_uuid()`
- Trigger-based `updated_at` exists on all current tables
- `campus_points` are seeded on first database initialization
- If the Postgres volume already exists, Docker will skip initialization as expected

When changing the schema:

- Update `database/init.sql`
- Update `docs/DATABASE.md`
- If the new schema must be re-applied locally from scratch, document that `docker compose down -v` is required

## Docker workflow assumptions

All development should work through Docker Compose.

Normal commands:

- First run or after dependency/image changes: `docker compose up --build`
- Normal daily start: `docker compose up`
- Stop and remove containers/network: `docker compose down`
- Reset database volume too: `docker compose down -v`

Linux note:

- Source bind mounts use `:Z` because the repository was tested on Linux/SELinux-like setups and without that label the containers can fail with `EACCES`.

## UI constraints

These are hard constraints and should not be casually broken:

- Use `lucide-react` only for icons
- Do not add `react-icons`, Heroicons, Phosphor, MUI icons, or custom SVG icon assets
- Do not use emoji as icons
- Preserve the current visual language already established in the shell and documented in `docs/DESIGN_SYSTEM.md`

## Documentation map

- [README.md](/home/jdavidruanob/code/autonomous-fleet-manager/README.md): entry point
- [SPEC.md](/home/jdavidruanob/code/autonomous-fleet-manager/SPEC.md): product requirements
- [docs/DEVS.md](/home/jdavidruanob/code/autonomous-fleet-manager/docs/DEVS.md): local setup and Docker workflow
- [docs/DATABASE.md](/home/jdavidruanob/code/autonomous-fleet-manager/docs/DATABASE.md): schema contract
- [docs/DESIGN_SYSTEM.md](/home/jdavidruanob/code/autonomous-fleet-manager/docs/DESIGN_SYSTEM.md): UI tokens and component rules

## Recommended next implementation order

1. Introduce backend structure: config, routes, controllers, services, database connection.
2. Add health endpoint and basic API contract.
3. Add authentication model and session/JWT flow.
4. Connect frontend shell to real auth and role data.
5. Implement orders, devices, users, and alerts incrementally.
6. Introduce Socket.io and simulator protocol after core CRUD is stable.

## Agent cautions

- Do not assume documentation older than this file is accurate unless it matches code.
- Prefer the actual code and `database/init.sql` over historical descriptions.
- If you touch navigation or shell behavior, verify route highlighting manually.
- If you change Dockerfiles, Compose mounts, or dependency manifests, rebuild with `docker compose up --build`.
