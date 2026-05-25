# Fleet Control PUJ

Fleet Control PUJ is an internal operations dashboard for autonomous delivery robots and event-recording drones at Pontificia Universidad Javeriana Cali. The product has two roles, `operator` and `administrator`, and will eventually coordinate orders, telemetry, alerts, weather restrictions, QR-based delivery flows, and a Python simulator.

## Demo Scope

This codebase is a **working demo** that implements **10 specific requirements** (RF-01, RF-04, RF-05, RF-06, RF-09, RF-18, RF-19, RF-20, RF-21, RF-23) out of the 60 modeled for the complete system. The goal is that these 10 requirements work correctly and match their specification exactly.

See [SPEC.md](SPEC.md) for the full context.

Current repository status:
- Frontend shell initialized in Next.js with header, bottom dock, demo navigation, and placeholder pages.
- Backend initialized in Express + TypeScript with only the base server bootstrapped.
- PostgreSQL schema initialized through Docker via `database/init.sql`.
- Simulator folder is still a placeholder.

To run the project: create `.env` from `.env.example`, then use `docker compose up --build` the first time. After that, normal development uses `docker compose up`. Full workflow: [docs/DEVS.md](/home/jdavidruanob/code/autonomous-fleet-manager/docs/DEVS.md).

Core project context:
- Product and functional scope: [SPEC.md](/home/jdavidruanob/code/autonomous-fleet-manager/SPEC.md)
- Agent handoff and implementation status: [AGENTS.md](/home/jdavidruanob/code/autonomous-fleet-manager/AGENTS.md)
- Database reference: [docs/DATABASE.md](/home/jdavidruanob/code/autonomous-fleet-manager/docs/DATABASE.md)
- Design system reference: [docs/DESIGN_SYSTEM.md](/home/jdavidruanob/code/autonomous-fleet-manager/docs/DESIGN_SYSTEM.md)

## Folder Structure

```text
.
├── AGENTS.md
├── SPEC.md
├── .devcontainer/
├── backend/
├── database/
├── docs/
├── docker-compose.yml
├── frontend/
└── simulator/
```
