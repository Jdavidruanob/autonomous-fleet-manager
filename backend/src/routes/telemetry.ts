import { Router } from "express";
import { query } from "../db";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { deviceId, latitude, longitude, batteryLevel, speed, missionStatus, signalLost } = req.body;

    if (!deviceId || latitude === undefined || longitude === undefined || batteryLevel === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await query(
      `INSERT INTO telemetry (device_id, latitude, longitude, battery_level, speed, mission_status, signal_lost)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [deviceId, latitude, longitude, batteryLevel, speed ?? null, missionStatus ?? null, signalLost ?? false]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("POST /api/telemetry error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;