# Referencia de la Base de Datos (DATABASE.md)

## Fuente de Verdad

El esquema actual ejecutado por Docker se encuentra en [database/init.sql](../database/init.sql). Este documento sirve como una referencia en español de fácil lectura para dicho archivo y debe mantenerse alineado con él en todo momento.

---

## 🔌 Conexión desde Herramientas Externas (DBeaver, pgAdmin, etc.)

Si deseas conectarte a la base de datos PostgreSQL desde herramientas de administración externa instaladas en tu máquina local (como **DBeaver**, **pgAdmin** o **DataGrip**), utiliza los siguientes parámetros de conexión:

| Parámetro | Valor |
|---|---|
| **Motor de Base de Datos** | PostgreSQL (versión 15) |
| **Host (Servidor)** | `localhost` (o `127.0.0.1`) |
| **Puerto** | `5432` |
| **Base de Datos** | `fleetcontrol_puj` |
| **Usuario** | `postgres` |
| **Contraseña** | `postgres` |
| **URL de Conexión (URI)** | `postgresql://postgres:postgres@localhost:5432/fleetcontrol_puj` |

> 💡 **Nota para DBeaver**: Al crear la nueva conexión, selecciona el driver de **PostgreSQL**, ingresa los valores anteriores en la pestaña *Main* y haz clic en *Test Connection*. Si Docker está corriendo (`docker compose up`), la conexión debería ser exitosa de inmediato.

---

## Comportamiento en Tiempo de Ejecución (Runtime)

- **Versión de Postgres**: 15 (Alpine).
- **Claves Primarias (UUID)**: Se autogeneran a nivel de base de datos utilizando la función de Postgres `gen_random_uuid()`.
- **Inicialización del Esquema**: Docker ejecuta automáticamente el script `init.sql` únicamente la primera vez que se crea el volumen de la base de datos.
- **Datos Semilla**: Los puntos de encuentro del campus (`campus_points`) se cargan automáticamente durante la inicialización.
- **Persistencia**: Si el volumen de datos de Postgres en Docker ya existe, Postgres omitirá el script de inicialización para preservar los datos modificados.

Para reiniciar el script de inicialización desde cero y limpiar los datos:
```bash
docker compose down -v
docker compose up --build
```

---

## 📊 Enumeraciones (Enums)

- `user_role`: `'operator'`, `'administrator'`
- `device_type`: `'robot'`, `'drone'`
- `device_status`: `'available'`, `'in_mission'`, `'blocked'`, `'maintenance'`
- `order_type`: `'delivery'`, `'recording'`
- `order_status`: `'pending'`, `'in_progress'`, `'completed'`, `'cancelled'`
- `alert_type`: `'signal_loss'`, `'low_battery'`, `'maintenance_required'`, `'weather_blocked'`, `'delivery_timeout'`, `'package_undelivered'`

---

## 🗄️ Tablas y Columnas

### `users` (Usuarios)
Almacena las cuentas de operadores y administradores con control de dominio de correo.
- `id` UUID (Clave primaria autogenerada)
- `email` VARCHAR único (debe ser un correo institucional con verificación de dominio `@javerianacali.edu.co` o `@puj.edu.co`)
- `password_hash` VARCHAR
- `full_name` VARCHAR
- `role` `user_role`
- `is_active` BOOLEAN
- `last_login` TIMESTAMP
- `session_timeout_minutes` INTEGER
- `created_at` TIMESTAMP
- `updated_at` TIMESTAMP

### `campus_points` (Puntos del Campus)
Puntos estáticos o gestionados por administración para origen y destino.
- `id` UUID (Clave primaria)
- `name` VARCHAR único (nombre del punto, ej. "Edificio Almendros")
- `description` TEXT
- `latitude` DECIMAL
- `longitude` DECIMAL
- `is_active` BOOLEAN
- `created_at` TIMESTAMP
- `updated_at` TIMESTAMP

### `devices` (Dispositivos)
Robots y drones disponibles en la flota.
- `id` UUID (Clave primaria)
- `name` VARCHAR
- `code` VARCHAR único (código identificador, ej. `ROB-001`)
- `type` `device_type`
- `status` `device_status`
- `battery_level` INTEGER (Restricción de valor entre `0` y `100`)
- `accumulated_km` DECIMAL (Kilómetros recorridos acumulados)
- `flight_hours` DECIMAL (Horas de vuelo acumuladas, aplica a drones)
- `last_maintenance_date` TIMESTAMP
- `base_latitude` DECIMAL
- `base_longitude` DECIMAL
- `created_at` TIMESTAMP
- `updated_at` TIMESTAMP

### `time_slots` (Franjas Horarias)
Bloques de una hora reservados por dispositivo para evitar conflictos.
- `id` UUID (Clave primaria)
- `device_id` UUID (Clave foránea a `devices`)
- `start_time` TIMESTAMP
- `end_time` TIMESTAMP
- `order_id` UUID (Clave foránea a `orders`)
- `created_at` TIMESTAMP
- `updated_at` TIMESTAMP

*Restricciones*:
- `end_time > start_time`
- Único `(device_id, start_time)` para impedir doble reserva.

### `orders` (Órdenes de Servicio)
Entidad central que coordina las misiones de entrega y grabación.
- `id` UUID (Clave primaria)
- `type` `order_type`
- `status` `order_status`
- `device_id` UUID (Clave foránea a `devices`)
- `operator_id` UUID (Clave foránea a `users`)
- `time_slot_id` UUID (Clave foránea a `time_slots`)
- `origin_point_id` UUID (Clave foránea a `campus_points`)
- `destination_point_id` UUID (Clave foránea a `campus_points`)
- `sender_email` VARCHAR (Correo institucional del remitente)
- `recipient_email` VARCHAR (Correo institucional del destinatario)
- `qr_hash` VARCHAR (Hash único para el código QR de un solo uso)
- `qr_scanned_at` TIMESTAMP
- `cancellation_reason` VARCHAR
- `cancelled_at` TIMESTAMP
- `created_at` TIMESTAMP
- `updated_at` TIMESTAMP

### `telemetry` (Telemetría)
Registro histórico de alta frecuencia enviado por los dispositivos en misión.
- `id` UUID (Clave primaria)
- `device_id` UUID (Clave foránea a `devices`)
- `latitude` DECIMAL
- `longitude` DECIMAL
- `battery_level` INTEGER
- `speed` DECIMAL
- `mission_status` VARCHAR
- `signal_lost` BOOLEAN
- `recorded_at` TIMESTAMP
- `created_at` TIMESTAMP
- `updated_at` TIMESTAMP

### `alerts` (Alertas Operativas)
Alertas generadas automáticamente por pérdida de señal, batería baja, etc.
- `id` UUID (Clave primaria)
- `device_id` UUID (Clave foránea a `devices`)
- `order_id` UUID (Clave foránea a `orders`)
- `type` `alert_type`
- `message` TEXT
- `is_read` BOOLEAN
- `created_at` TIMESTAMP
- `updated_at` TIMESTAMP

### `event_logs` (Bitácora Transaccional)
Línea de tiempo detallada de eventos de cada orden de servicio (**RF-18**).
- `id` UUID (Clave primaria)
- `order_id` UUID (Clave foránea a `orders`)
- `event_type` VARCHAR
- `description` TEXT
- `created_at` TIMESTAMP
- `updated_at` TIMESTAMP

---

## ⚡ Triggers (Desparadores Automáticos)

Todas las tablas cuentan con el trigger `set_updated_at()`, el cual se ejecuta antes de cualquier operación `UPDATE` para mantener la columna `updated_at` con la fecha y hora exactas de la última modificación.

---

## 🔍 Índices (Indexes)

Para optimizar las consultas y búsquedas repetitivas de telemetría y bitácora, se implementan los siguientes índices:
- `devices(status)` - Búsqueda rápida de dispositivos por estado de disponibilidad.
- `orders(status)` y `orders(created_at DESC)` - Carga ágil del listado de órdenes y orden cronológico.
- `telemetry(device_id, recorded_at DESC)` - Optimización para renderizar la última posición en tiempo real.
- Índice parcial en `alerts(is_read)` donde es `false` - Carga ultrarrápida de notificaciones no leídas.
- `time_slots(device_id)` y `time_slots(start_time)` - Verificación instantánea de disponibilidad en el calendario.

---

## 🌱 Datos Iniciales (Seeds)

La inicialización de la base de datos inserta automáticamente 8 puntos predefinidos del campus Javeriano Cali:
1. Edificio Almendros
2. Biblioteca General
3. Cafetería Central
4. Edificio Cedros
5. Auditorio Mayor
6. Edificio El Samán
7. Cancha Múltiple
8. Portería Principal
