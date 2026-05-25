# Fleet Control PUJ Specification

## Purpose

Fleet Control PUJ is an internal operations system for Pontificia Universidad Javeriana Cali. It manages a simulated fleet of autonomous robots and drones used for two institutional services:

- Package delivery between predefined campus points
- Event recording at campus locations

This is not a public-facing product. It is an internal dashboard for staff.

## Important Context — Demo Scope

This codebase is a **working demo** that implements **10 specific requirements** out of the 60 modeled for the complete system. The goal of this demo is to demonstrate that those 10 requirements work correctly and match their specification exactly.

The 10 implemented requirements are:

| ID | Requirement |
|----|-------------|
| RF-01 | Autenticación, Control de Acceso y Reportes |
| RF-04 | Gestión de Puntos Predefinidos de Encuentro |
| RF-05 | Creación de Orden de Servicio tipo Entrega |
| RF-06 | Gestión de Franja Horaria para Entrega |
| RF-09 | Emisión del Código QR a Ambas Partes |
| RF-18 | Consulta y Filtrado de Bitácora |
| RF-19 | Panel de Monitoreo de Flota en Tiempo Real |
| RF-20 | Streaming de Cámara por Dispositivo |
| RF-21 | Alerta por Pérdida de Señal |
| RF-23 | Bloqueo Automático por Mantenimiento |

The full requirement specification is available at `/home/jdavidruanob/Downloads/requisites.md`.

**Every implementation decision must serve these 10 requirements.** Agents and developers should reference that file when building features to ensure the behavior matches the specification exactly.

## Roles

- `operator`
  Creates orders and monitors their execution.
- `administrator`
  Can do everything an operator can do, plus manage devices and users.

## Services

### Delivery

- May use robots or drones
- Uses predefined `campus_points`
- Requires sender and recipient institutional emails
- Generates a QR code per order
- Recipient must scan the QR within 2 minutes or the order is auto-cancelled and the device returns to base

### Recording

- Drone only
- Uses campus locations
- Uses a longer time slot than delivery

## Core behaviors

- No double booking per device and time slot
- Real-time telemetry via WebSockets
- Live camera stream placeholder in the UI
- Automatic alerts for:
  - signal loss
  - low battery
  - maintenance required
  - weather restrictions
  - delivery timeout
- Order lifecycle:
  - `pending`
  - `in_progress`
  - `completed`
  - `cancelled`
- Drone operations restricted by weather using OpenWeatherMap
- Device auto-maintenance block after:
  - 300 km accumulated usage
  - 50 flight hours for drones

## Technical architecture

- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL 15
- Realtime: Socket.io
- Simulator: standalone Python service
- Runtime standard: Docker Compose for all team members

## Current implementation status

Implemented now:

- Docker-based local development workflow
- PostgreSQL bootstrap schema in `database/init.sql`
- Next.js application shell with:
  - sticky header
  - bottom dock navigation
  - demo role switcher
  - placeholder pages for main sections
- Base UI primitives:
  - `Button`
  - `Input`
  - `Badge`

Not implemented yet:

- Authentication
- API routes and business logic
- Real database access from backend
- Socket.io transport
- QR generation and email delivery
- Weather integration
- Simulator logic
- Real CRUD pages

## Non-negotiable UI constraints

- All icons must come from `lucide-react`
- No other icon library is allowed
- No SVG asset folder for icons
- No emoji as icons

## Source of truth

- Product scope: this file
- Development workflow: `docs/DEVS.md`
- Database contract: `docs/DATABASE.md`
- UI patterns and tokens: `docs/DESIGN_SYSTEM.md`
- Agent handoff and implementation map: `AGENTS.md`
