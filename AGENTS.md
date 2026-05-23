# Agent Handoff Guide

## Goal of this file

This document is for any future coding agent that starts working on this repository. It summarizes the current implementation, expected constraints, team workflow, and communication conventions so context is not lost between sessions or between developers.

---

## Repository state

### Implemented

- Docker Compose local environment (PostgreSQL 15, Express backend, Next.js frontend, Node simulator)
- PostgreSQL schema with devices, orders, telemetry, alerts, users, campus_points, time_slots, event_logs
- Backend API endpoints: `/api/devices`, `/api/dashboard/kpis`, `/api/telemetry`, `/api/campus-points`
- Frontend dashboard with KPI cards and device grid with 3s polling
- Simulator web UI at port 8000 for controlling device states

### Not implemented

- Auth / JWT / sessions
- Orders CRUD pages and functionality
- Device detail/monitor page
- Users management page
- Alerts page
- Reports page
- WebSockets

---

## Branch strategy

```
main (stable, protected)
└── dev (integration branch, feature base)
    ├── feat/reservas
    ├── feat/bitacora
    └── feat/alertas
```

**Rules:**

1. All feature work starts from `dev` in a new independent branch: `git checkout dev && git checkout -b feat/nombre-feature`
2. Never commit directly to `main` or `dev`
3. All work stays in feature branches; create a Pull Request (PR) to `dev` when ready
4. PR title format: `feat: short description` or `fix: short description`
5. PR description must include: what changed, how to test it, and any notes for reviewers

**Working on a feature that depends on another?**

If you're building "bitacora" but "reservas" is not merged yet:
1. Build your feature in a branch from `dev` using **mock data** or **interface stubs**
2. Document exactly what you need from the other feature in your PR description
3. Use the "Contract interface" section below to write down the expected API/data shape

---

## Communication contract between features

When one developer starts a feature that another developer will continue (or that depends on another not-yet-built feature), the **starting developer must document**:

### Contract interface template

```markdown
## Contract: [Feature que necesito]

### Endpoint que espero
GET/POST/PATCH /api/lo-que-sea
Request body: { ... }
Response: { ... }

### Datos que necesito de otra feature
- De la feature [nombre]: necesito [estructura de datos específica]

### Estado actual esperado
- Si el dispositivo está en X, espero que viene con Y
- Si no hay datos, el campo es null/undefined

### Notas para quien continúe
- [cualquier decisión de diseño que tomaste que el otro necesita saber]
```

### Example

> **Dev building "reservas" leaves this for "bitacora" developer:**

```markdown
## Contract: Reservas → Bitácora

### Lo que ya está en la BD
- Tabla `orders` con campos: id, type, status, device_id, operator_id, origin_point_id, destination_point_id, sender_email, recipient_email, qr_hash, qr_scanned_at, created_at, updated_at
- Tabla `time_slots` con: id, device_id, start_time, end_time, order_id
- Tabla `event_logs` con: id, order_id, event_type, description, created_at

### Endpoint que expongo (disponible desde ahora)
GET /api/orders?status=pending
Response: [{ id, type, status, deviceId, operatorId, originPointId, destinationPointId, createdAt }]

### Lo que bitácora necesita de mí
- Cuando se cree una orden, necesito que me llamen POST /api/orders para crear
- Cuando cambie el estado de una orden, necesito que me llamen PATCH /api/orders/:id con { status: "in_progress" }

### Lo que yo necesito de bitácora (todavía no existe)
- Cuándo un dispositivo termina su ruta: necesito que me llamen PATCH /api/orders/:id con { status: "completed" }
- Cuándo，取消 una orden: necesito que me llamen PATCH /api/orders/:id con { status: "cancelled", cancellationReason: "..." }
```

---

## Current API contracts

### GET /api/devices
```typescript
Response: Device[]
Device: {
  id: string
  name: string
  code: string         // e.g. "RBT-01", "DRN-01"
  type: "robot" | "drone"
  status: "available" | "in_mission" | "blocked"
  subStatus: SubStatus | null
  SubStatus: "en_base" | "cargando" | "bateria_baja" | "sin_senal" | "mantenimiento"
  batteryLevel: number
  accumulatedKm: number
  flightHours: number
  currentRoute: { origin: string; destination: string } | null
}
```

### GET /api/dashboard/kpis
```typescript
Response: {
  ordersInProgress: number
  devicesAvailable: number
  ordersCompletedToday: number
  ordersCancelledToday: number
}
```

### PATCH /api/devices/:id
```typescript
Request: {
  status?: "available" | "in_mission" | "blocked"
  subStatus?: SubStatus | null
  batteryLevel?: number
  accumulatedKm?: number
  flightHours?: number
  currentRoute?: { origin: string; destination: string } | null
}
Response: { success: true }
```

### POST /api/telemetry
```typescript
Request: {
  deviceId: string
  latitude: number
  longitude: number
  batteryLevel: number
  speed?: number
  missionStatus?: string
  signalLost?: boolean
}
Response: { success: true }
```

---

## Database schema

Key tables: `devices`, `orders`, `telemetry`, `alerts`, `users`, `campus_points`, `time_slots`, `event_logs`

Important:
- `devices` table has `sub_status`, `current_route_origin`, `current_route_destination` columns
- `campus_points` is seeded on first init with 8 locations
- UUID primary keys use `gen_random_uuid()`
- Trigger-based `updated_at` on all tables

When changing schema:
1. Update `database/init.sql`
2. Update `docs/DATABASE.md`
3. Document that `docker compose down -v` is required to apply

---

## Team conventions

- **Never commit `.env`**. It has secrets.
- **Never run `npm install` or `pip install` outside Docker**. Use `docker compose exec <service> npm install <package>`.
- Use `lucide-react` only for icons. No emoji, no Heroicons, no custom SVGs.
- Changes to `frontend/`, `backend/`, `simulator/` code are reflected via volume mounts without rebuild.
- After changing `Dockerfile`, `package.json`, or dependencies: `docker compose up --build`.

---

## Documentation map

| File | Purpose |
|------|---------|
| `README.md` | Entry point, project overview |
| `SPEC.md` | Product requirements |
| `AGENTS.md` | This file — for agents and developers |
| `docs/DEVS.md` | Local setup, Docker workflow, team commands |
| `docs/DATABASE.md` | Schema reference |
| `docs/DESIGN_SYSTEM.md` | UI tokens and component rules |

---

## Where things are

```
backend/
  src/
    index.ts           # Express server bootstrap
    db.ts              # PostgreSQL connection pool
    types.ts           # Shared TypeScript types
    routes/
      devices.ts       # GET /api/devices, PATCH /api/devices/:id
      dashboard.ts     # GET /api/dashboard/kpis
      telemetry.ts     # POST /api/telemetry
      campus-points.ts # GET /api/campus-points

frontend/
  app/
    page.tsx           # Dashboard (KPI cards + device grid)
    orders/            # Placeholder pages
    devices/           # Placeholder
  components/
    dashboard/         # KpiCard
    device/            # DeviceCard, BatteryIndicator, DeviceStatusBadge
    ui/                # Button, Badge, Input (shadcn-like)
  types/
    device.ts          # Device, DashboardKpis types

simulator/
  server.js           # Express proxy + static UI
  index.html           # Device control panel UI

database/
  init.sql             # Schema + seeds (devices, campus_points)
```

---

## Agent cautions

- Do not assume documentation older than this file is accurate. Check code.
- If you touch navigation or shell behavior, verify route highlighting manually.
- If you change Dockerfiles, Compose mounts, or dependency manifests, rebuild with `docker compose up --build`.
- The simulator runs on port 8000 and proxies to backend at port 4000.