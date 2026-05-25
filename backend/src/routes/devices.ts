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
    const { status, subStatus, batteryLevel, accumulatedKm, flightHours, currentRoute } = req.body;

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

    if (batteryLevel !== undefined && batteryLevel < 20 && status === "blocked") {
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

    res.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/devices/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;