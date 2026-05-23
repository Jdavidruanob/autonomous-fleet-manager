# Database Reference

## Source of truth

The current schema executed by Docker is [database/init.sql](/home/jdavidruanob/code/autonomous-fleet-manager/database/init.sql). This document is a human-readable reference for that file and must stay aligned with it.

## Runtime behavior

- Postgres version: 15
- UUID primary keys use `gen_random_uuid()`
- The schema is initialized automatically by Docker on first database creation
- `campus_points` are seeded during initialization
- If the volume already exists, Postgres skips initialization

To re-run the init script from scratch locally:

```bash
docker compose down -v
docker compose up --build
```

## Enums

- `user_role`: `operator`, `administrator`
- `device_type`: `robot`, `drone`
- `device_status`: `available`, `in_mission`, `blocked`, `maintenance`
- `order_type`: `delivery`, `recording`
- `order_status`: `pending`, `in_progress`, `completed`, `cancelled`
- `alert_type`: `signal_loss`, `low_battery`, `maintenance_required`, `weather_blocked`, `delivery_timeout`, `package_undelivered`

## Tables

### `users`

- `id` UUID primary key
- `email` unique institutional email with DB-level domain check
- `password_hash`
- `full_name`
- `role`
- `is_active`
- `last_login`
- `session_timeout_minutes`
- `created_at`
- `updated_at`

### `campus_points`

Static or admin-managed points for delivery and recording.

- `id`
- `name` unique
- `description`
- `latitude`
- `longitude`
- `is_active`
- `created_at`
- `updated_at`

### `devices`

Robots and drones.

- `id`
- `name`
- `code` unique
- `type`
- `status`
- `battery_level` with `0-100` constraint
- `accumulated_km`
- `flight_hours`
- `last_maintenance_date`
- `base_latitude`
- `base_longitude`
- `created_at`
- `updated_at`

### `time_slots`

Bookable windows per device.

- `id`
- `device_id`
- `start_time`
- `end_time`
- `order_id`
- `created_at`
- `updated_at`

Constraints:

- `end_time > start_time`
- unique `(device_id, start_time)`

### `orders`

Core mission entity.

- `id`
- `type`
- `status`
- `device_id`
- `operator_id`
- `time_slot_id`
- `origin_point_id`
- `destination_point_id`
- `sender_email`
- `recipient_email`
- `qr_hash`
- `qr_scanned_at`
- `cancellation_reason`
- `cancelled_at`
- `created_at`
- `updated_at`

### `telemetry`

High-frequency location and mission feed.

- `id`
- `device_id`
- `latitude`
- `longitude`
- `battery_level`
- `speed`
- `mission_status`
- `signal_lost`
- `recorded_at`
- `created_at`
- `updated_at`

Current note:

- Product intent says telemetry should be append-only.
- The current schema still includes `updated_at` and an update trigger because the repository standardized timestamps on all current tables.
- If strict append-only enforcement is required, that should be introduced explicitly in a later migration/design pass.

### `alerts`

Auto-generated operational alerts.

- `id`
- `device_id`
- `order_id`
- `type`
- `message`
- `is_read`
- `created_at`
- `updated_at`

### `event_logs`

Order event timeline.

- `id`
- `order_id`
- `event_type`
- `description`
- `created_at`
- `updated_at`

Current note:

- Product intent says event logs should be append-only.
- The current schema still includes `updated_at` and an update trigger for consistency with the rest of the initial schema.

## Triggers

The function `set_updated_at()` updates `updated_at` before update on all current tables.

## Indexes

Implemented indexes:

- `devices(status)`
- `orders(status)`
- `orders(created_at DESC)`
- `telemetry(device_id, recorded_at DESC)`
- partial index on `alerts(is_read)` where unread
- `time_slots(device_id)`
- `time_slots(start_time)`
- `orders(device_id)`
- `orders(operator_id)`
- `alerts(device_id)`
- `alerts(created_at DESC)`
- `event_logs(order_id)`
- `event_logs(created_at DESC)`

## Seed data

The current schema seeds eight campus points:

- Edificio Almendros
- Biblioteca General
- Cafeteria Central
- Edificio Cedros
- Auditorio Mayor
- Edificio El Saman
- Cancha Multiple
- Porteria Principal
