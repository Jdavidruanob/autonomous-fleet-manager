import { Router } from "express";
import { query } from "../db";
import { getIo } from "../socket";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const {
      deviceId, latitude, longitude, batteryLevel, speed,
      missionStatus, signalLost, sensorsStatus, temperature,
      cameraStatus, currentOrderId,
    } = req.body;

    if (!deviceId || latitude === undefined || longitude === undefined || batteryLevel === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await query(
      `INSERT INTO telemetry
         (device_id, latitude, longitude, battery_level, speed, mission_status,
          signal_lost, sensors_status, temperature, camera_status, current_order_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [deviceId, latitude, longitude, batteryLevel, speed ?? null,
       missionStatus ?? null, signalLost ?? false, sensorsStatus ?? "normal",
       temperature ?? null, cameraStatus ?? "off", currentOrderId ?? null]
    );

    if (!signalLost) {
      await query(
        `UPDATE devices
         SET battery_level = $2,
             status = CASE WHEN status = 'blocked' AND sub_status = 'sin_senal'
                           THEN 'available'::device_status ELSE status END,
             sub_status = CASE WHEN status = 'blocked' AND sub_status = 'sin_senal'
                               THEN 'en_base' ELSE sub_status END
         WHERE id = $1`,
        [deviceId, batteryLevel]
      );
    } else {
      await query(
        `UPDATE devices SET battery_level=$2, status='blocked', sub_status='sin_senal' WHERE id=$1`,
        [deviceId, batteryLevel]
      );
    }

    // Broadcast to all connected clients
    try {
      getIo().emit("telemetry:update", {
        deviceId, latitude, longitude, batteryLevel, speed,
        missionStatus, signalLost, sensorsStatus, temperature,
        cameraStatus, currentOrderId,
        recordedAt: new Date().toISOString(),
      });
    } catch { /* socket not ready */ }

    res.json({ success: true });
  } catch (err) {
    console.error("POST /api/telemetry error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
