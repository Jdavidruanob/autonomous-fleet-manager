import { Router } from "express";
import { query } from "../db";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const rows = await query<{ id: string; name: string; latitude: number; longitude: number }>(
      `SELECT id, name, latitude, longitude FROM campus_points WHERE is_active = true ORDER BY name`
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /api/campus-points error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;