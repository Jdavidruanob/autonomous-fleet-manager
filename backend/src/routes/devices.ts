import { Router } from "express";
import { query, queryOne } from "../db";
import type { Device, DeviceRow } from "../types";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const rows = await query<DeviceRow>(
      `SELECT d.*,
              (SELECT t.signal_lost FROM telemetry t WHERE t.device_id = d.id ORDER BY t.recorded_at DESC LIMIT 1) as signal_lost
       FROM devices d
       ORDER BY d.code`
    );

    const devices: Device[] = rows.map((row) => {
      return {
        id: row.id,
        name: row.name,
        code: row.code,
        type: row.type as Device["type"],
        status: row.status as Device["status"],
        subStatus: row.sub_status as Device["subStatus"],
        batteryLevel: Number(row.battery_level),
        accumulatedKm: Number(row.accumulated_km),
        flightHours: Number(row.flight_hours),
        currentRoute:
          row.current_route_origin && row.current_route_destination
            ? { origin: row.current_route_origin, destination: row.current_route_destination }
            : null,
      };
    });

    res.json(devices);
  } catch (err) {
    console.error("GET /api/devices error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const row = await queryOne<DeviceRow & { signal_lost: boolean | null }>(
      `SELECT d.*,
              (SELECT t.signal_lost FROM telemetry t WHERE t.device_id = d.id ORDER BY t.recorded_at DESC LIMIT 1) as signal_lost
       FROM devices d
       WHERE d.id = $1`,
      [id]
    );

    if (!row) {
      return res.status(404).json({ error: "Device not found" });
    }

    const device: Device = {
      id: row.id,
      name: row.name,
      code: row.code,
      type: row.type as Device["type"],
      status: row.status as Device["status"],
      subStatus: row.sub_status as Device["subStatus"],
      batteryLevel: Number(row.battery_level),
      accumulatedKm: Number(row.accumulated_km),
      flightHours: Number(row.flight_hours),
      currentRoute:
        row.current_route_origin && row.current_route_destination
          ? { origin: row.current_route_origin, destination: row.current_route_destination }
          : null,
    };

    res.json(device);
  } catch (err) {
    console.error("GET /api/devices/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, subStatus, batteryLevel, accumulatedKm, flightHours, currentRoute, lastMaintenanceDate } = req.body;

    const existing = await queryOne<DeviceRow>(
      "SELECT * FROM devices WHERE id = $1",
      [id]
    );
    if (!existing) {
      return res.status(404).json({ error: "Device not found" });
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (batteryLevel !== undefined) {
      updates.push(`battery_level = $${paramCount++}`);
      values.push(batteryLevel);
    }
    if (accumulatedKm !== undefined) {
      updates.push(`accumulated_km = $${paramCount++}`);
      values.push(accumulatedKm);
    }
    if (flightHours !== undefined) {
      updates.push(`flight_hours = $${paramCount++}`);
      values.push(flightHours);
    }
    if (currentRoute !== undefined) {
      if (currentRoute) {
        updates.push(`current_route_origin = $${paramCount++}`);
        values.push(currentRoute.origin);
        updates.push(`current_route_destination = $${paramCount++}`);
        values.push(currentRoute.destination);
      } else {
        updates.push(`current_route_origin = $${paramCount++}`);
        values.push(null);
        updates.push(`current_route_destination = $${paramCount++}`);
        values.push(null);
      }
    }
    if (subStatus !== undefined) {
      updates.push(`sub_status = $${paramCount++}`);
      values.push(subStatus);
    }

    if (updates.length > 0) {
      values.push(id);
      await query(
        `UPDATE devices SET ${updates.join(", ")} WHERE id = $${paramCount}`,
        values
      );
    }

    if (
      (accumulatedKm !== undefined && accumulatedKm > 300) ||
      (flightHours !== undefined && flightHours > 50)
    ) {
      await query(
        `UPDATE devices SET status = 'blocked', sub_status = 'mantenimiento' WHERE id = $1`,
        [id]
      );
      const existingAlert = await queryOne(
        `SELECT id FROM alerts WHERE device_id = $1 AND type = 'maintenance_required' AND created_at > NOW() - INTERVAL '5 minutes'`,
        [id]
      );
      if (!existingAlert) {
        await query(
          `INSERT INTO alerts (device_id, type, message) VALUES ($1, 'maintenance_required', $2)`,
          [id, `Device requires maintenance: km=${accumulatedKm}, flightHours=${flightHours}`]
        );
      }
    }

    if (batteryLevel !== undefined && batteryLevel < 20) {
      await query(
        `UPDATE devices SET status = 'blocked', sub_status = 'bateria_baja' WHERE id = $1`,
        [id]
      );
      const existingAlert = await queryOne(
        `SELECT id FROM alerts WHERE device_id = $1 AND type = 'low_battery' AND created_at > NOW() - INTERVAL '5 minutes'`,
        [id]
      );
      if (!existingAlert) {
        await query(
          `INSERT INTO alerts (device_id, type, message) VALUES ($1, 'low_battery', $2)`,
          [id, `Battery level critical: ${batteryLevel}%`]
        );
      }
    }

    if (lastMaintenanceDate !== undefined) {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const mDate = new Date(lastMaintenanceDate);
      if (mDate < oneMonthAgo) {
        await query(
          `UPDATE devices SET status = 'blocked', sub_status = 'mantenimiento' WHERE id = $1`,
          [id]
        );
        const existingAlert = await queryOne(
          `SELECT id FROM alerts WHERE device_id = $1 AND type = 'maintenance_required' AND created_at > NOW() - INTERVAL '5 minutes'`,
          [id]
        );
        if (!existingAlert) {
          await query(
            `INSERT INTO alerts (device_id, type, message) VALUES ($1, 'maintenance_required', $2)`,
            [id, `Device maintenance overdue since ${lastMaintenanceDate}`]
          );
        }
      }
    }

    await query(
      `UPDATE devices
       SET sub_status = 'sin_senal', status = 'blocked'
       WHERE id = $1
         AND status != 'blocked'
         AND sub_status != 'mantenimiento'
         AND sub_status != 'bateria_baja'
         AND sub_status != 'cargando'
         AND (SELECT COALESCE(MAX(t.recorded_at), '1970-01-01'::timestamptz)
              FROM telemetry t WHERE t.device_id = $1) < NOW() - INTERVAL '30 seconds'`,
      [id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/devices/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/telemetry", async (req, res) => {
  try {
    const { id } = req.params;
    const row = await queryOne(
      `SELECT * FROM telemetry WHERE device_id = $1 ORDER BY recorded_at DESC LIMIT 1`,
      [id]
    );
    res.json(row || null);
  } catch (err) {
    console.error("GET /api/devices/:id/telemetry error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/force-return", async (req, res) => {
  try {
    const { id } = req.params;

    const device = await queryOne<DeviceRow>("SELECT * FROM devices WHERE id = $1", [id]);
    if (!device) return res.status(404).json({ error: "Device not found" });

    const activeOrder = await queryOne<{ id: string }>(
      `SELECT id FROM orders WHERE device_id = $1 AND status IN ('pending', 'in_progress') ORDER BY created_at DESC LIMIT 1`,
      [id]
    );

    if (activeOrder) {
      await query(
        `UPDATE orders SET status = 'cancelled', cancelled_at = NOW(), cancellation_reason = 'Retorno forzado a base por operador' WHERE id = $1`,
        [activeOrder.id]
      );
      await query(
        `INSERT INTO event_logs (order_id, event_type, description) VALUES ($1, 'cancelled', 'Retorno forzado a base. Paquete no entregado.')`,
        [activeOrder.id]
      );
      await query(
        `INSERT INTO alerts (device_id, order_id, type, message) VALUES ($1, $2, 'package_undelivered', 'Dispositivo forzado a regresar a base')`,
        [id, activeOrder.id]
      );
    }

    await query(
      `UPDATE devices SET status = 'available', sub_status = 'en_base', current_route_origin = null, current_route_destination = null WHERE id = $1`,
      [id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("POST /api/devices/:id/force-return error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/cancel-order", async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const device = await queryOne<DeviceRow>("SELECT * FROM devices WHERE id = $1", [id]);
    if (!device) return res.status(404).json({ error: "Device not found" });

    const activeOrder = await queryOne<{ id: string }>(
      `SELECT id FROM orders WHERE device_id = $1 AND status IN ('pending', 'in_progress') ORDER BY created_at DESC LIMIT 1`,
      [id]
    );

    if (activeOrder) {
      await query(
        `UPDATE orders SET status = 'cancelled', cancelled_at = NOW(), cancellation_reason = $2 WHERE id = $1`,
        [activeOrder.id, reason || "Cancelado por el operador"]
      );
      await query(
        `INSERT INTO event_logs (order_id, event_type, description) VALUES ($1, 'cancelled', $2)`,
        [activeOrder.id, `Orden cancelada por el operador. Razón: ${reason || "Cancelado por el operador"}`]
      );
    }

    await query(
      `UPDATE devices SET status = 'available', sub_status = 'en_base', current_route_origin = null, current_route_destination = null WHERE id = $1`,
      [id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("POST /api/devices/:id/cancel-order error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;